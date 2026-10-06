import { supabase } from "../lib/supabase";

export async function listMyContestEntries() {
  const { data, error } = await supabase
    .from("contest_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}
