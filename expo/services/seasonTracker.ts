/**
 * Season tracker — permanent weekly wins + season standings.
 *
 * Picks and weekly results are stored in Firestore so they survive server
 * restarts and are shared across every family member's device. Scoring:
 * 1 point per correct pick. When every game of a week is FINAL the week is
 * "settled": the member(s) with the most correct picks share the weekly win.
 * A week where nobody scored (e.g. Week 1, which the family missed) produces
 * no winner and no wins — a wash for everyone.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { fetchWeekGames } from "@/services/espnClient";
import { assertWeeklyPicksOpen } from "@/utils/weeklyPickDeadline";

export interface FamilyMember {
  id: string;
  name: string;
  emoji: string;
}

export const FAMILY_MEMBERS: FamilyMember[] = [
  { id: "1", name: "Grandma", emoji: "👵" },
  { id: "2", name: "Dave", emoji: "👨" },
  { id: "3", name: "Grandpa", emoji: "👴" },
  { id: "4", name: "John", emoji: "👨" },
  { id: "5", name: "Nena", emoji: "👩" },
  { id: "6", name: "Zaky", emoji: "🧑" },
  { id: "7", name: "Robert", emoji: "🧑" },
  { id: "8", name: "Rd", emoji: "🧑" },
  { id: "11", name: "Janet", emoji: "👩" },
];

export type GamePick = "home" | "away";

export interface MemberWeekResult {
  uid: string;
  name: string;
  emoji: string;
  correct: number;
  total: number;
  isWinner: boolean;
}

export interface WeekResult {
  week: number;
  /** True when at least one member scored above zero this week. */
  hasWinner: boolean;
  winnerIds: string[];
  results: MemberWeekResult[];
  settledAt: string;
}

export interface Standing {
  uid: string;
  name: string;
  emoji: string;
  /** Number of weekly wins (shared wins count for each winner). */
  weeklyWins: number;
  /** Total correct picks across all settled weeks (tiebreaker). */
  totalPoints: number;
  weeksPlayed: number;
}

const picksDoc = (userId: string, week: number) =>
  doc(db, "picks", `${userId}_${week}`);
const weekResultDoc = (week: number) => doc(db, "weeklyResults", `${week}`);

/** Permanently save a member's picks for a week. */
export async function savePicks(
  userId: string,
  week: number,
  picks: Record<string, GamePick>
): Promise<void> {
  const games = await fetchWeekGames(week);
  assertWeeklyPicksOpen(games, picks);
  await runTransaction(db, async (transaction) => {
    const ref = picksDoc(userId, week);
    const existing = await transaction.get(ref);
    if (existing.exists()) {
      throw new Error("These weekly picks have already been submitted and cannot be changed.");
    }
    // Recheck on every retry, including if another device submits concurrently.
    assertWeeklyPicksOpen(games, picks);
    transaction.set(ref, {
      userId,
      week,
      picks,
      timestamp: new Date().toISOString(),
      locked: true,
    });
  });
}

