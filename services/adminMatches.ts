import { supabase } from "../lib/supabase";

export async function extendMatchDeadline(matchId: string, effectiveStart: string, reason: string) {
  const { error } = await supabase.rpc("extend_match_deadline", {
    p_match_id: matchId,
    p_effective_start: effectiveStart,
    p_reason: reason,
  });
  if (error) throw error;
}
