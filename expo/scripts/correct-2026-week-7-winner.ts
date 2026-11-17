import { doc, getDocFromServer, runTransaction, terminate } from "firebase/firestore";
import { db } from "../config/firebase";
import type { WeekResult } from "../services/seasonTracker";

// Pool organizer's Week 7 ruling. Only winner flags change; scores remain as played.
const winnerId = "6"; // Zaky

try {
  if (db.app.options.projectId !== "danobet-nfl-family-pool") throw new Error("Unexpected Firebase project");
  const ref = doc(db, "weeklyResults", "7");
  const expected = await runTransaction(db, async (transaction) => {
    const result = (await transaction.get(ref)).data() as WeekResult | undefined;
    if (result?.week !== 7 || result.results.filter((row) => row.uid === winnerId && row.name === "Zaky").length !== 1) {
      throw new Error("Unexpected Week 7 result");
    }
    const results = result.results.map((row) => ({ ...row, isWinner: row.uid === winnerId }));
    if (!result.hasWinner || result.winnerIds.length !== 1 || result.winnerIds[0] !== winnerId ||
        result.results.some((row, index) => row.isWinner !== results[index].isWinner)) {
      transaction.update(ref, { hasWinner: true, winnerIds: [winnerId], results });
    }
    return results.map(({ uid, correct, total }) => [uid, correct, total]);
  });
  const saved = (await getDocFromServer(ref)).data() as WeekResult | undefined;
  const winners = saved?.results.filter((row) => row.isWinner);
  if (!saved?.hasWinner || saved.winnerIds.length !== 1 || saved.winnerIds[0] !== winnerId ||
      winners?.length !== 1 || winners[0].uid !== winnerId ||
      JSON.stringify(saved.results.map(({ uid, correct, total }) => [uid, correct, total])) !== JSON.stringify(expected)) {
    throw new Error("Week 7 live verification failed");
  }
  console.log(JSON.stringify({ week: saved.week, winner: winners[0].name, scoresUnchanged: true }));
} finally {
  await terminate(db);
}
