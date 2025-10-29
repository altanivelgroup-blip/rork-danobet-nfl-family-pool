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
import { ChevronRight, Lock } from "lucide-react-native";

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
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.headerText}>🏈 Make Your Picks</Text>
        <Text style={styles.subHeader}>
          Week {weekQuery.data?.week || "..."} • {weekQuery.data?.startDate} -{" "}
          {weekQuery.data?.endDate}
        </Text>
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
  memberSelector: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#003d7a",
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#E1E8ED",
    marginBottom: 8,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b1220",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  memberChipActive: {
    backgroundColor: "#FC4C02",
    borderColor: "#FFFFFF",
  },
  memberEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#E1E8ED",
  },
  memberNameActive: {
    color: "#FFFFFF",
  },
  gamesContainer: {
    flex: 1,
    padding: 16,
  },
  gameCard: {
    backgroundColor: "#0b1220",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  gameTime: {
    fontSize: 12,
    color: "#E1E8ED",
    marginBottom: 12,
    textAlign: "center",
  },
  matchup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamButton: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#002C5F",
    borderWidth: 2,
    borderColor: "transparent",
  },
  teamButtonSelected: {
    borderColor: "#FC4C02",
    backgroundColor: "#FC4C0220",
  },
  teamLogo: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "center",
  },
  teamRecord: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 2,
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
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#E1E8ED",
    marginHorizontal: 8,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#10b981",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: "#4b5563",
  },
  submitButtonText: {
    fontSize: 16,
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
});
