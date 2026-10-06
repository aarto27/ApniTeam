import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const razorpayKey = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!supabaseUrl || !serviceKey || !razorpayKey || !razorpaySecret) {
    return new Response("Payment configuration missing", { status: 500 });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const userResponse = await fetch(supabaseUrl + "/auth/v1/user", {
    headers: { Authorization: "Bearer " + token, apikey: serviceKey },
  });
  if (!userResponse.ok) return new Response("Unauthorized", { status: 401 });
  const user = await userResponse.json();

  const body = await request.json();
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 10 || amount > 100000) {
    return new Response("Invalid amount", { status: 400 });
  }

  const basic = btoa(razorpayKey + ":" + razorpaySecret);
  const order = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: "Basic " + basic, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "apniteam_" + user.id + "_" + crypto.randomUUID(),
      notes: { user_id: user.id },
    }),
  });

  if (!order.ok) {
    console.error("[ApniTeam] Razorpay order creation failed", await order.text());
    return new Response("Payment provider failed", { status: 502 });
  }

  return new Response(JSON.stringify(await order.json()), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
