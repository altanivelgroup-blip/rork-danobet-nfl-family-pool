import { publicProcedure } from "@/backend/trpc/create-context";

export const getCurrentWeekRoute = publicProcedure.query(() => {
  const now = new Date();
  const seasonStart = new Date("2024-09-05");
  const diffTime = Math.abs(now.getTime() - seasonStart.getTime());
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  const currentWeek = Math.min(Math.max(diffWeeks + 1, 1), 18);

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
