import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const weekQuery = trpc.weeks.getCurrent.useQuery();
  const leaderboardQuery = trpc.leaderboard.get.useQuery(
    { week: weekQuery.data?.week || 9 },
    { enabled: !!weekQuery.data }
  );

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.headerText}>🏆 Weekly Leaderboard</Text>
        <Text style={styles.subHeader}>
          Week {weekQuery.data?.week || "..."}
        </Text>
      </View>

      {!leaderboardQuery.data?.unlocked ? (
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedEmoji}>🔒</Text>
          <Text style={styles.lockedText}>
            Results locked! Grandma will reveal soon!
          </Text>
          <Text style={styles.lockedSubtext}>Check back Tuesday 9 AM</Text>
        </View>
      ) : (
        <View style={styles.leaderboardContainer}>
          {leaderboardQuery.data?.data.map((entry) => (
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
                <Text style={styles.name}>{entry.name}</Text>
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
        </View>
      )}
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
  lockedContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 60,
  },
  lockedEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  lockedText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  lockedSubtext: {
    fontSize: 14,
    color: "#E1E8ED",
    textAlign: "center",
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
});
