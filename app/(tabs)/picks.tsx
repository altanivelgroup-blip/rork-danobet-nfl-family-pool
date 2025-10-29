import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";
import { ChevronRight, Lock, Trophy } from "lucide-react-native";
import WinnerCelebration from "@/components/WinnerCelebration";

const FAMILY_MEMBERS = [
  { id: "1", name: "Grandma", emoji: "👵" },
  { id: "2", name: "Dave", emoji: "👨" },
  { id: "3", name: "Grandpa", emoji: "👴" },
  { id: "4", name: "John", emoji: "👨" },
  { id: "5", name: "Nena", emoji: "👩" },
  { id: "6", name: "Zaky", emoji: "🧑" },
];

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeTeamRecord: string;
  awayTeamRecord: string;
  homeScore: string;
  awayScore: string;
  kickoff: string;
  status: string;
  completed: boolean;
  winner: "home" | "away" | null;
}

export default function PicksScreen() {
  const insets = useSafeAreaInsets();
  const [selectedMember, setSelectedMember] = useState(FAMILY_MEMBERS[0].id);
  const [picks, setPicks] = useState<Record<string, "home" | "away">>({});
  const [showCelebration, setShowCelebration] = useState(false);

  React.useEffect(() => {
    setPicks({});
  }, [selectedMember]);

  const weekQuery = trpc.weeks.getCurrent.useQuery();
  const gamesQuery = trpc.games.getGames.useQuery(
    { week: weekQuery.data?.week || 1 },
    { enabled: !!weekQuery.data }
  );

  const picksQuery = trpc.picks.get.useQuery(
    {
      userId: selectedMember,
      week: weekQuery.data?.week || 1,
    },
    { enabled: !!weekQuery.data }
  );

  const submitPicksMutation = trpc.picks.submit.useMutation({
    onSuccess: () => {
      setPicks({});
      picksQuery.refetch();
      Alert.alert(
        "✅ Picks Submitted!",
        `Your picks for Week ${weekQuery.data?.week} are locked in!`
      );
    },
  });

  const handlePickTeam = (gameId: string, pick: "home" | "away") => {
    setPicks((prev) => ({ ...prev, [gameId]: pick }));
  };

  const handleSubmitPicks = () => {
    if (Object.keys(picks).length < (gamesQuery.data?.length || 0)) {
      Alert.alert(
        "⚠️ Incomplete",
        "Please pick a winner for all games before submitting!"
      );
      return;
    }

    submitPicksMutation.mutate({
      userId: selectedMember,
      week: weekQuery.data?.week || 1,
      picks,
    });
  };

  const isPickingLocked = () => {
    const now = new Date();
    const firstGameTime = gamesQuery.data?.[0]?.kickoff;
    if (!firstGameTime) return false;
    return now >= new Date(firstGameTime);
  };

  const locked = isPickingLocked();

  return (
    <View style={styles.container}>
      <WinnerCelebration
        visible={showCelebration}
        winnerName="Grandma"
        winnerPoints={12}
        onClose={() => setShowCelebration(false)}
      />
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.headerText}>🏈 Make Your Picks</Text>
        <Text style={styles.subHeader}>
          Week {weekQuery.data?.week || "..."} • {weekQuery.data?.startDate} -{" "}
          {weekQuery.data?.endDate}
        </Text>
        <TouchableOpacity
          style={styles.demoButton}
          onPress={() => setShowCelebration(true)}
        >
          <Trophy size={16} color="#FFD700" />
          <Text style={styles.demoButtonText}>Demo Winner Trophy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.memberSelector}>
        <Text style={styles.selectorLabel}>Pick for:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FAMILY_MEMBERS.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.memberChip,
                selectedMember === member.id && styles.memberChipActive,
              ]}
              onPress={() => setSelectedMember(member.id)}
            >
              <Text style={styles.memberEmoji}>{member.emoji}</Text>
              <Text
                style={[
                  styles.memberName,
                  selectedMember === member.id && styles.memberNameActive,
                ]}
              >
                {member.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {locked ? (
        <View style={styles.lockedContainer}>
          <Lock size={48} color="#FC4C02" />
          <Text style={styles.lockedText}>Picks are locked!</Text>
          <Text style={styles.lockedSubtext}>
            Games have started. Check back Tuesday for results!
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.gamesContainer}>
          {gamesQuery.data?.map((game: Game) => {
            const selectedPick = picks[game.id];
            const gameTime = new Date(game.kickoff).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <View key={game.id} style={styles.gameCard}>
                <Text style={styles.gameTime}>{gameTime}</Text>
                <View style={styles.matchup}>
                  <TouchableOpacity
                    style={[
                      styles.teamButton,
                      selectedPick === "away" && styles.teamButtonSelected,
                    ]}
                    onPress={() => handlePickTeam(game.id, "away")}
                  >
                    <Image
                      source={{ uri: game.awayTeamLogo }}
                      style={styles.teamLogo}
                    />
                    <Text style={styles.teamName}>{game.awayTeam}</Text>
                    <Text style={styles.teamRecord}>{game.awayTeamRecord}</Text>
                    {selectedPick === "away" && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.vsText}>@</Text>

                  <TouchableOpacity
                    style={[
                      styles.teamButton,
                      selectedPick === "home" && styles.teamButtonSelected,
                    ]}
                    onPress={() => handlePickTeam(game.id, "home")}
                  >
                    <Image
                      source={{ uri: game.homeTeamLogo }}
                      style={styles.teamLogo}
                    />
                    <Text style={styles.teamName}>{game.homeTeam}</Text>
                    <Text style={styles.teamRecord}>{game.homeTeamRecord}</Text>
                    {selectedPick === "home" && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={[
              styles.submitButton,
              Object.keys(picks).length < (gamesQuery.data?.length || 0) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitPicks}
            disabled={submitPicksMutation.isPending}
          >
            <Text style={styles.submitButtonText}>
              {submitPicksMutation.isPending
                ? "Submitting..."
                : "🔒 Lock In My Picks"}
            </Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003d7a",
  },
  header: {
    backgroundColor: "#008E97",
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  subHeader: {
    fontSize: 15,
    color: "#FFFFFF",
    marginTop: 6,
    fontWeight: "500" as const,
  },
  memberSelector: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#003d7a",
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginBottom: 10,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e3a5f",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#1e3a5f",
  },
  memberChipActive: {
    backgroundColor: "#FC4C02",
    borderColor: "#FC4C02",
  },
  memberEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  memberNameActive: {
    color: "#FFFFFF",
  },
  gamesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gameCard: {
    backgroundColor: "#001f3f",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#002d54",
  },
  gameTime: {
    fontSize: 13,
    color: "#E1E8ED",
    marginBottom: 14,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  matchup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#003366",
    borderWidth: 3,
    borderColor: "transparent",
  },
  teamButtonSelected: {
    borderColor: "#10b981",
    backgroundColor: "#00447a",
  },
  teamLogo: {
    width: 56,
    height: 56,
    marginBottom: 10,
  },
  teamName: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  teamRecord: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "#9CA3AF",
    textAlign: "center",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#10b981",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  vsText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#E1E8ED",
    marginHorizontal: 10,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#10b981",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: "#4b5563",
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginRight: 8,
  },
  lockedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  lockedText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginTop: 16,
  },
  lockedSubtext: {
    fontSize: 14,
    color: "#E1E8ED",
    marginTop: 8,
    textAlign: "center",
  },
  demoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD70020",
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
    gap: 6,
  },
  demoButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#FFD700",
  },
});
