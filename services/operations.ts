import { supabase } from "../lib/supabase";

export async function extendMatch(matchId: string, effectiveStart: string, reason: string) {
  const { data, error } = await supabase.rpc("extend_match_deadline", {
    p_match_id: matchId,
    p_effective_start: effectiveStart,
    p_reason: reason,
  });
  if (error) throw error;
  return data;
}

export async function updateWithdrawalStatus(id: string, status: "approved" | "rejected" | "paid", note?: string) {
  const { error } = await supabase.rpc("resolve_withdrawal", {
    p_withdrawal_id: id,
    p_status: status,
    p_admin_note: note ?? null,
  });
  if (error) throw error;
}
