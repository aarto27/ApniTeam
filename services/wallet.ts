import { supabase } from "../lib/supabase";

export type WalletSummary = {
  balance: number;
  deposit: number;
  winnings: number;
  bonus: number;
};

export async function getWallet(userId: string): Promise<WalletSummary> {
  const { data, error } = await supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;

  const row = (data ?? {}) as Record<string, unknown>;
  const numberValue = (keys: string[]) => {
    for (const key of keys) {
      const value = Number(row[key]);
      if (Number.isFinite(value)) return value;
    }
    return 0;
  };

  return {
    balance: numberValue(["balance", "total_balance", "cash_balance"]),
    deposit: numberValue(["deposit_balance", "deposit"]),
    winnings: numberValue(["winning_balance", "winnings"]),
    bonus: numberValue(["bonus_balance", "bonus"]),
  };
}

export async function createDepositOrder(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid deposit amount.");

  const { data, error } = await supabase.functions.invoke("create-payment-order", {
    body: { amount },
  });

  if (error) throw error;
  return data;
}
