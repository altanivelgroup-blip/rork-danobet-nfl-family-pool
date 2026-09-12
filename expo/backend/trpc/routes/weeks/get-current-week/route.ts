import { publicProcedure } from "@/backend/trpc/create-context";
import { getCurrentNFLWeek } from "@/services/sportsdb";

export const getCurrentWeekRoute = publicProcedure.query(() => {
  const seasonStart = new Date("2026-09-10");
  const currentWeek = getCurrentNFLWeek();

  const weekStart = new Date(seasonStart);
  weekStart.setDate(weekStart.getDate() + (currentWeek - 1) * 7);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return {
    week: currentWeek,
    startDate: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    endDate: weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
});

export default getCurrentWeekRoute;
