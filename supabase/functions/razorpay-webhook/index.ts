import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function hmac(secret: string, payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const razorpayKey = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  const signature = request.headers.get("x-razorpay-signature");
  if (!secret || !serviceKey || !supabaseUrl || !razorpayKey || !razorpaySecret || !signature) {
    return new Response("Configuration missing", { status: 500 });
  }

  const raw = await request.text();
  if (await hmac(secret, raw) !== signature) return new Response("Invalid signature", { status: 401 });

  const event = JSON.parse(raw);
  const payment = event?.payload?.payment?.entity;
  const order = event?.payload?.order?.entity;
  if (!payment?.id || !order?.id) return new Response("Ignored", { status: 200 });
  if (event.event !== "payment.captured" && event.event !== "order.paid") return new Response("Ignored", { status: 200 });

  const ownerId = order.notes?.user_id;
  const amount = Number(payment.amount ?? order.amount) / 100;
  if (!ownerId || !Number.isFinite(amount) || amount <= 0) return new Response("Invalid payment", { status: 400 });

  const admin = createClient(supabaseUrl, serviceKey);
  const { error } = await admin.rpc("credit_wallet", {
    p_user_id: ownerId,
    p_amount: amount,
    p_kind: "deposit",
    p_reference_id: payment.id,
    p_idempotency_key: "razorpay:" + payment.id,
    p_metadata: { order_id: order.id, source: "webhook" },
  });

  if (error) {
    console.error("[ApniTeam] webhook wallet credit failed", error);
    return new Response("Credit failed", { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
});
