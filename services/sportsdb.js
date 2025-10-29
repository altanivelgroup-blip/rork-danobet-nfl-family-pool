// ✅ SportsDB Premium API (v2)
// Fix for header authentication in Rork environment

const BASE_URL = "https://www.thesportsdb.com/api/v2/json";
const API_KEY = "219986"; // your premium key
export function getCurrentNFLWeek() {
  const seasonStart = new Date("2024-09-05");
  const now = new Date();
  const diff = Math.floor((now - seasonStart) / (1000 * 60 * 60 * 24 * 7));
  return Math.min(Math.max(diff + 1, 1), 18);
}



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
