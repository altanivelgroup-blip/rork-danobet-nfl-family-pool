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
import { ChevronRight, LockKeyhole, Printer, Trophy } from "lucide-react-native";
import WinnerCelebration from "@/components/WinnerCelebration";
import { printWeeklyGameSheet } from "@/utils/gameSheetPrint";
import { areWeeklyPicksLocked, getWeeklyPickDeadline, WEEK_LOCK_MESSAGE } from "@/utils/weeklyPickDeadline";
import {
  fetchWeekGames,
  getCurrentNFLWeek,
} from "@/services/espnClient";
import {
  FAMILY_MEMBERS,
  watchSubmittedPicks,
  savePicks,
  type GamePick,
} from "@/services/seasonTracker";

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
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [isPrintingGames, setIsPrintingGames] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = React.useRef(false);
  const [now, setNow] = useState(() => Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Week comes from the backend when reachable, but we always compute it
  // locally too so games load even if the backend is down.
  const weekQuery = trpc.weeks.getCurrent.useQuery();
  const localWeek = getCurrentNFLWeek();
  const week = localWeek;
  React.useEffect(() => {
    // Discard drafts when their member/week changes; never carry them to another slate.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicks({});
  }, [selectedMember, week]);

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
    // Do not expose the previous week's schedule while the new one loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDirectGames([]);
  }, [week]);
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

  // Keep submission state tied to its member/week, including while switching members.
  const submissionKey = `${selectedMember}_${week}`;
  const [submissions, setSubmissions] = useState<Record<string, {
    status: "open" | "submitted" | "error";
    picks: Record<string, GamePick>;
  }>>({});
  const selectedMemberName = FAMILY_MEMBERS.find((member) => member.id === selectedMember)?.name ?? "Player";
  React.useEffect(() => {
    let cancelled = false;
    const unsubscribe = watchSubmittedPicks(selectedMember, week, (saved) => {
      if (!cancelled) setSubmissions((previous) => {
        // Once confirmed, this name/week never reopens during this session.
        if (previous[submissionKey]?.status === "submitted") return previous;
        return {
          ...previous,
          [submissionKey]: {
            status: saved === null ? "open" : "submitted",
            picks: saved ?? {},
          },
        };
      });
    }, () => {
      if (!cancelled) setSubmissions((previous) =>
        previous[submissionKey]?.status === "submitted"
          ? previous
          : { ...previous, [submissionKey]: { status: "error", picks: {} } });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [selectedMember, week, submissionKey]);
  const currentSubmission = submissions[submissionKey];
  const storedPicks = currentSubmission?.picks ?? {};
  const submitted = currentSubmission?.status === "submitted" || !!picksQuery.data;
  const checkingSubmission = !currentSubmission;
  const submissionUnavailable = currentSubmission?.status === "error";
  const mergedPicks: Record<string, "home" | "away"> = {
    ...savedPicks,
    ...storedPicks,
    ...picks,
  };

  const games: Game[] =
    gamesQuery.data && gamesQuery.data.length > 0
      ? gamesQuery.data
      : directGames;
  const weeklyLocked = areWeeklyPicksLocked(games, now);
  const deadline = getWeeklyPickDeadline(games);
  const readOnly = weeklyLocked || submitted || checkingSubmission || submissionUnavailable;
  const pickableGames = readOnly ? [] : games;
  const displayedPicks = readOnly ? { ...savedPicks, ...storedPicks } : mergedPicks;
  const lockedInCount = games.filter((g) => displayedPicks[g.id]).length;

  const handlePrintGames = async (): Promise<void> => {
    if (isPrintingGames || games.length === 0) return;
    setIsPrintingGames(true);
    try {
      await printWeeklyGameSheet({ week, games });
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : "The Week pick sheet could not be opened. Please try again.";
      Alert.alert("Unable to print games", message);
    } finally {
      setIsPrintingGames(false);
    }
  };

  const submitPicksMutation = trpc.picks.submit.useMutation();

  const handlePickTeam = (game: Game, pick: "home" | "away") => {
    if (readOnly || areWeeklyPicksLocked(games) || submittingRef.current) return;
    setPicks((prev) => ({ ...prev, [game.id]: pick }));
  };

  const handleSubmitPicks = async () => {
    if (submittingRef.current || readOnly) return;
    if (areWeeklyPicksLocked(games)) {
      Alert.alert("Weekly picks closed", WEEK_LOCK_MESSAGE);
      return;
    }
    const missing = pickableGames.filter((g) => !mergedPicks[g.id]);
    if (missing.length > 0) {
      Alert.alert(
        "⚠️ Incomplete",
        "Please pick a winner for all remaining games before submitting!"
      );
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      // First-write-only saving also checks the full slate's deadline.
      await savePicks(selectedMember, week, mergedPicks);
      setSubmissions((previous) => ({
        ...previous,
        [submissionKey]: { status: "submitted", picks: mergedPicks },
      }));
      setPicks({});
      // Keep the legacy server copy, without depending on its availability.
      submitPicksMutation.mutate({ userId: selectedMember, week, picks: mergedPicks });
      Alert.alert("Profile locked for this week", `${selectedMemberName}'s Week ${week} picks are final. No changes are allowed, including Thursday or Sunday. New picks open with next week's slate.`);
    } catch (error) {
      Alert.alert("Couldn't submit picks", error instanceof Error ? error.message : "Please try again before the deadline.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
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

      <View style={styles.paperPickSection}>
        <View style={styles.paperPickCopy}>
          <Text style={styles.paperPickTitle}>Paper picks</Text>
          <Text style={styles.paperPickDescription}>
            Print Week {week} games with a checkbox beside every team.
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Print Week ${week} games paper pick sheet`}
          activeOpacity={0.75}
          disabled={isPrintingGames || games.length === 0}
          onPress={handlePrintGames}
          style={[
            styles.printGamesButton,
            (isPrintingGames || games.length === 0) && styles.printGamesButtonDisabled,
          ]}
        >
          <Printer size={18} color="#FFFFFF" />
          <Text style={styles.printGamesButtonText}>
            {isPrintingGames ? "Opening…" : "Print Games"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.memberSelector}>
        <Text style={styles.selectorLabel}>
          Pick for: {lockedInCount} of {games.length} selected
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FAMILY_MEMBERS.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.memberChip,
                selectedMember === member.id && styles.memberChipActive,
              ]}
              disabled={isSubmitting}
              onPress={() => {
                if (submittingRef.current) return;
                if (member.id === selectedMember) return;
                setPicks({});
                setSubmissions((previous) => {
                  const key = `${member.id}_${week}`;
                  if (previous[key]?.status === "submitted") return previous;
                  const next = { ...previous };
                  delete next[key];
                  return next;
                });
                setSelectedMember(member.id);
              }}
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
              {(submissions[`${member.id}_${week}`]?.status === "submitted" ||
                (selectedMember === member.id && submitted)) && (
                <LockKeyhole size={14} color="#FFFFFF" accessibilityLabel={`Week ${week} picks locked`} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
          {submitted ? `${selectedMemberName} — Week ${week} locked` : checkingSubmission ? "Checking saved picks…" : submissionUnavailable ? "Unable to verify saved picks — read only" : games.length === 0 ? "Checking weekly deadline…" : weeklyLocked ? "Weekly picks closed — read only" : `All picks due: ${deadline === null ? "Checking…" : new Date(deadline).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })}`}
        </Text>
        <Text style={{ color: "#E1E8ED", fontSize: 12, marginTop: 4 }}>
          {submitted ? "This profile’s picks are read-only for the entire week, including Thursday and Sunday. New picks open with next week’s slate; these picks stay final." : checkingSubmission ? "Please wait while we check this member’s submission." : submissionUnavailable ? "Picks stay read-only until saved submissions can be verified. Check your connection and reopen this screen to retry." : weeklyLocked && games.length > 0 ? WEEK_LOCK_MESSAGE : "Submit every game before Thursday kickoff. Submitting locks your picks immediately; otherwise the entire week locks at the first kickoff."}
        </Text>
      </View>
      <ScrollView style={styles.gamesContainer}>
        {games.map((game) => {
          const selectedPick = displayedPicks[game.id];
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
                  disabled={readOnly || isSubmitting}
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
                  disabled={readOnly || isSubmitting}
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
            disabled={isSubmitting || readOnly}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting
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
  paperPickSection: {
    backgroundColor: "#0b1220",
    borderBottomColor: "#1e3a5f",
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  paperPickCopy: {
    flex: 1,
  },
  paperPickTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700" as const,
  },
  paperPickDescription: {
    color: "#B8C7D9",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  printGamesButton: {
    minHeight: 44,
    backgroundColor: "#FC4C02",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },
  printGamesButtonDisabled: {
    opacity: 0.5,
  },
  printGamesButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700" as const,
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
