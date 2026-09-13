import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import WinnerCelebration from "@/components/WinnerCelebration";
import {
  getSeasonStandings,
  getLastSettledWeek,
  loadPicks,
  FAMILY_MEMBERS,
  type Standing,
  type WeekResult,
  type GamePick,
} from "@/services/seasonTracker";
import { fetchWeekGames, getCurrentNFLWeek } from "@/services/espnClient";

interface WeeklyRow {
  uid: string;
  name: string;
  emoji: string;
  points: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [showCelebration, setShowCelebration] = useState(false);
  const weekQuery = trpc.weeks.getCurrent.useQuery();
  const week = weekQuery.data?.week ?? getCurrentNFLWeek();
  const leaderboardQuery = trpc.leaderboard.get.useQuery(
    { week },
    { retry: 1 }
  );

  // Season race + last week's winner, stored permanently in Firebase.
  const [standings, setStandings] = useState<Standing[]>([]);
  const [lastWeekResult, setLastWeekResult] = useState<WeekResult | null>(null);
  useEffect(() => {
    let cancelled = false;
    getSeasonStandings(week)
      .then((s) => {
        if (!cancelled) setStandings(s);
      })
      .catch(() => {});
    getLastSettledWeek(week)
      .then((r) => {
        if (!cancelled) setLastWeekResult(r);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [week]);

  // Fallback: if the pick server is down, score the current week straight
  // from Firebase picks + ESPN results so the weekly board still fills in.
  const [liveWeekly, setLiveWeekly] = useState<WeeklyRow[]>([]);
  useEffect(() => {
    const backendRows = leaderboardQuery.data?.data;
    if (backendRows && backendRows.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const games = await fetchWeekGames(week);
        const rows = await Promise.all(
          FAMILY_MEMBERS.map(async (m) => {
            const picks = await loadPicks(m.id, week);
            let points = 0;
            if (picks) {
              for (const g of games) {
                const p: GamePick | undefined = picks[g.id];
                if (p && g.winner && p === g.winner) points++;
              }
            }
            return { uid: m.id, name: m.name, emoji: m.emoji, points, rank: 0 };
          })
        );
        if (cancelled) return;
        rows.sort((a, b) => b.points - a.points);
        rows.forEach((r, i) => (r.rank = i + 1));
        setLiveWeekly(rows);
      } catch {
        // Leave the board empty; the season race below still works.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [week, leaderboardQuery.data]);

  const weeklyRows: WeeklyRow[] =
    leaderboardQuery.data?.data && leaderboardQuery.data.data.length > 0
      ? leaderboardQuery.data.data.map((e) => ({
          uid: e.uid,
          name: e.name,
          emoji: FAMILY_MEMBERS.find((m) => m.id === e.uid)?.emoji ?? "",
          points: e.points,
          rank: e.rank,
        }))
      : liveWeekly;

  useEffect(() => {
    if (leaderboardQuery.data?.data[0]) {
      const timer = setTimeout(() => {
        setShowCelebration(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [leaderboardQuery.data?.data]);

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  const winner = leaderboardQuery.data?.data[0];
  const weekWinnerNames = lastWeekResult?.hasWinner
    ? lastWeekResult.results
        .filter((r) => r.isWinner)
        .map((r) => `${r.emoji} ${r.name}`)
        .join(" & ")
    : null;

  return (
    <ScrollView style={styles.container}>
      {winner && (
        <WinnerCelebration
          visible={showCelebration}
          winnerName={winner.name}
          winnerPoints={winner.points}
          onClose={() => setShowCelebration(false)}
        />
      )}
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.headerText}>🏆 Weekly Leaderboard</Text>
        <Text style={styles.subHeader}>Week {week}</Text>
      </View>

      {lastWeekResult && (
        <View style={styles.lastWeekBanner}>
          <Text style={styles.lastWeekTitle}>
            {weekWinnerNames
              ? `Week ${lastWeekResult.week} Winner: ${weekWinnerNames}`
              : `Week ${lastWeekResult.week}: everyone missed — no points`}
          </Text>
          {weekWinnerNames && (
            <Text style={styles.lastWeekSub}>
              {lastWeekResult.results[0]?.correct ?? 0} correct picks
            </Text>
          )}
        </View>
      )}

      <View style={styles.leaderboardContainer}>
        {weeklyRows.map((entry) => (
          <View
            key={entry.uid}
            style={[
              styles.entryCard,
              entry.rank <= 3 && styles.topThreeCard,
            ]}
          >
            <View style={styles.entryLeft}>
              <Text style={styles.rank}>
                {getMedalEmoji(entry.rank) || `#${entry.rank}`}
              </Text>
              <Text style={styles.name}>
                {entry.emoji ? `${entry.emoji} ` : ""}
                {entry.name}
              </Text>
            </View>
            <Text style={styles.points}>{entry.points} pts</Text>
          </View>
        ))}
        
        {leaderboardQuery.data?.data[0] && (
          <View style={styles.trophy}>
            <Text style={styles.trophyText}>
              🏆 Grandma approves this week&apos;s winner!
            </Text>
          </View>
        )}

        {standings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🏁 Season Race</Text>
            {standings.map((s, index) => (
              <View
                key={s.uid}
                style={[styles.entryCard, index === 0 && styles.seasonLeaderCard]}
              >
                <View style={styles.entryLeft}>
                  <Text style={styles.rank}>
                    {index === 0 ? "👑" : `#${index + 1}`}
                  </Text>
                  <View>
                    <Text style={styles.name}>
                      {s.emoji} {s.name}
                    </Text>
                    <Text style={styles.pointsSub}>
                      {s.totalPoints} pts this season
                    </Text>
                  </View>
                </View>
                <Text style={styles.winsBadge}>🏆 {s.weeklyWins}</Text>
              </View>
            ))}
            <Text style={styles.seasonFootnote}>
              Weekly winners accumulate — most 🏆 at the end takes the season!
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#002C5F",
  },
  header: {
    backgroundColor: "#008E97",
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subHeader: {
    fontSize: 16,
    color: "#E1E8ED",
    marginTop: 4,
  },

  leaderboardContainer: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: "#0b1220",
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topThreeCard: {
    borderWidth: 2,
    borderColor: "#FC4C02",
  },
  entryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rank: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    width: 40,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  points: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FC4C02",
  },
  trophy: {
    backgroundColor: "#008E97",
    borderRadius: 14,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
  },
  trophyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  lastWeekBanner: {
    backgroundColor: "#0b1220",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: 14,
    padding: 14,
    margin: 16,
    marginBottom: 0,
    alignItems: "center",
  },
  lastWeekTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFD700",
    textAlign: "center",
  },
  lastWeekSub: {
    fontSize: 12,
    color: "#E1E8ED",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 24,
    marginBottom: 10,
  },
  pointsSub: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  winsBadge: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFD700",
  },
  seasonLeaderCard: {
    borderWidth: 2,
    borderColor: "#FFD700",
    backgroundColor: "#FFD70010",
  },
  seasonFootnote: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 10,
  },
});
