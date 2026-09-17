import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";
import { Calendar, Printer, Trophy } from "lucide-react-native";
import GrandmaSuperbowl from "@/components/GrandmaSuperbowl";
import {
  getSeasonStandings,
  getWeekResultsUpTo,
  type Standing,
  type WeekResult,
} from "@/services/seasonTracker";
import { getCurrentNFLWeek } from "@/services/espnClient";
import { printSeasonReport } from "@/utils/seasonPrint";

export default function SeasonTrackerScreen() {
  const insets = useSafeAreaInsets();
  const [showGrandmaModal, setShowGrandmaModal] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const weekQuery = trpc.weeks.getCurrent.useQuery();
  const seasonStatsQuery = trpc.leaderboard.getSeason.useQuery();
  const week = weekQuery.data?.week ?? getCurrentNFLWeek();

  // Season standings accumulated from permanently stored weekly results.
  const [standings, setStandings] = useState<Standing[]>([]);
  const [weekResults, setWeekResults] = useState<WeekResult[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    getSeasonStandings(week)
      .then((s) => {
        if (!cancelled) setStandings(s);
      })
      .catch(() => {});
    getWeekResultsUpTo(week)
      .then((rs) => {
        if (!cancelled) setWeekResults(rs);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [week]);

  const usingFirebase = standings.some((s) => s.weeklyWins > 0 || s.totalPoints > 0);
  const isSuperbowl = week >= 18;
  const handlePrint = async (): Promise<void> => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      await printSeasonReport({ currentWeek: week, standings, weekResults });
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : "The report could not be opened. Please try again.";
      Alert.alert("Unable to print", message);
    } finally {
      setIsPrinting(false);
    }
  };

  const seasonWinner = usingFirebase
    ? standings[0]
      ? {
          name: standings[0].name,
          emoji: standings[0].emoji,
          totalWins: standings[0].weeklyWins,
        }
      : undefined
    : seasonStatsQuery.data?.[0];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.headerText}>📊 Season Tracker</Text>
        <Text style={styles.subHeader}>2026-2027 NFL Season</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Calendar size={32} color="#FC4C02" />
            <Text style={styles.statValue}>{week}</Text>
            <Text style={styles.statLabel}>Current Week</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={32} color="#FFD700" />
            <Text style={styles.statValue}>{18 - week}</Text>
            <Text style={styles.statLabel}>Weeks Left</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Overall Standings</Text>

        {(usingFirebase ? standings : seasonStatsQuery.data ?? []).map(
          (player, index) => {
            const weeklyWins = "weeklyWins" in player ? player.weeklyWins : (player as { totalWins: number }).totalWins;
            const totalPoints = "totalPoints" in player ? player.totalPoints : (player as { winRate: number }).winRate;
            const pointsLabel = "totalPoints" in player ? "Season Pts" : "Win Rate";
            return (
            <View
              key={player.uid}
              style={[
                styles.playerCard,
                index === 0 && styles.playerCardFirst,
              ]}
            >
              <View style={styles.playerLeft}>
                <Text style={styles.playerRank}>
                  {index === 0 ? "👑" : `#${index + 1}`}
                </Text>
                <View>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerEmoji}>{player.emoji}</Text>
                </View>
              </View>
              <View style={styles.playerStats}>
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeLabel}>Weekly Wins</Text>
                  <Text style={styles.statBadgeValue}>🏆 {weeklyWins}</Text>
                </View>
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeLabel}>{pointsLabel}</Text>
                  <Text style={styles.statBadgeValue}>{totalPoints}</Text>
                </View>
              </View>
            </View>
            );
          }
        )}

        {isSuperbowl && seasonWinner && (
          <>
            <GrandmaSuperbowl
              visible={showGrandmaModal}
              onClose={() => setShowGrandmaModal(false)}
              seasonWinner={{
                name: seasonWinner.name,
                emoji: seasonWinner.emoji,
                totalWins: seasonWinner.totalWins,
              }}
            />
            <TouchableOpacity
              style={styles.superbowlCard}
              onPress={() => setShowGrandmaModal(true)}
            >
              <Text style={styles.superbowlEmoji}>🏆</Text>
              <Text style={styles.superbowlTitle}>Super Bowl Special!</Text>
              <Text style={styles.superbowlText}>
                Tap to see Grandma&apos;s special message
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.weekHistory}>
          <View style={styles.weekHistoryHeader}>
            <View style={styles.weekHistoryTitleGroup}>
              <Text style={styles.sectionTitle}>Week by Week</Text>
              <Text style={styles.printHint}>Print the full season or save it as a PDF</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Print week-by-week season report"
              activeOpacity={0.75}
              disabled={isPrinting}
              onPress={handlePrint}
              style={[styles.printButton, isPrinting && styles.printButtonDisabled]}
            >
              <Printer size={17} color="#FFFFFF" />
              <Text style={styles.printButtonText}>{isPrinting ? "Opening…" : "Print"}</Text>
            </TouchableOpacity>
          </View>
          {Array.from({ length: week - 1 }, (_, i) => i + 1)
            .reverse()
            .map((wk) => {
              const result = weekResults.find((r) => r.week === wk);
              const winners = result?.hasWinner
                ? result.results
                    .filter((r) => r.isWinner)
                    .map((r) => `${r.emoji} ${r.name}`)
                    .join(" & ")
                : null;
              return (
                <View key={wk} style={styles.weekCard}>
                  <View style={styles.weekLeft}>
                    <Text style={styles.weekNumber}>Week {wk}</Text>
                    <Text style={styles.weekDate}>
                      {winners
                        ? `Winner: ${winners}`
                        : result
                          ? "No picks — wash for everyone"
                          : "No results yet"}
                    </Text>
                  </View>
                  {winners && <Text style={styles.weekArrow}>🏆</Text>}
                </View>
              );
            })}
          {weekResults.length === 0 && (
            <Text style={styles.weekDate}>
              No weeks completed yet — the race starts with the next final whistle!
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
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
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  subHeader: {
    fontSize: 14,
    color: "#E1E8ED",
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#0b1220",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#E1E8ED",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 12,
    marginTop: 8,
  },
  playerCard: {
    backgroundColor: "#0b1220",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  playerCardFirst: {
    borderColor: "#FFD700",
    backgroundColor: "#FFD70010",
  },
  playerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  playerRank: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    width: 40,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  playerEmoji: {
    fontSize: 14,
    marginTop: 2,
  },
  playerStats: {
    flexDirection: "row",
    gap: 12,
  },
  statBadge: {
    flex: 1,
    backgroundColor: "#002C5F",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  statBadgeLabel: {
    fontSize: 10,
    color: "#E1E8ED",
    marginBottom: 4,
  },
  statBadgeValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FC4C02",
  },
  superbowlCard: {
    backgroundColor: "#FFD70020",
    borderRadius: 14,
    padding: 24,
    marginTop: 16,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  superbowlEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  superbowlTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFD700",
    marginBottom: 8,
  },
  superbowlText: {
    fontSize: 14,
    color: "#E1E8ED",
    textAlign: "center",
  },
  weekHistory: {
    marginTop: 24,
    paddingBottom: 28,
  },
  weekHistoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  weekHistoryTitleGroup: {
    flex: 1,
  },
  printHint: {
    color: "#B8C7D9",
    fontSize: 11,
    marginTop: -8,
  },
  printButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "#FC4C02",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  printButtonDisabled: {
    opacity: 0.65,
  },
  printButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  weekCard: {
    backgroundColor: "#0b1220",
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weekLeft: {
    flex: 1,
  },
  weekNumber: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  weekDate: {
    fontSize: 12,
    color: "#E1E8ED",
    marginTop: 2,
  },
  weekArrow: {
    fontSize: 18,
    color: "#E1E8ED",
  },
});
