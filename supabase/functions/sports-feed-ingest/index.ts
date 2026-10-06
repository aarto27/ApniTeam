import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type IngestEvent = {
  eventId: string;
  matchId: string;
  playerId: string;
  fantasyPoints: number;
  occurredAt: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const expectedSecret = Deno.env.get("SPORTS_FEED_INGEST_SECRET");
  const providedSecret = request.headers.get("x-apniteam-feed-secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "server_configuration_missing" }, 500);
  }

  let body: { events?: IngestEvent[] };
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const events = Array.isArray(body.events) ? body.events : [];
  if (events.length === 0 || events.length > 500) {
    return json({ error: "events_batch_must_contain_1_to_500_items" }, 400);
  }

  const headers = {
    Authorization: "Bearer " + serviceKey,
    apikey: serviceKey,
    "Content-Type": "application/json",
  };

  let accepted = 0;
  let rejected = 0;

  for (const event of events) {
    if (
      !event.eventId ||
      !event.matchId ||
      !event.playerId ||
      !Number.isFinite(Number(event.fantasyPoints)) ||
      !Number.isFinite(Date.parse(event.occurredAt))
    ) {
      rejected += 1;
      continue;
    }

    const response = await fetch(supabaseUrl + "/rest/v1/rpc/record_live_player_score", {
      method: "POST",
      headers,
      body: JSON.stringify({
        p_event_id: event.eventId,
        p_match_id: event.matchId,
        p_player_id: event.playerId,
        p_points: Number(event.fantasyPoints),
        p_occurred_at: new Date(event.occurredAt).toISOString(),
      }),
    });

    if (response.ok) accepted += 1;
    else rejected += 1;
  }

  return json({ accepted, rejected });
});
