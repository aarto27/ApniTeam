export type TeamPlayer = {
  id: string;
  name?: string;
  role?: string;
  teamId?: string;
};

export type FantasyTeam = {
  id: string;
  name: string;
  players: string[];
  captainId?: string | null;
  viceCaptainId?: string | null;
};

import { supabase } from "../lib/supabase";

export async function listMyTeams(userId: string, matchId: string): Promise<FantasyTeam[]> {
  const { data, error } = await supabase
    .from("user_teams")
    .select("*")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? row.team_name ?? "My Team"),
    players: Array.isArray(row.players)
      ? row.players.map(String)
      : Array.isArray(row.player_ids)
        ? row.player_ids.map(String)
        : [],
    captainId: row.captain_id ? String(row.captain_id) : null,
    viceCaptainId: row.vice_captain_id ? String(row.vice_captain_id) : null,
  }));
}
