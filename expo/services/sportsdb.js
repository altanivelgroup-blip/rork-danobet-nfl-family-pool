// site.web.api.espn.com is used instead of site.api.espn.com because the
// latter blocks server-side fetch requests with HTTP 403 bot protection.
const ESPN_API = "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl";

async function fetchESPN(endpoint) {
  const url = `${ESPN_API}${endpoint}`;
  console.log("🔗 Fetching from ESPN:", url);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ ESPN API Response received");
    return data;
  } catch (error) {
    console.error("❌ ESPN API Error:", error);
    throw error;
  }
}

export async function fetchNFLSchedule(season = "2026") {
  try {
    const data = await fetchESPN(`/scoreboard?limit=1000&dates=${season}`);
    console.log(`📋 Fetched ${data?.events?.length || 0} games for ${season}`);
    return data?.events || [];
  } catch (error) {
    console.error("Failed to fetch NFL schedule:", error);
    return [];
  }
}

export async function fetchNFLWeekSchedule(week, season = "2026") {
  try {
    const data = await fetchESPN(`/scoreboard?seasontype=2&week=${week}`);
    const games = data?.events || [];
    
    console.log(`🏈 Week ${week}: Found ${games.length} games`);
    
    return games.map((event) => {
      const competition = event.competitions[0];
      const homeTeam = competition.competitors.find(c => c.homeAway === "home");
      const awayTeam = competition.competitors.find(c => c.homeAway === "away");
      
      return {
        id: event.id,
        homeTeam: homeTeam.team.displayName,
        awayTeam: awayTeam.team.displayName,
        homeTeamAbbr: homeTeam.team.abbreviation || "",
        awayTeamAbbr: awayTeam.team.abbreviation || "",
        homeTeamLogo: homeTeam.team.logo,
        awayTeamLogo: awayTeam.team.logo,
        homeTeamRecord: homeTeam.records?.[0]?.summary || "0-0",
        awayTeamRecord: awayTeam.records?.[0]?.summary || "0-0",
        homeScore: homeTeam.score,
        awayScore: awayTeam.score,
        kickoff: event.date,
        week: week.toString(),
        venue: competition.venue?.fullName || "TBD",
        status: competition.status.type.description,
        statusDetail: competition.status.type.shortDetail || "",
        completed: competition.status.type.completed,
        winner: competition.status.type.completed 
          ? (parseInt(homeTeam.score) > parseInt(awayTeam.score) ? "home" : "away")
          : null,
      };
    });
  } catch (error) {
    console.error(`Failed to fetch week ${week} schedule:`, error);
    return [];
  }
}

export function getCurrentNFLWeek() {
  const seasonStart = new Date("2026-09-10");
  const now = new Date();
  
  const dayOfWeek = now.getDay();
  
  let adjustedDate = new Date(now);
  if (dayOfWeek >= 2) {
    adjustedDate.setDate(adjustedDate.getDate() + (7 - dayOfWeek + 2));
  }
  
  const diff = Math.floor((adjustedDate - seasonStart) / (1000 * 60 * 60 * 24 * 7));
  const currentWeek = Math.min(Math.max(diff + 1, 1), 18);
  console.log("📆 Current NFL Week:", currentWeek, "(Day of week:", dayOfWeek, ")");
  return currentWeek;
}
