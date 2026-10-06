import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("PUSH_INTERNAL_SECRET");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!secret || !serviceKey || !supabaseUrl || request.headers.get("x-apniteam-internal-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const userId = String(body.userId ?? "");
  const title = String(body.title ?? "");
  const message = String(body.body ?? "");
  if (!userId || !title || !message) return new Response("Invalid payload", { status: 400 });

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: tokens, error } = await admin.from("push_tokens").select("token").eq("user_id", userId);
  if (error) return new Response("Token lookup failed", { status: 500 });

  const messages = (tokens ?? []).map((row) => ({
    to: row.token,
    sound: "default",
    title,
    body: message,
    data: body.data ?? {},
  }));

  if (messages.length) {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
  }

  return new Response(JSON.stringify({ sent: messages.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
