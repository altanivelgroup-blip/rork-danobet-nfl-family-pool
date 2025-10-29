// ✅ SportsDB Premium API (v2) for NFL 2025–2026
// League ID 4391 = NFL
// Uses your paid key and proxy for Rork sandbox

const BASE_URL = "https://www.thesportsdb.com/api/v2/json";
const API_KEY = "219986";
const PROXY = "https://corsproxy.io/?"; // lets Rork fetch with headers

// ---- helper to call the API ----
async function fetchSportsDB(endpoint) {
  const target = `${BASE_URL}${endpoint}`;

  // 🧠 use a proxy server that forwards your header
  const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;

  try {
    const response = await fetch(proxiedUrl, {
      method: "GET",
      headers: {
        "X-API-KEY": API_KEY,
        Accept: "application/json",
      },
    });

    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const data = await response.json();
    console.log("✅ API Connected through proxy:", data);
    return data;
  } catch (error) {
    console.error("❌ SportsDB API Error:", error);
    return null;
  }
}


// ---- get the full season schedule ----
export async function fetchNFLSchedule(season = "2025-2026") {
  const data = await fetchSportsDB(`/schedule/league/4391/${season}`);
  return data?.events || [];
}

// ---- get games for one week ----
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

// ---- find which week we’re in now ----
export function getCurrentNFLWeek() {
  const seasonStart = new Date("2025-09-04"); // Week 1 kickoff
  const now = new Date();
  const diff = Math.floor((now - seasonStart) / (1000 * 60 * 60 * 24 * 7));
  const currentWeek = Math.min(Math.max(diff + 1, 1), 18);
  console.log("📆 Current NFL Week:", currentWeek);
  return currentWeek;
}
