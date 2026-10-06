export type TeamRole = "WK" | "BAT" | "AR" | "BOWL" | "GK" | "DEF" | "MID" | "ST";

export type SelectedPlayer = { id: string; role: TeamRole; teamId?: string };

export const CRICKET_RULES = {
  minPlayers: 11,
  maxPlayers: 11,
  maxFromOneTeam: 7,
  minByRole: { WK: 1, BAT: 3, AR: 1, BOWL: 3 },
  maxByRole: { WK: 4, BAT: 6, AR: 4, BOWL: 6 },
};

export const FOOTBALL_RULES = {
  minPlayers: 11,
  maxPlayers: 11,
  maxFromOneTeam: 7,
  minByRole: { GK: 1, DEF: 3, MID: 3, ST: 1 },
  maxByRole: { GK: 1, DEF: 5, MID: 5, ST: 3 },
};

export function validateFantasyTeam(players: SelectedPlayer[], sport: "cricket" | "football") {
  const rules = sport === "football" ? FOOTBALL_RULES : CRICKET_RULES;
  const errors: string[] = [];

  if (players.length !== rules.minPlayers) errors.push("Select exactly 11 players.");

  for (const [role, min] of Object.entries(rules.minByRole)) {
    const count = players.filter((p) => p.role === role).length;
    if (count < min) errors.push("Select at least " + min + " " + role + ".");
  }

  for (const [role, max] of Object.entries(rules.maxByRole)) {
    const count = players.filter((p) => p.role === role).length;
    if (count > max) errors.push("Select at most " + max + " " + role + ".");
  }

  const byTeam = new Map<string, number>();
  for (const player of players) {
    if (player.teamId) byTeam.set(player.teamId, (byTeam.get(player.teamId) ?? 0) + 1);
  }

  for (const [teamId, count] of byTeam) {
    if (count > rules.maxFromOneTeam) {
      errors.push("Maximum " + rules.maxFromOneTeam + " players from one team (" + teamId + ").");
    }
  }

  const uniqueIds = new Set(players.map((p) => p.id));
  if (uniqueIds.size !== players.length) errors.push("A player cannot be selected twice.");

  return { valid: errors.length === 0, errors };
}
