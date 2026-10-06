import { supabase } from "../lib/supabase";
import type { BuilderPlayer, TeamDraft } from "../features/teams/teamBuilder";

export async function getMatchPlayers(matchId: string) {
  const { data, error } = await supabase
    .from("match_players")
    .select("*")
    .eq("match_id", matchId)
    .order("role");

  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}

export async function saveTeam(input: {
  matchId: string;
  teamId?: string;
  teamName: string;
  draft: TeamDraft;
}) {
  const payload = {
    p_team_name: input.teamName.trim(),
    p_player_ids: input.draft.players.map((player) => player.id),
    p_captain_id: input.draft.captainId,
    p_vice_captain_id: input.draft.viceCaptainId,
  };

  const { data, error } = input.teamId
    ? await supabase.rpc("update_fantasy_team", {
        p_team_id: input.teamId,
        ...payload,
      })
    : await supabase.rpc("save_fantasy_team", {
        p_match_id: input.matchId,
        ...payload,
      });

  if (error) throw error;
  return data;
}

export function normalizeBuilderPlayer(row: Record<string, unknown>): BuilderPlayer {
  const id = String(row.player_id ?? row.id ?? "");
  return {
    id,
    name: String(row.name ?? row.player_name ?? "Player"),
    role: String(row.role ?? row.position ?? "BAT") as BuilderPlayer["role"],
    teamId: row.team_id ? String(row.team_id) : undefined,
    teamName: row.team_name ? String(row.team_name) : undefined,
    credit: Number.isFinite(Number(row.credit)) ? Number(row.credit) : undefined,
  };
}
