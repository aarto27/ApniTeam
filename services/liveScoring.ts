import { supabase } from "../lib/supabase";
import type { LivePlayerScore } from "../features/scoring/liveScoringContract";

export async function recordLivePlayerScore(score: LivePlayerScore) {
  const { data, error } = await supabase.rpc("record_live_player_score", {
    p_event_id: score.eventId,
    p_match_id: score.matchId,
    p_player_id: score.playerId,
    p_points: score.points,
    p_occurred_at: score.occurredAt,
  });

  if (error) throw error;
  return data;
}

export async function getContestLeaderboard(contestId: string) {
  const { data, error } = await supabase
    .from("contest_leaderboard")
    .select("*")
    .eq("contest_id", contestId)
    .order("rank", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function subscribeToLeaderboard(contestId: string, onChange: () => void) {
  const channel = supabase
    .channel("apniteam:leaderboard:" + contestId)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "contest_leaderboard", filter: "contest_id=eq." + contestId },
      onChange,
    )
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}
