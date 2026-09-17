import { Platform } from "react-native";
import * as Print from "expo-print";
import type { Standing, WeekResult } from "@/services/seasonTracker";

interface SeasonPrintOptions {
  currentWeek: number;
  standings: Standing[];
  weekResults: WeekResult[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildWeekRows(currentWeek: number, weekResults: WeekResult[]): string {
  const settledByWeek = new Map<number, WeekResult>(
    weekResults.map((result: WeekResult) => [result.week, result])
  );
  const latestSettledWeek = Math.max(0, ...weekResults.map((result: WeekResult) => result.week));
  const lastPrintableWeek = Math.max(currentWeek - 1, latestSettledWeek);

  if (lastPrintableWeek === 0) {
    return '<div class="empty">No completed weeks yet.</div>';
  }

  return Array.from({ length: lastPrintableWeek }, (_: unknown, index: number) => index + 1)
    .map((week: number) => {
      const result = settledByWeek.get(week);
      if (!result) {
        return `
          <section class="week-card">
            <div class="week-heading"><strong>Week ${week}</strong><span class="pending">No results yet</span></div>
          </section>`;
      }

      const winners = result.hasWinner
        ? result.results
            .filter((memberResult) => memberResult.isWinner)
            .map((memberResult) => escapeHtml(memberResult.name))
            .join(" & ")
        : "Wash — no weekly winner";
      const scores = [...result.results]
        .sort((a, b) => b.correct - a.correct || a.name.localeCompare(b.name))
        .map(
          (memberResult) => `
            <tr${memberResult.isWinner ? ' class="winner"' : ""}>
              <td>${escapeHtml(memberResult.name)}</td>
              <td>${memberResult.correct} / ${memberResult.total}</td>
              <td>${memberResult.isWinner ? "Weekly winner" : ""}</td>
            </tr>`
        )
        .join("");

      return `
        <section class="week-card">
          <div class="week-heading"><strong>Week ${week}</strong><span>${winners}</span></div>
          <table>
            <thead><tr><th>Family Member</th><th>Correct Picks</th><th>Result</th></tr></thead>
            <tbody>${scores}</tbody>
          </table>
        </section>`;
    })
    .join("");
}

function buildStandingsRows(standings: Standing[]): string {
  if (standings.length === 0) {
    return '<tr><td colspan="4">Standings are not available yet.</td></tr>';
  }

  return standings
    .map(
      (standing: Standing, index: number) => `
        <tr${index === 0 ? ' class="leader"' : ""}>
          <td>${index + 1}</td>
          <td>${escapeHtml(standing.name)}</td>
          <td>${standing.weeklyWins}</td>
          <td>${standing.totalPoints}</td>
        </tr>`
    )
    .join("");
}

/** Creates the ink-friendly all-weeks report used by native and web printing. */
export function createSeasonReportHtml(options: SeasonPrintOptions): string {
  const printedOn = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DanoBet.G 2026–2027 Season Report</title>
  <style>
    @page { size: letter portrait; margin: 0.5in; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #10233f; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; font-size: 11px; line-height: 1.35; }
    header { border-bottom: 4px solid #008e97; margin-bottom: 18px; padding-bottom: 12px; }
    h1 { color: #002c5f; font-size: 25px; margin: 0 0 3px; }
    h2 { color: #002c5f; font-size: 17px; margin: 20px 0 9px; }
    .tagline { color: #008e97; font-size: 13px; font-weight: 700; }
    .meta { color: #566579; margin-top: 5px; }
    .standings { page-break-inside: avoid; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #e8f5f5; color: #002c5f; font-size: 10px; letter-spacing: .03em; text-align: left; text-transform: uppercase; }
    th, td { border-bottom: 1px solid #d7dfe7; padding: 6px 8px; }
    .leader td { color: #002c5f; font-weight: 700; }
    .week-card { border: 1px solid #cfd8e2; border-left: 5px solid #008e97; border-radius: 5px; margin: 0 0 12px; overflow: hidden; page-break-inside: avoid; }
    .week-heading { align-items: center; background: #f4f7f9; display: flex; justify-content: space-between; padding: 8px 10px; }
    .week-heading strong { color: #002c5f; font-size: 14px; }
    .week-heading span { color: #008e97; font-weight: 700; }
    .week-heading .pending { color: #687687; }
    .winner td { color: #b23a00; font-weight: 700; }
    .empty { border: 1px dashed #aab6c3; color: #687687; padding: 16px; text-align: center; }
    footer { border-top: 1px solid #d7dfe7; color: #687687; margin-top: 18px; padding-top: 8px; text-align: center; }
  </style>
</head>
<body>
  <header>
    <h1>DanoBet.G NFL Family Pool</h1>
    <div class="tagline">2026–2027 Week-by-Week Season Report</div>
    <div class="meta">Current week: ${options.currentWeek} · Printed ${printedOn}</div>
  </header>
  <section class="standings">
    <h2>Season Standings</h2>
    <table>
      <thead><tr><th>Rank</th><th>Family Member</th><th>Weekly Wins</th><th>Season Points</th></tr></thead>
      <tbody>${buildStandingsRows(options.standings)}</tbody>
    </table>
  </section>
  <h2>Week by Week</h2>
  ${buildWeekRows(options.currentWeek, options.weekResults)}
  <footer>This isn't just football. It's family.</footer>
</body>
</html>`;
}

/** Opens the platform print dialog for the supplied season report. */
export async function printSeasonReport(options: SeasonPrintOptions): Promise<void> {
  const html = createSeasonReportHtml(options);

  if (Platform.OS === "web") {
    const reportWindow = window.open("", "_blank", "width=900,height=700");
    if (!reportWindow) {
      throw new Error("The print window was blocked. Please allow pop-ups and try again.");
    }
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.setTimeout(() => reportWindow.print(), 250);
    return;
  }

  await Print.printAsync({
    html,
    orientation: Print.Orientation.portrait,
  });
}
