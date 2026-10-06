import { supabase } from "../lib/supabase";

export async function createDepositOrder(amount: number) {
  if (!Number.isFinite(amount) || amount < 10) throw new Error("Invalid deposit amount.");
  const { data, error } = await supabase.functions.invoke("create-payment-order", { body: { amount } });
  if (error) throw error;
  return data;
}

export async function verifyDepositPayment(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
}) {
  const { data, error } = await supabase.functions.invoke("verify-payment", { body: input });
  if (error) throw error;
  return data;
}
