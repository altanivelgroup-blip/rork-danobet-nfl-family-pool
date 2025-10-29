// ✅ SportsDB Premium API (v2)
// Fix for header authentication in Rork environment

const BASE_URL = "https://www.thesportsdb.com/api/v2/json";
const API_KEY = "219986"; // your premium key

export async function fetchNFLSchedule(season = "2024-2025") {
  try {
    const response = await fetch(`${BASE_URL}/schedule/league/4391/${season}`, {
      method: "GET",
      headers: {
        "X-API-KEY": API_KEY,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ API Connected:", data);
    return data?.events || [];
  } catch (error) {
    console.error("❌ SportsDB API Error:", error);
    return [];
  }
}
