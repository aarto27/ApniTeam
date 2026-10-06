# ApniTeam

ApniTeam is a fantasy sports mobile app built with Expo/React Native, Supabase and TypeScript.

Architecture
- app/: Expo Router screens
- features/: React Query hooks and feature logic
- domain/: deterministic business rules
- services/: Supabase/provider boundaries
- components/: reusable UI
- supabase/migrations/: database contracts and transactional functions
- supabase/functions/: privileged provider integrations

Core lifecycle
scheduled -> upcoming/countdown -> lineup -> deadline -> live -> completed -> settlement

A provider saying live cannot override the authoritative/effective start time.
DD extensions change effective_starts_at and deadline_at atomically. They do not rely on client flags.

Money safety
The client never changes wallet balances directly.
Contest joining is transactional: lock contest, validate capacity and timing, validate team ownership, debit wallet with an idempotency key, insert the entry, then increment filled spots.
Deposits use server-created Razorpay orders, server-side signature verification, server-side amount/owner validation, and idempotent wallet crediting.

OTP
Supabase Auth remains responsible for OTP verification and session management. MSG91 is used as the SMS delivery provider through the send-sms-hook Edge Function.

Server secrets
MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, AUTH_HOOK_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and SUPABASE_SERVICE_ROLE_KEY must stay server-side.

Verification
Run npm install, npm run typecheck and npx expo start.
The GitHub Actions workflow runs npm run typecheck on pushes and pull requests.

Production checklist
- Apply migrations to the intended Supabase project.
- Configure the Supabase Auth Send SMS Hook and MSG91 secrets.
- Configure Razorpay secrets and reconciliation/webhook policy.
- Verify RLS against actual provider/admin roles.
- Deploy sports feed ingestion and live scoring workers.
- Configure push notifications.
- Test DD extension and early-toss cases with real provider payloads.
- Run Android/iOS release builds.
- Test payment, settlement and withdrawal flows with appropriate credentials.