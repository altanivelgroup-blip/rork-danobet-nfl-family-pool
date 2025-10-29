import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";

const MOCK_USER_ID = "user123";

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPicks, setSelectedPicks] = useState<Record<string, "home" | "away">>({});
  
  const weekQuery = trpc.weeks.getCurrent.useQuery();
  const gamesQuery = trpc.games.getGames.useQuery(
    { week: weekQuery.data?.week || 9 },
    { enabled: !!weekQuery.data }
  );
  const picksQuery = trpc.picks.get.useQuery(
    { userId: MOCK_USER_ID, week: weekQuery.data?.week || 9 },
    { enabled: !!weekQuery.data }
  );
  
  const submitPicksMutation = trpc.picks.submit.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Picks locked in! 🏈");
      picksQuery.refetch();
    },
    onError: () => {
      Alert.alert("Error", "Failed to submit picks. Try again.");
    },
  });

  const isLocked = picksQuery.data?.locked || false;
  
  const isPastKickoff = useMemo(() => {
    if (!gamesQuery.data || gamesQuery.data.length === 0) return false;
    const firstGame = gamesQuery.data[0];
    const kickoffTime = new Date(firstGame.kickoff);
    return new Date() > kickoffTime;
  }, [gamesQuery.data]);

  const handlePickTeam = (gameId: string, team: "home" | "away") => {
    if (isLocked || isPastKickoff) return;
    setSelectedPicks((prev) => ({
      ...prev,
      [gameId]: team,
    }));
  };

  const handleSubmitPicks = () => {
    const games = gamesQuery.data || [];
    const pickedGames = Object.keys(selectedPicks).length;
    
    if (pickedGames < games.length) {
      Alert.alert("Incomplete", "You missed a game! Pick all before kickoff.");
      return;
    }

    submitPicksMutation.mutate({
      userId: MOCK_USER_ID,
      week: weekQuery.data?.week || 9,
      picks: selectedPicks,
    });
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 24 }]}>
        <Image
          source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/tol8fv7mlzkzpw4c2klu4" }}
          style={styles.tributeImage}
          accessibilityLabel="Dano tribute portrait"
          testID="tribute-image"
        />
        <Text style={styles.tributeText} testID="tribute-text">
          Dano says: Choose wisely… are you happy with your picks?
        </Text>
      </View>

      <View style={styles.weekHeader}>
        <Text style={styles.weekTitle}>
          Week {weekQuery.data?.week || "..."}:
        </Text>
        <Text style={styles.weekDates}>
          {weekQuery.data?.startDate} – {weekQuery.data?.endDate}
        </Text>
      </View>

      {isLocked && (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedText}>🔒 Your picks are locked in!</Text>
        </View>
      )}

      {isPastKickoff && !isLocked && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>⏰ Deadline passed - editing disabled</Text>
        </View>
      )}

      <View style={styles.gamesContainer}>
        {gamesQuery.isLoading && (
          <Text style={styles.loadingText}>Loading games...</Text>
        )}

        {gamesQuery.data?.map((game) => {
          const userPick = isLocked
            ? picksQuery.data?.picks[game.id]
            : selectedPicks[game.id];

          return (
            <View key={game.id} style={styles.gameCard}>
              <View style={styles.gameTeams}>
                <TouchableOpacity
                  style={[
                    styles.teamButton,
                    userPick === "away" && styles.teamButtonSelected,
                    (isLocked || isPastKickoff) && styles.teamButtonDisabled,
                  ]}
                  onPress={() => handlePickTeam(game.id, "away")}
                  disabled={isLocked || isPastKickoff}
                  testID={`pick-away-${game.id}`}
                >
                  <Text
                    style={[
                      styles.teamName,
                      userPick === "away" && styles.teamNameSelected,
                    ]}
                  >
                    {game.awayTeam}
                  </Text>
                  <Text style={styles.atSymbol}>@</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.teamButton,
                    userPick === "home" && styles.teamButtonSelected,
                    (isLocked || isPastKickoff) && styles.teamButtonDisabled,
                  ]}
                  onPress={() => handlePickTeam(game.id, "home")}
                  disabled={isLocked || isPastKickoff}
                  testID={`pick-home-${game.id}`}
                >
                  <Text
                    style={[
                      styles.teamName,
                      userPick === "home" && styles.teamNameSelected,
                    ]}
                  >
                    {game.homeTeam}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.kickoffTime}>
                {new Date(game.kickoff).toLocaleDateString("en-US", {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          );
        })}
      </View>

      {!isLocked && !isPastKickoff && gamesQuery.data && (
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              submitPicksMutation.isPending && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitPicks}
            disabled={submitPicksMutation.isPending}
            testID="submit-picks"
          >
            <Text style={styles.submitButtonText}>
              {submitPicksMutation.isPending ? "Submitting..." : "🏈 Lock In My Picks"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.submitHint}>
            {Object.keys(selectedPicks).length} of {gamesQuery.data.length} games picked
          </Text>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#002C5F",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerContainer: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#008E97",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 5,
  },
  tributeImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FC4C02",
    marginBottom: 10,
  },
  tributeText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "700",
    marginTop: 4,
    textShadowColor: "#002C5F",
    textShadowRadius: 4,
    paddingHorizontal: 20,
  },
  weekHeader: {
    backgroundColor: "#008E97",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  weekTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  weekDates: {
    color: "#E1E8ED",
    fontSize: 14,
    marginTop: 4,
  },
  lockedBanner: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
  },
  lockedText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  warningBanner: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
  },
  warningText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  gamesContainer: {
    padding: 16,
  },
  loadingText: {
    color: "#E1E8ED",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 40,
  },
  gameCard: {
    backgroundColor: "#0b1220",
    borderRadius: 14,
    padding: 12,
    marginVertical: 8,
  },
  gameTeams: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  teamButton: {
    flex: 1,
    backgroundColor: "#002C5F",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#002C5F",
  },
  teamButtonSelected: {
    backgroundColor: "#FC4C02",
    borderColor: "#FC4C02",
  },
  teamButtonDisabled: {
    opacity: 0.6,
  },
  teamName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  teamNameSelected: {
    color: "#FFFFFF",
  },
  atSymbol: {
    color: "#E1E8ED",
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
  kickoffTime: {
    color: "#E1E8ED",
    fontSize: 12,
    textAlign: "center",
  },
  submitContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: "#FC4C02",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    shadowColor: "#FC4C02",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  submitHint: {
    color: "#E1E8ED",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },
  bottomSpacer: {
    height: 40,
  },
});
