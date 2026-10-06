import { supabase } from "../lib/supabase";
import { normalizeMatch, type MatchRecord } from "../domain/matchState";

export async function listMatches(limit = 40): Promise<MatchRecord[]> {
  const { data, error } = await supabase.from("matches").select("*").limit(limit);
  if (error) throw error;

  return (data ?? [])
    .map((row) => normalizeMatch(row as Record<string, unknown>))
    .filter((match) => Boolean(match.id));
}

export async function getMatch(matchId: string): Promise<MatchRecord | null> {
  const { data, error } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
  if (error) throw error;
  return data ? normalizeMatch(data as Record<string, unknown>) : null;
}

export function subscribeToMatches(onChange: () => void) {
  const channel = supabase
    .channel("apniteam:matches")
    .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, onChange)
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}
