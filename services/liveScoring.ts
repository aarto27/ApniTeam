import { supabase } from "../lib/supabase";

export async function getContestLeaderboard(contestId: string) {
  const { data, error } = await supabase
    .from("contest_leaderboard")
    .select("*")
    .eq("contest_id", contestId)
    .order("rank", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function subscribeToLeaderboard(contestId: string, onChange: () => void) {
  const channel = supabase
    .channel("apniteam:leaderboard:" + contestId)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "contest_leaderboard", filter: "contest_id=eq." + contestId },
      onChange,
    )
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}
