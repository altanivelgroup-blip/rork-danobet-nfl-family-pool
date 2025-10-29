const API_KEY = "219986";
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

async function fetchSportsDB(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  console.log("🔗 Fetching from TheSportsDB:", url);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ API Response received");
    return data;
  } catch (error) {
    console.error("❌ TheSportsDB API Error:", error);
    throw error;
  }
}

export async function fetchNFLSchedule(season = "2025-2026") {
  try {
    const data = await fetchSportsDB(`/eventsseason.php?id=4391&s=${season}`);
    console.log(`📋 Fetched ${data?.event?.length || 0} games for ${season}`);
    return data?.event || [];
  } catch (error) {
    console.error("Failed to fetch NFL schedule:", error);
    return [];
  }
}

export async function fetchNFLWeekSchedule(week, season = "2025-2026") {
  try {
    const allGames = await fetchNFLSchedule(season);
    const weekGames = allGames.filter(
      (g) => parseInt(g.intRound) === parseInt(week)
    );

    console.log(`🏈 Week ${week}: Found ${weekGames.length} games`);

    return weekGames.map((game) => ({
      id: game.idEvent,
      homeTeam: game.strHomeTeam,
      awayTeam: game.strAwayTeam,
      kickoff: `${game.dateEvent} ${game.strTime || ""}`,
      week: game.intRound,
      venue: game.strVenue,
      homeScore: game.intHomeScore,
      awayScore: game.intAwayScore,
      status: game.strStatus,
      winner:
        game.intHomeScore && game.intAwayScore
          ? parseInt(game.intHomeScore) > parseInt(game.intAwayScore)
            ? "home"
            : "away"
          : null,
    }));
  } catch (error) {
    console.error(`Failed to fetch week ${week} schedule:`, error);
    return [];
  }
}

export function getCurrentNFLWeek() {
  const seasonStart = new Date("2025-09-04");
  const now = new Date();
  const diff = Math.floor((now - seasonStart) / (1000 * 60 * 60 * 24 * 7));
  const currentWeek = Math.min(Math.max(diff + 1, 1), 18);
  console.log("📆 Current NFL Week:", currentWeek);
  return currentWeek;
}
