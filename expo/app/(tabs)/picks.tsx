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
import { ChevronRight, Trophy } from "lucide-react-native";
import WinnerCelebration from "@/components/WinnerCelebration";
import {
  fetchWeekGames,
  getCurrentNFLWeek,
} from "@/services/espnClient";

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
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeTeamRecord: string;
  awayTeamRecord: string;
  homeScore: string;
  awayScore: string;
  kickoff: string;
  status: string;
  statusDetail: string;
  completed: boolean;
  winner: "home" | "away" | null;
}

/** A game is locked once its kickoff time has passed. */
const isGameStarted = (kickoff: string) => new Date() >= new Date(kickoff);

export default function PicksScreen() {
  const insets = useSafeAreaInsets();
  const [selectedMember, setSelectedMember] = useState(FAMILY_MEMBERS[0].id);
  const [picks, setPicks] = useState<Record<string, "home" | "away">>({});
  const [showCelebration, setShowCelebration] = useState(false);

  React.useEffect(() => {
    setPicks({});
  }, [selectedMember]);

  // Week comes from the backend when reachable, but we always compute it
  // locally too so games load even if the backend is down.
  const weekQuery = trpc.weeks.getCurrent.useQuery();
  const localWeek = getCurrentNFLWeek();
  const week = weekQuery.data?.week ?? localWeek;

  const gamesQuery = trpc.games.getGames.useQuery(
    { week },
    { retry: 1 }
  );

  const picksQuery = trpc.picks.get.useQuery(
    {
      userId: selectedMember,
      week,
    },
    { retry: 1 }
  );

  // Direct-from-ESPN fallback: if the backend fails or returns nothing,
  // fetch the same games straight from ESPN so the slate always shows.
  const [directGames, setDirectGames] = useState<Game[]>([]);
  React.useEffect(() => {
    if (gamesQuery.data && gamesQuery.data.length > 0) return;
    let cancelled = false;
    fetchWeekGames(week)
      .then((g) => {
        if (!cancelled && g.length > 0) setDirectGames(g);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [week, gamesQuery.data]);

  // Merge saved picks (already locked in) with the member's current session picks
  const savedPicks = (picksQuery.data?.picks ?? {}) as Record<
    string,
    "home" | "away"
  >;
  const mergedPicks: Record<string, "home" | "away"> = {
    ...savedPicks,
    ...picks,
  };

  const games: Game[] =
    gamesQuery.data && gamesQuery.data.length > 0
      ? gamesQuery.data
      : directGames;
  // Only games that haven't kicked off can still be picked
  const pickableGames = games.filter((g) => !isGameStarted(g.kickoff));
  const lockedInCount = pickableGames.filter((g) => mergedPicks[g.id]).length;

  const submitPicksMutation = trpc.picks.submit.useMutation({
    onSuccess: () => {
      setPicks({});
      picksQuery.refetch();
      Alert.alert(
        "✅ Picks Submitted!",
        `Your picks for Week ${week} are locked in!`
      );
    },
    onError: () => {
      Alert.alert(
        "⚠️ Couldn't Submit",
        "The pick server isn't responding right now. Your picks are kept on this screen — try again in a minute."
      );
    },
  });

  const handlePickTeam = (game: Game, pick: "home" | "away") => {
    if (isGameStarted(game.kickoff)) return;
    setPicks((prev) => ({ ...prev, [game.id]: pick }));
  };

  const handleSubmitPicks = () => {
    const missing = pickableGames.filter((g) => !mergedPicks[g.id]);
    if (missing.length > 0) {
      Alert.alert(
        "⚠️ Incomplete",
        "Please pick a winner for all remaining games before submitting!"
      );
      return;
    }

    submitPicksMutation.mutate({
      userId: selectedMember,
      week,
      picks: mergedPicks,
    });
  };

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
          Week {week}
          {weekQuery.data?.startDate
            ? ` • ${weekQuery.data.startDate} - ${weekQuery.data.endDate}`
            : ""}
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
        <Text style={styles.selectorLabel}>
          Pick for: {lockedInCount} of {pickableGames.length} locked in
        </Text>
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

      <ScrollView style={styles.gamesContainer}>
        {games.map((game) => {
          const selectedPick = mergedPicks[game.id];
          const started = isGameStarted(game.kickoff);
          const gameTime = new Date(game.kickoff).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
          const isFinal = game.completed;
          const isLive = started && !isFinal;
          const badgeText = isFinal
            ? "FINAL"
            : isLive && game.statusDetail
              ? game.statusDetail.toUpperCase()
              : null;
          const awayWinner = isFinal && game.winner === "away";
          const homeWinner = isFinal && game.winner === "home";

          return (
            <View key={game.id} style={styles.gameCard}>
              <View style={styles.gameTimeRow}>
                <Text style={styles.gameTime}>{gameTime}</Text>
                {badgeText && (
                  <View
                    style={[
                      styles.statusBadge,
                      isLive && styles.statusBadgeLive,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{badgeText}</Text>
                  </View>
                )}
              </View>
              <View style={styles.matchup}>
                <TouchableOpacity
                  style={[
                    styles.teamButton,
                    selectedPick === "away" && styles.teamButtonSelected,
                    awayWinner && styles.teamButtonWinner,
                  ]}
                  onPress={() => handlePickTeam(game, "away")}
                  disabled={started}
                >
                  <Image
                    source={{ uri: game.awayTeamLogo }}
                    style={styles.teamLogo}
                  />
                  <Text style={styles.teamAbbr}>
                    {game.awayTeamAbbr || game.awayTeam}
                  </Text>
                  <Text style={styles.teamRecord}>{game.awayTeamRecord}</Text>
                  {started && !!game.awayScore && (
                    <Text style={styles.teamScore}>{game.awayScore}</Text>
                  )}
                  {selectedPick === "away" && !started && (
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
                    homeWinner && styles.teamButtonWinner,
                  ]}
                  onPress={() => handlePickTeam(game, "home")}
                  disabled={started}
                >
                  <Image
                    source={{ uri: game.homeTeamLogo }}
                    style={styles.teamLogo}
                  />
                  <Text style={styles.teamAbbr}>
                    {game.homeTeamAbbr || game.homeTeam}
                  </Text>
                  <View style={styles.homeBadge}>
                    <Text style={styles.homeBadgeText}>HOME</Text>
                  </View>
                  <Text style={styles.teamRecord}>{game.homeTeamRecord}</Text>
                  {started && !!game.homeScore && (
                    <Text style={styles.teamScore}>{game.homeScore}</Text>
                  )}
                  {selectedPick === "home" && !started && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {pickableGames.length > 0 && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              lockedInCount < pickableGames.length &&
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
        )}

        {games.length === 0 && (
          <Text style={styles.emptyText}>
            No games scheduled yet. Check back soon!
          </Text>
        )}
      </ScrollView>
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
  gameTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  gameTime: {
    fontSize: 13,
    color: "#E1E8ED",
    fontWeight: "500" as const,
  },
  statusBadge: {
    backgroundColor: "#4b5563",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeLive: {
    backgroundColor: "#DC2626",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#FFFFFF",
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
  teamButtonWinner: {
    backgroundColor: "#1E7E34",
    borderColor: "#2EA043",
  },
  teamLogo: {
    width: 56,
    height: 56,
    marginBottom: 10,
  },
  teamAbbr: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  homeBadge: {
    backgroundColor: "#FC4C02",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  homeBadgeText: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  teamRecord: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 6,
  },
  teamScore: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#FFFFFF",
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
  emptyText: {
    fontSize: 15,
    color: "#E1E8ED",
    textAlign: "center",
    paddingVertical: 40,
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
