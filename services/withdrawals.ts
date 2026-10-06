import { supabase } from "../lib/supabase";

export async function requestWithdrawal(amount: number, payoutMethod: Record<string, unknown>) {
  const { data, error } = await supabase.rpc("request_withdrawal", {
    p_amount: amount,
    p_payout_method: payoutMethod,
  });
  if (error) throw error;
  return String(data);
}

export async function listMyWithdrawals() {
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}
