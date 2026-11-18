import { doc, getDocFromServer, runTransaction, terminate } from "firebase/firestore";
import { db } from "../config/firebase";
import { FAMILY_MEMBERS, type GamePick, type WeekResult } from "../services/seasonTracker";

// Defaults to read-only. Run with --apply to fix the audited result documents.
const repairWeeks = new Set([2, 3, 4, 6, 7, 8, 9, 10]);
const weeks = Array.from({ length: 10 }, (_, index) => index + 1);
const resultRef = (week: number) => doc(db, "weeklyResults", String(week));
const pickRef = (week: number, uid: string) => doc(db, "picks", `${uid}_${week}`);
const soleWinners: Partial<Record<number, string>> = { 4: "2", 5: "2", 7: "6" };
const expected = "7:2:85,2:2:84,3:1:84,4:1:84,5:1:84,8:1:81,6:1:75,1:0:71,11:0:0";

// Firestore can return map fields in different orders on successive reads.
function canonicalJson(value: unknown): string | undefined {
  return JSON.stringify(value, (_key, item: unknown) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) return item;
    return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)));
  });
}

function sameData(a: unknown, b: unknown): boolean {
  return canonicalJson(a) === canonicalJson(b);
}

function summarize(results: WeekResult[]) {
  return FAMILY_MEMBERS.map(({ id, name }) => ({
    id, name,
    wins: results.filter((week) => week.results.some((row) => row.uid === id && row.isWinner)).length,
    points: results.reduce((sum, week) => sum + (week.results.find((row) => row.uid === id)?.correct ?? 0), 0),
  })).sort((a, b) => b.wins - a.wins || b.points - a.points);
}

async function prepare(week: number) {
  const before = (await getDocFromServer(resultRef(week))).data() as WeekResult | undefined;
  if (!before || before.week !== week) throw new Error(`Unexpected saved result for Week ${week}`);
  if (!repairWeeks.has(week)) return { week, before, after: before, picks: [] };

  const response = await fetch(`https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${week}`);
  if (!response.ok) throw new Error(`ESPN read failed for Week ${week}`);
  const data = await response.json() as {
    season?: { year: number; type: number };
    week?: { number: number };
    events?: { id: string; status: { type: { completed: boolean } }; competitions: {
      competitors: { homeAway: string; score: string }[];
    }[] }[];
  };
  if (data.season?.year !== 2026 || data.season.type !== 2 || data.week?.number !== week || !data.events?.length) {
    throw new Error(`ESPN returned the wrong slate for Week ${week}`);
  }
  const winners = new Map<string, GamePick | null>();
  for (const event of data.events) {
    const opponents = event.competitions[0]?.competitors;
    const home = opponents?.find((team) => team.homeAway === "home")?.score;
    const away = opponents?.find((team) => team.homeAway === "away")?.score;
    if (!event.status.type.completed || !home?.match(/^\d+$/) || !away?.match(/^\d+$/) || winners.has(event.id)) {
      throw new Error(`Unverified final score in Week ${week}`);
    }
    winners.set(event.id, Number(home) === Number(away) ? null : Number(home) > Number(away) ? "home" : "away");
  }

  const picks = await Promise.all(before.results.map(async (row) => {
    const ref = pickRef(week, row.uid);
    const document = (await getDocFromServer(ref)).data();
    const choices = Object.entries(document?.picks ?? {});
    if (choices.some(([id, pick]) => !winners.has(id) || (pick !== "home" && pick !== "away"))) {
      throw new Error(`Saved picks do not match ESPN in Week ${week}, member ${row.uid}`);
    }
    return { ref, document, row: { ...row, total: choices.length, correct: choices.filter(([id, pick]) => winners.get(id) === pick).length } };
  }));
  const top = Math.max(...picks.map(({ row }) => row.correct));
  if (top <= 0) throw new Error(`Week ${week} did not produce a verified winner`);
  const scored = picks.map(({ row }) => row);
  const existingScores = before.hasWinner || before.winnerIds.length > 0 || before.results.some((row) => row.correct !== 0 || row.isWinner);
  if (existingScores && !sameData(before.results.map(({ correct }) => correct), scored.map(({ correct }) => correct))) {
    throw new Error(`Refusing to overwrite a differing non-zero result for Week ${week}`);
  }
  const soleWinner = soleWinners[week];
  const results = (existingScores ? before.results : scored).map((row) => ({
    ...row,
    isWinner: soleWinner ? row.uid === soleWinner : row.correct === top,
  }));
  const after = { ...before, hasWinner: true, results, winnerIds: results.filter((row) => row.isWinner).map((row) => row.uid) };
  if (sameData(before, after)) return { week, before, after: before, picks: [] };
  if (existingScores && !soleWinner) throw new Error(`Refusing to change win credit for Week ${week}`);
  return { week, before, after, picks };
}

try {
  if (db.app.options.projectId !== "danobet-nfl-family-pool") throw new Error("Unexpected Firebase project");
  const plan = await Promise.all(weeks.map(prepare));
  const changes = plan.filter(({ before, after }) => before !== after);
  const standings = summarize(plan.map(({ after }) => after));
  if (standings.map(({ id, wins, points }) => `${id}:${wins}:${points}`).join(",") !== expected) {
    throw new Error("Proposed totals differ from the audited standings; nothing was written");
  }
  console.log(JSON.stringify({ weeksToRepair: changes.map(({ week }) => week), standings }, null, 2));
  if (process.argv.includes("--apply")) {
    if (changes.length) {
      await runTransaction(db, async (transaction) => {
        // Re-read every dependency before writing. Abort together if data has changed.
        await Promise.all(plan.flatMap(({ week, before, picks }) => [
          transaction.get(resultRef(week)).then((current) => {
            if (!sameData(current.data(), before)) throw new Error(`Week ${week} result changed`);
          }),
          ...picks.map(({ ref, document }) => transaction.get(ref).then((current) => {
            if (!sameData(current.data(), document)) throw new Error(`Picks changed for ${ref.id}`);
          })),
        ]));
        for (const { week, after } of changes) transaction.set(resultRef(week), after);
      });
    }
    const saved = await Promise.all(weeks.map(async (week) => (await getDocFromServer(resultRef(week))).data() as WeekResult));
    const verified = summarize(saved);
    if (verified.map(({ id, wins, points }) => `${id}:${wins}:${points}`).join(",") !== expected) {
      throw new Error("Live read-back did not match the audited standings");
    }
    console.log(JSON.stringify({ verified: true, standings: verified, week10: saved[9].results.filter((row) => row.isWinner) }));
  }
} finally {
  await terminate(db);
}
