import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("MATCH_SYNC_SECRET");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!secret || !serviceKey || !supabaseUrl || request.headers.get("x-apniteam-sync-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const matchId = String(body.matchId ?? "");
  if (!matchId) return new Response("matchId required", { status: 400 });

  const response = await fetch(supabaseUrl + "/rest/v1/rpc/sync_match_snapshot", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + serviceKey,
      apikey: serviceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_match_id: matchId,
      p_provider_status: body.providerStatus ?? null,
      p_toss: body.toss ?? null,
      p_lineup_announced: Boolean(body.lineupAnnounced),
      p_provider_effective_start: body.providerEffectiveStart ?? null,
    }),
  });

  if (!response.ok) return new Response("Match sync failed", { status: 502 });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
});
