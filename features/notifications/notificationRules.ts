export type NotificationEvent =
  | "deadline_soon"
  | "lineup_announced"
  | "match_live"
  | "contest_result"
  | "wallet_credit"
  | "wallet_debit";

export function notificationCopy(event: NotificationEvent, context: { matchName?: string; rank?: number }) {
  const match = context.matchName ?? "your match";
  switch (event) {
    case "deadline_soon": return { title: "Deadline approaching", body: "Your team deadline for " + match + " is approaching." };
    case "lineup_announced": return { title: "Lineups announced", body: "The lineup for " + match + " is available." };
    case "match_live": return { title: "Match is live", body: match + " has started." };
    case "contest_result": return { title: "Contest result", body: context.rank ? "You finished #" + context.rank + " in " + match + "." : "Your contest result is ready." };
    case "wallet_credit": return { title: "Wallet credited", body: "Your ApniTeam wallet was credited." };
    case "wallet_debit": return { title: "Contest entry", body: "Your contest entry fee was debited." };
  }
}
