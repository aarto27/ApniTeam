import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const authHeader = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!authHeader || !supabaseUrl || !serviceKey || !razorpaySecret) {
    return new Response("Configuration missing", { status: 500 });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const orderId = String(body.razorpay_order_id ?? "");
  const paymentId = String(body.razorpay_payment_id ?? "");
  const signature = String(body.razorpay_signature ?? "");
  const amount = Number(body.amount);

  if (!orderId || !paymentId || !signature || !Number.isFinite(amount) || amount <= 0) {
    return new Response("Invalid payment payload", { status: 400 });
  }

  const data = new TextEncoder().encode(orderId + "|" + paymentId);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(razorpaySecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, data);
  const expected = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");

  if (expected !== signature) return new Response("Invalid payment signature", { status: 400 });

  const { error } = await admin.rpc("credit_wallet", {
    p_user_id: user.id,
    p_amount: amount,
    p_kind: "deposit",
    p_reference_id: paymentId,
    p_idempotency_key: "razorpay:" + paymentId,
    p_metadata: { order_id: orderId },
  });

  if (error) {
    console.error("[ApniTeam] wallet credit failed", error);
    return new Response("Wallet credit failed", { status: 500 });
  }

  return new Response(JSON.stringify({ verified: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
