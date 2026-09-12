/**
 * Client-side ESPN fetcher.
 *
 * The app normally loads games through the backend (tRPC), but when that
 * server is unreachable the picks page would show nothing. ESPN's public
 * scoreboard API allows direct browser access (CORS: *), so the app can
 * fetch the exact same data itself as a guaranteed fallback.
 */

const ESPN_API =
  "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl";

export interface EspnGame {
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
  week: string;
  venue: string;
  status: string;
  statusDetail: string;
  completed: boolean;
  winner: "home" | "away" | null;
}

/** Current NFL week of the 2026 season (week flips on Tuesday). */
export function getCurrentNFLWeek(): number {
  const seasonStart = new Date("2026-09-10");
  const now = new Date();
  const dayOfWeek = now.getDay();

  const adjustedDate = new Date(now);
  if (dayOfWeek >= 2) {
    adjustedDate.setDate(adjustedDate.getDate() + (7 - dayOfWeek + 2));
  }

  const diff = Math.floor(
    (adjustedDate.getTime() - seasonStart.getTime()) /
      (1000 * 60 * 60 * 24 * 7)
  );
  return Math.min(Math.max(diff + 1, 1), 18);
}

/** Fetch one week of NFL games straight from ESPN, mapped to the app's Game shape. */
export async function fetchWeekGames(week: number): Promise<EspnGame[]> {
  const url = `${ESPN_API}/scoreboard?seasontype=2&week=${week}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ESPN responded with HTTP ${response.status}`);
  }
  const data = (await response.json()) as { events?: EspnEvent[] };
  const events = data.events ?? [];

  return events.map((event) => {
    const competition = event.competitions[0];
    const homeTeam = competition.competitors.find((c) => c.homeAway === "home");
    const awayTeam = competition.competitors.find((c) => c.homeAway === "away");

    return {
      id: event.id,
      homeTeam: homeTeam?.team.displayName ?? "",
      awayTeam: awayTeam?.team.displayName ?? "",
      homeTeamAbbr: homeTeam?.team.abbreviation ?? "",
      awayTeamAbbr: awayTeam?.team.abbreviation ?? "",
      homeTeamLogo: homeTeam?.team.logo ?? "",
      awayTeamLogo: awayTeam?.team.logo ?? "",
      homeTeamRecord: homeTeam?.records?.[0]?.summary ?? "0-0",
      awayTeamRecord: awayTeam?.records?.[0]?.summary ?? "0-0",
      homeScore: homeTeam?.score ?? "",
      awayScore: awayTeam?.score ?? "",
      kickoff: event.date,
      week: week.toString(),
      venue: competition.venue?.fullName ?? "TBD",
      status: competition.status.type.description,
      statusDetail: competition.status.type.shortDetail ?? "",
      completed: competition.status.type.completed,
      winner: competition.status.type.completed
        ? parseInt(homeTeam?.score ?? "0") > parseInt(awayTeam?.score ?? "0")
          ? "home"
          : "away"
        : null,
    };
  });
}

interface EspnEvent {
  id: string;
  date: string;
  competitions: Array<{
    venue?: { fullName?: string };
    status: {
      type: {
        description: string;
        shortDetail: string | null;
        completed: boolean;
      };
    };
    competitors: Array<{
      homeAway: "home" | "away";
      score: string;
      team: {
        displayName: string;
        abbreviation: string;
        logo: string;
      };
      records?: Array<{ summary: string }>;
    }>;
  }>;
}
