import { doc, getDocFromServer, runTransaction, terminate } from "firebase/firestore";
import { db } from "../config/firebase";
import type { WeekResult } from "../services/seasonTracker";

// Pool organizer's ruling: Dave alone gets win credit for Weeks 4 and 5.
const winnerId = "2";
const weeks = [4, 5];
const scores = (result: WeekResult) => result.results.map(({ uid, correct, total }) => [uid, correct, total]);
const isCorrected = (result: WeekResult) => result.hasWinner &&
  result.winnerIds.length === 1 && result.winnerIds[0] === winnerId &&
  result.results.every((row) => row.isWinner === (row.uid === winnerId));

try {
  if (db.app.options.projectId !== "danobet-nfl-family-pool") throw new Error("Unexpected Firebase project");
  const refs = weeks.map((week) => doc(db, "weeklyResults", String(week)));
  const expected = await runTransaction(db, async (transaction) => {
    const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
    return snapshots.map((snapshot, index) => {
      const week = weeks[index];
      const result = snapshot.data() as WeekResult | undefined;
      if (result?.week !== week || result.results.filter((row) => row.uid === winnerId && row.name === "Dave").length !== 1) {
        throw new Error(`Unexpected Week ${week} result`);
      }
      if (!isCorrected(result)) {
        transaction.update(refs[index], {
          hasWinner: true,
          winnerIds: [winnerId],
          results: result.results.map((row) => ({ ...row, isWinner: row.uid === winnerId })),
        });
      }
      return scores(result);
    });
  });
  const saved = await Promise.all(refs.map((ref) => getDocFromServer(ref)));
  saved.forEach((snapshot, index) => {
    const week = weeks[index];
    const result = snapshot.data() as WeekResult | undefined;
    if (result?.week !== week || !isCorrected(result) ||
        JSON.stringify(scores(result)) !== JSON.stringify(expected[index])) {
      throw new Error(`Week ${week} live verification failed`);
    }
  });
  console.log(JSON.stringify({ weeks, winner: "Dave", scoresUnchanged: true }));
} finally {
  await terminate(db);
}
