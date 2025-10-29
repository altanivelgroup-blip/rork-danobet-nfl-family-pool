const BASE_URL = "https://www.thesportsdb.com/api/v2/json";
const API_KEY = "219986";

export function getCurrentNFLWeek() {
  const seasonStart = new Date("2024-09-05");
  const now = new Date();
  const diff = Math.floor((now - seasonStart) / (1000 * 60 * 60 * 24 * 7));
  return Math.min(Math.max(diff + 1, 1), 18);
}

export async function getNFLGames(week) {
  try {
    const response = await fetch(
      `${BASE_URL}/${API_KEY}/eventsseason.php?id=4391&s=2024-2025`
    );

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
