// ✅ TheSportsDB Premium (v2) Integration
// Version: 2.0
// Works in Rork / Expo JavaScript environment

const BASE_URL = "https://www.thesportsdb.com/api/v2/json";
const API_KEY = "219986"; // Your premium key

// 🔹 Generic Fetch Helper
async function fetchSportsDB(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { "X-API-KEY": API_KEY },
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SportsDB API Error:", error);
    return null;
  }
}

// 🏈 Fetch full NFL Season Schedule (League ID 4391 = NFL)
export const fetchNFLSchedule = async (season = "2024-2025") => {
  const data = await fetchSportsDB(`/schedule/league/4391/${season}`);
  return data?.events || [];
};

// 🗓 Fetch a Specific Week’s Schedule
export const fetchNFLWeekSchedule = async (week, season = "2024-2025") => {
  const allGames = await fetchNFLSchedule(season);
  const weekGames = allGames.filter((g) => parseInt(g.intRound) === parseInt(week));

  return weekGames.map((game) => ({
    id: game.idEvent,
    homeTeam: game.strHomeTeam,
    awayTeam: game.strAwayTeam,
    kickoff: game.dateEvent + " " + game.strTimeLocal,
    timestamp: new Date(game.dateEvent + "T" + game.strTimeLocal).getTime(),
    homeScore: game.intHomeScore,
    awayScore: game.intAwayScore,
    winner:
      game.intHomeScore && game.intAwayScore
        ? parseInt(game.intHomeScore) > parseInt(game.intAwayScore)
          ? "home"
          : "away"
        : null,
  }));
};

// ⏱ Calculate Current NFL Week (2024 Season start)
export const getCurrentNFLWeek = () => {
  const seasonStart = new Date("2024-09-05");
  const now = new Date();
  const diff = Math.floor((now - seasonStart) / (1000 * 60 * 60 * 24 * 7));
  return Math.min(Math.max(diff + 1, 1), 18);
};
