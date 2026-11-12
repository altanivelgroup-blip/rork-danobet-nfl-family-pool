type ScheduledGame = { id: string; kickoff: string };

export const WEEK_LOCK_MESSAGE = "Weekly picks are closed. All picks must be submitted before Thursday kickoff. You can pick again next week.";

/** Thursday kickoff in NFL's Eastern time zone; earlier games also close the slate.
 * Weeks without a Thursday game close at the first scheduled kickoff.
 * Missing or invalid schedules fail closed.
 */
export function getWeeklyPickDeadline(games: ScheduledGame[]): number | null {
  if (!games.length) return null;
  const kickoffs = games.map((game) => Date.parse(game.kickoff));
  if (kickoffs.some((time) => !Number.isFinite(time))) return null;
  return Math.min(...kickoffs);
}

export function areWeeklyPicksLocked(games: ScheduledGame[], now = Date.now()): boolean {
  const deadline = getWeeklyPickDeadline(games);
  return deadline === null || now >= deadline;
}

export function assertWeeklyPicksOpen(
  games: ScheduledGame[],
  picks: Record<string, "home" | "away">,
): void {
  if (areWeeklyPicksLocked(games)) throw new Error(WEEK_LOCK_MESSAGE);
  if (games.some((game) => !picks[game.id]) ||
      Object.keys(picks).some((id) => !games.some((game) => game.id === id))) {
    throw new Error("Please choose a winner for every game in this week's schedule.");
  }
}
