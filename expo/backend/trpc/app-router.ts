import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import getCurrentWeekRoute from "./routes/weeks/get-current-week/route";
import getGamesRoute from "./routes/games/get-games/route";
import submitPicksRoute from "./routes/picks/submit-picks/route";
import getPicksRoute from "./routes/picks/get-picks/route";
import getLeaderboardRoute from "./routes/leaderboard/get-leaderboard/route";
import getSeasonRoute from "./routes/leaderboard/get-season/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  weeks: createTRPCRouter({
    getCurrent: getCurrentWeekRoute,
  }),
  games: createTRPCRouter({
    getGames: getGamesRoute,
  }),
  picks: createTRPCRouter({
    submit: submitPicksRoute,
    get: getPicksRoute,
  }),
  leaderboard: createTRPCRouter({
    get: getLeaderboardRoute,
    getSeason: getSeasonRoute,
  }),
});

export type AppRouter = typeof appRouter;