/** Watch submissions; only a server-confirmed missing document permits editing. */
export function watchSubmittedPicks(
  userId: string,
  week: number,
  onPicks: (picks: Record<string, GamePick> | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(picksDoc(userId, week), { includeMetadataChanges: true }, (snap) => {
    // Do not treat a local, unconfirmed write as a successful submission.
    if (snap.metadata.hasPendingWrites) return;
    if (snap.exists()) {
      // Any existing submission is locked, including legacy documents.
      onPicks((snap.data().picks as Record<string, GamePick> | undefined) ?? {});
    } else if (!snap.metadata.fromCache) {
      onPicks(null);
    }
  }, onError);
}

/** Load a member's permanently saved picks for a week (null if none). */
export async function loadPicks(
  userId: string,
  week: number
): Promise<Record<string, GamePick> | null> {
  try {
    const snap = await getDoc(picksDoc(userId, week));
    if (!snap.exists()) return null;
    const data = snap.data() as { picks?: Record<string, GamePick> };
    return data.picks ?? null;
  } catch {
    return null;
  }
}

/** Read a previously settled week (null if not settled yet). */
export async function getWeekResult(
  week: number
): Promise<WeekResult | null> {
  try {
    const snap = await getDoc(weekResultDoc(week));
    if (!snap.exists()) return null;
    return snap.data() as WeekResult;
  } catch {
    return null;
  }
}

/**
 * Score a finished week and store the result permanently.
 * Winners are everyone tied at the top score (when that score is > 0).
 */
export async function settleWeek(week: number): Promise<WeekResult | null> {
  const games = await fetchWeekGames(week);
  if (games.length === 0) return null;

  const allFinal = games.every((g) => g.completed);
  if (!allFinal) return null;

  const results: MemberWeekResult[] = await Promise.all(
    FAMILY_MEMBERS.map(async (member) => {
      const picks = await loadPicks(member.id, week);
      const pickable = games.filter((g) => !isKickoffPassed(g.kickoff));
      let correct = 0;
      if (picks) {
        for (const game of games) {
          const pick = picks[game.id];
          if (pick && game.winner && pick === game.winner) correct++;
        }
      }
      return {
        uid: member.id,
        name: member.name,
        emoji: member.emoji,
        correct,
        total: pickable.length,
        isWinner: false,
      };
    })
  );

  const topScore = Math.max(...results.map((r) => r.correct));
  const hasWinner = topScore > 0;
  if (hasWinner) {
    for (const r of results) r.isWinner = r.correct === topScore;
  }

  const weekResult: WeekResult = {
    week,
    hasWinner,
    winnerIds: results.filter((r) => r.isWinner).map((r) => r.uid),
    results,
    settledAt: new Date().toISOString(),
  };

  await setDoc(weekResultDoc(week), weekResult);
  return weekResult;
}

/**
 * Get a week's settled result, settling it on the fly if every game is final
 * but nobody has scored it yet. Returns null while games are still in play.
 */
export async function ensureWeekResult(
  week: number
): Promise<WeekResult | null> {
  const existing = await getWeekResult(week);
  if (existing) return existing;
  try {
    return await settleWeek(week);
  } catch {
    return null;
  }
}

/** Season-long accumulation: weekly wins + total points per member. */
export async function getSeasonStandings(
  currentWeek: number
): Promise<Standing[]> {
  const standings = new Map<string, Standing>(
    FAMILY_MEMBERS.map((m) => [
      m.id,
      {
        uid: m.id,
        name: m.name,
        emoji: m.emoji,
        weeklyWins: 0,
        totalPoints: 0,
        weeksPlayed: 0,
      },
    ])
  );

  // Include the current week: it settles the moment its last game goes
  // final (settleWeek returns null while games are still in play).
  for (let week = 1; week <= currentWeek; week++) {
    const result = await ensureWeekResult(week);
    if (!result) continue;
    for (const r of result.results) {
      const s = standings.get(r.uid);
      if (!s) continue;
      s.totalPoints += r.correct;
      if (r.correct > 0 || r.total > 0) s.weeksPlayed += 1;
      if (r.isWinner) s.weeklyWins += 1;
    }
  }

  return Array.from(standings.values()).sort(
    (a, b) =>
      b.weeklyWins - a.weeklyWins || b.totalPoints - a.totalPoints
  );
}

/** The most recent week that has been settled (for "last week's winner"). */
export async function getLastSettledWeek(
  currentWeek: number
): Promise<WeekResult | null> {
  for (let week = currentWeek; week >= 1; week--) {
    const result = await ensureWeekResult(week);
    if (result) return result;
  }
  return null;
}

/** All settled weeks from 1 up to (not including) the current week. */
export async function getWeekResultsUpTo(
  currentWeek: number
): Promise<WeekResult[]> {
  const results: WeekResult[] = [];
  for (let week = 1; week <= currentWeek; week++) {
    const result = await ensureWeekResult(week);
    if (result) results.push(result);
  }
  return results;
}

function isKickoffPassed(kickoff: string): boolean {
  return new Date() >= new Date(kickoff);
}

/** Remove the connectivity-test document created while wiring things up. */
export async function cleanupTestDoc(): Promise<void> {
  try {
    await deleteDoc(doc(db, "testPing", "hello"));
  } catch {
    // Non-critical housekeeping.
  }
}

export { collection, getDocs };
