import { supabase } from "../lib/supabase";

export async function listNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.rpc("mark_notification_read", { p_notification_id: id });
  if (error) throw error;
}

export async function registerPushToken(token: string, platform: string) {
  const { error } = await supabase.rpc("register_push_token", {
    p_token: token,
    p_platform: platform,
  });
  if (error) throw error;
}
