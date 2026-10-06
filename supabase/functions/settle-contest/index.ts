import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("SETTLEMENT_INTERNAL_SECRET");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!secret || !serviceKey || !supabaseUrl || request.headers.get("x-apniteam-internal-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const contestId = String(body.contestId ?? "");
  if (!contestId) return new Response("contestId required", { status: 400 });

  const admin = createClient(supabaseUrl, serviceKey);
  const { data, error } = await admin.rpc("settle_contest", { p_contest_id: contestId });
  if (error) return new Response(error.message, { status: 409 });

  return new Response(JSON.stringify({ settled: Boolean(data) }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
