import { supabase } from "../lib/supabase";

export type TeamPlayer = {
  playerId: string;
  name: string;
  role: "WK" | "BAT" | "AR" | "BOWL" | "GK" | "DEF" | "MID" | "ST";
  selected: boolean;
  raw?: Record<string, unknown>;
};

export type FantasyTeam = {
  id: string;
  matchId: string;
  name: string;
  players: TeamPlayer[];
  captainId: string | null;
  viceCaptainId: string | null;
  raw: Record<string, unknown>;
};

const first = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) if (row[key] !== undefined && row[key] !== null) return row[key];
  return null;
};

export async function listMyTeams(userId: string, matchId: string): Promise<FantasyTeam[]> {
  const { data, error } = await supabase
    .from("user_teams")
    .select("*")
    .eq("user_id", userId)
    .eq("match_id", matchId);

  if (error) throw error;

  return (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const players = Array.isArray(row.players) ? row.players : [];

    return {
      id: String(first(row, ["id", "team_id"]) ?? ""),
      matchId: String(first(row, ["match_id", "matchId"]) ?? matchId),
      name: String(first(row, ["team_name", "name"]) ?? "My Team"),
      players: players.map((player) => {
        const p = player as Record<string, unknown>;
        return {
          playerId: String(first(p, ["player_id", "playerId", "id"]) ?? ""),
          name: String(first(p, ["name", "player_name"]) ?? "Player"),
          role: String(first(p, ["role", "position"]) ?? "BAT") as TeamPlayer["role"],
          selected: true,
          raw: p,
        };
      }),
      captainId: first(row, ["captain_id", "captainId"]) ? String(first(row, ["captain_id", "captainId"])) : null,
      viceCaptainId: first(row, ["vice_captain_id", "viceCaptainId"]) ? String(first(row, ["vice_captain_id", "viceCaptainId"])) : null,
      raw: row,
    };
  }).filter((team) => Boolean(team.id));
}
