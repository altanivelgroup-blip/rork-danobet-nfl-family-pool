import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";
import { Calendar, Trophy } from "lucide-react-native";
import GrandmaSuperbowl from "@/components/GrandmaSuperbowl";

export default function SeasonTrackerScreen() {
  const insets = useSafeAreaInsets();
  const [showGrandmaModal, setShowGrandmaModal] = useState(false);
  const weekQuery = trpc.weeks.getCurrent.useQuery();
  const seasonStatsQuery = trpc.leaderboard.getSeason.useQuery();

  const isSuperbowl = (weekQuery.data?.week || 0) >= 18;
  const seasonWinner = seasonStatsQuery.data?.[0];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.headerText}>📊 Season Tracker</Text>
        <Text style={styles.subHeader}>2025-2026 NFL Season</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Calendar size={32} color="#FC4C02" />
            <Text style={styles.statValue}>{weekQuery.data?.week || 1}</Text>
            <Text style={styles.statLabel}>Current Week</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={32} color="#FFD700" />
            <Text style={styles.statValue}>
              {18 - (weekQuery.data?.week || 1)}
            </Text>
            <Text style={styles.statLabel}>Weeks Left</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Overall Standings</Text>

        {seasonStatsQuery.data?.map((player, index) => (
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
                <Text style={styles.statBadgeLabel}>Total Wins</Text>
                <Text style={styles.statBadgeValue}>{player.totalWins}</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeLabel}>Win Rate</Text>
                <Text style={styles.statBadgeValue}>
                  {player.winRate}%
                </Text>
              </View>
            </View>
          </View>
        ))}

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
          <Text style={styles.sectionTitle}>Week by Week</Text>
          {Array.from({ length: weekQuery.data?.week || 1 }, (_, i) => i + 1)
            .reverse()
            .map((week) => (
              <TouchableOpacity key={week} style={styles.weekCard}>
                <View style={styles.weekLeft}>
                  <Text style={styles.weekNumber}>Week {week}</Text>
                  <Text style={styles.weekDate}>Completed</Text>
                </View>
                <Text style={styles.weekArrow}>→</Text>
              </TouchableOpacity>
            ))}
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
