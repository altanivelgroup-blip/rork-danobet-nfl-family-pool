import { Platform } from "react-native";
import * as Print from "expo-print";

export interface PrintableGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  kickoff: string;
}

interface GameSheetPrintOptions {
  week: number;
  games: PrintableGame[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function teamLabel(name: string, abbreviation: string): string {
  const safeName = escapeHtml(name);
  const safeAbbreviation = escapeHtml(abbreviation);
  return safeAbbreviation && safeAbbreviation !== safeName
    ? `${safeName} (${safeAbbreviation})`
    : safeName;
}

/** Creates an ink-friendly paper pick sheet for one NFL week. */
export function createWeeklyGameSheetHtml(options: GameSheetPrintOptions): string {
  const sortedGames = [...options.games].sort(
    (first: PrintableGame, second: PrintableGame) =>
      new Date(first.kickoff).getTime() - new Date(second.kickoff).getTime()
  );
  const rows = sortedGames
    .map((game: PrintableGame, index: number) => {
      const kickoff = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(game.kickoff));

      return `
        <div class="game">
          <div class="game-number">${index + 1}</div>
          <div class="details">
            <div class="kickoff">${escapeHtml(kickoff)}</div>
            <div class="matchup">
              <span class="choice"><span class="box"></span>${teamLabel(game.awayTeam, game.awayTeamAbbr)}</span>
              <span class="at">at</span>
              <span class="choice"><span class="box"></span>${teamLabel(game.homeTeam, game.homeTeamAbbr)}</span>
            </div>
          </div>
        </div>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DanoBet.G Week ${options.week} Paper Pick Sheet</title>
  <style>
    @page { size: letter portrait; margin: 0.42in; }
    * { box-sizing: border-box; }
    body { color: #10233f; font-family: Arial, Helvetica, sans-serif; margin: 0; }
    header { border-bottom: 4px solid #008e97; margin-bottom: 14px; padding-bottom: 10px; }
    h1 { color: #002c5f; font-size: 23px; margin: 0; }
    .subtitle { color: #008e97; font-size: 16px; font-weight: 700; margin-top: 3px; }
    .instructions { color: #45566c; font-size: 11px; margin-top: 5px; }
    .identity { display: flex; gap: 24px; margin: 13px 0; }
    .line { border-bottom: 1px solid #26384f; flex: 1; font-size: 12px; padding-bottom: 3px; }
    .game { align-items: center; border: 1px solid #c9d4df; border-left: 5px solid #008e97; display: flex; margin-bottom: 7px; min-height: 48px; page-break-inside: avoid; }
    .game-number { color: #002c5f; font-size: 13px; font-weight: 700; text-align: center; width: 34px; }
    .details { border-left: 1px solid #dce3ea; flex: 1; padding: 6px 9px; }
    .kickoff { color: #566579; font-size: 9px; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; }
    .matchup { align-items: center; display: grid; font-size: 12px; font-weight: 700; gap: 8px; grid-template-columns: 1fr 20px 1fr; }
    .choice { align-items: center; display: flex; gap: 7px; }
    .box { border: 2px solid #182d49; display: inline-block; flex: 0 0 auto; height: 17px; width: 17px; }
    .at { color: #fc4c02; font-size: 10px; text-align: center; text-transform: uppercase; }
    .empty { border: 1px dashed #9ba9b8; color: #566579; padding: 24px; text-align: center; }
    .reminder { color: #45566c; font-size: 10px; margin-top: 10px; }
    footer { border-top: 1px solid #d7dfe7; color: #687687; font-size: 9px; margin-top: 12px; padding-top: 7px; text-align: center; }
  </style>
</head>
<body>
  <header>
    <h1>DanoBet.G NFL Family Pool</h1>
    <div class="subtitle">Week ${options.week} Paper Pick Sheet</div>
    <div class="instructions">Mark one box for the team you think will win each game.</div>
  </header>
  <div class="identity">
    <div class="line">Name:</div>
    <div class="line">Date:</div>
  </div>
  ${rows || '<div class="empty">No games are currently available for this week.</div>'}
  <div class="reminder">Return this sheet before the first selected game kicks off.</div>
  <footer>This isn't just football. It's family.</footer>
</body>
</html>`;
}

/** Opens the browser or native print dialog for the current week's paper pick sheet. */
export async function printWeeklyGameSheet(options: GameSheetPrintOptions): Promise<void> {
  const html = createWeeklyGameSheetHtml(options);

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

  await Print.printAsync({ html, orientation: Print.Orientation.portrait });
}
