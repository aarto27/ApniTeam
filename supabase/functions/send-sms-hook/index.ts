import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type HookEvent = {
  user?: { phone?: string | null };
  sms?: { otp?: string | null };
};

serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const expectedSecret = Deno.env.get("AUTH_HOOK_SECRET");
  const suppliedSecret = request.headers.get("x-apniteam-hook-secret") ?? request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (expectedSecret && suppliedSecret !== expectedSecret) return new Response("Unauthorized", { status: 401 });

  const event = (await request.json()) as HookEvent;
  const phone = event.user?.phone;
  const otp = event.sms?.otp;
  const authKey = Deno.env.get("MSG91_AUTH_KEY");
  const templateId = Deno.env.get("MSG91_TEMPLATE_ID");

  if (!phone || !otp || !authKey || !templateId) {
    return new Response("Missing SMS hook configuration", { status: 500 });
  }

  const response = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: authKey },
    body: JSON.stringify({
      template_id: templateId,
      mobile: phone.replace(/^\+/, ""),
      otp,
    }),
  });

  if (!response.ok) {
    console.error("[ApniTeam] MSG91 send failed", await response.text());
    return new Response("SMS provider failed", { status: 502 });
  }

  return new Response(null, { status: 200 });
});
