# ApniTeam Supabase functions

Secrets required by the MSG91 Send SMS hook:

MSG91_AUTH_KEY
MSG91_TEMPLATE_ID
AUTH_HOOK_SECRET

The MSG91 credentials must never be placed in the Expo app or shipped client-side.

Configure Supabase Auth -> Hooks -> Send SMS to call the deployed send-sms-hook function. Supabase supplies the generated OTP to the hook; the function forwards it to MSG91. This keeps Supabase Auth responsible for OTP verification and sessions while MSG91 handles SMS delivery.


Sports feed ingestion:

SPORTS_FEED_INGEST_SECRET

The sports-feed-ingest Edge Function accepts only server-to-server requests carrying this secret. A provider-specific worker should normalize provider payloads into eventId, matchId, playerId, fantasyPoints and occurredAt, then POST batches to the function. Never expose this secret to the Expo client.
