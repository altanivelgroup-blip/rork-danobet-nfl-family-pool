// ✅ SportsDB Premium API (v2) for NFL 2025–2026
// League ID 4391 = NFL
// Uses your paid key and proxy for Rork sandbox

const BASE_URL = "https://www.thesportsdb.com/api/v2/json";
const API_KEY = "219986";
const PROXY = "https://corsproxy.io/?"; // lets Rork fetch with headers

async function fetchSportsDB(endpoint) {
  const target = `${BASE_URL}/${API_KEY}${endpoint}`;
  const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;

  console.log("🔗 Fetching:", proxiedUrl);

  try {
    const response = await fetch(proxiedUrl, {
      method: "GET",
    });

    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const data = await response.json();
    console.log("✅ API Connected through proxy:", data);
    return data;
  } catch (error) {
    console.error("❌ SportsDB API Error:", error);
    console.log("💡 Falling back to mock data...");
    return getMockData(endpoint);
  }
}

function getMockData(endpoint) {
  if (endpoint.includes("schedule")) {
    return {
      events: [
        {
          idEvent: "1",
          strHomeTeam: "Miami Dolphins",
          strAwayTeam: "Buffalo Bills",
          intRound: "9",
          dateEvent: "2024-11-03",
          strTimeLocal: "13:00:00",
          intHomeScore: null,
          intAwayScore: null,
        },
        {
          idEvent: "2",
          strHomeTeam: "New England Patriots",
          strAwayTeam: "New York Jets",
          intRound: "9",
          dateEvent: "2024-11-03",
          strTimeLocal: "16:00:00",
          intHomeScore: null,
          intAwayScore: null,
        },
        {
          idEvent: "3",
          strHomeTeam: "Kansas City Chiefs",
          strAwayTeam: "Tampa Bay Buccaneers",
          intRound: "9",
          dateEvent: "2024-11-04",
          strTimeLocal: "20:15:00",
          intHomeScore: null,
          intAwayScore: null,
        },
      ],
    };
  }
  return null;
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
