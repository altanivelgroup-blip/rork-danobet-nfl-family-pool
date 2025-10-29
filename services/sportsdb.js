// ✅ Mock NFL Data for Development
// Using mock data until live API integration

function getMockData(endpoint) {
  if (endpoint.includes("schedule")) {
    return {
      events: [
        {
          idEvent: "1",
          strHomeTeam: "Miami Dolphins",
          strAwayTeam: "Buffalo Bills",
          intRound: "9",
          dateEvent: "2025-10-26",
          strTimeLocal: "13:00:00",
          intHomeScore: null,
          intAwayScore: null,
        },
        {
          idEvent: "2",
          strHomeTeam: "New England Patriots",
          strAwayTeam: "New York Jets",
          intRound: "9",
          dateEvent: "2025-10-26",
          strTimeLocal: "16:00:00",
          intHomeScore: null,
          intAwayScore: null,
        },
        {
          idEvent: "3",
          strHomeTeam: "Kansas City Chiefs",
          strAwayTeam: "Tampa Bay Buccaneers",
          intRound: "9",
          dateEvent: "2025-10-27",
          strTimeLocal: "20:15:00",
          intHomeScore: null,
          intAwayScore: null,
        },
        {
          idEvent: "4",
          strHomeTeam: "Dallas Cowboys",
          strAwayTeam: "Philadelphia Eagles",
          intRound: "9",
          dateEvent: "2025-10-26",
          strTimeLocal: "16:25:00",
          intHomeScore: null,
          intAwayScore: null,
        },
        {
          idEvent: "5",
          strHomeTeam: "San Francisco 49ers",
          strAwayTeam: "Green Bay Packers",
          intRound: "9",
          dateEvent: "2025-10-26",
          strTimeLocal: "13:00:00",
          intHomeScore: null,
          intAwayScore: null,
        },
        {
          idEvent: "6",
          strHomeTeam: "Los Angeles Rams",
          strAwayTeam: "Seattle Seahawks",
          intRound: "9",
          dateEvent: "2025-10-26",
          strTimeLocal: "16:05:00",
          intHomeScore: null,
          intAwayScore: null,
        },
      ],
    };
  }
  return { events: [] };
}

async function fetchSportsDB(endpoint) {
  console.log("💡 Using mock NFL data for development");
  return getMockData(endpoint);
}

export async function fetchNFLSchedule(season = "2025-2026") {
  const data = await fetchSportsDB(`/schedule/league/4391/${season}`);
  return data?.events || [];
}

export async function fetchNFLWeekSchedule(week, season = "2025-2026") {
  const allGames = await fetchNFLSchedule(season);
  const weekGames = allGames.filter(
    (g) => parseInt(g.intRound) === parseInt(week)
  );

  return weekGames.map((game) => ({
    id: game.idEvent,
    homeTeam: game.strHomeTeam,
    awayTeam: game.strAwayTeam,
    kickoff: `${game.dateEvent} ${game.strTimeLocal || ""}`,
    winner:
      game.intHomeScore && game.intAwayScore
        ? parseInt(game.intHomeScore) > parseInt(game.intAwayScore)
          ? "home"
          : "away"
        : null,
  }));
}

export function getCurrentNFLWeek() {
  const seasonStart = new Date("2025-09-04");
  const now = new Date();
  const diff = Math.floor((now - seasonStart) / (1000 * 60 * 60 * 24 * 7));
  const currentWeek = Math.min(Math.max(diff + 1, 1), 18);
  console.log("📆 Current NFL Week:", currentWeek);
  return currentWeek;
}
