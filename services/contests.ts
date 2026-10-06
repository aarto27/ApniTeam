import { supabase } from "../lib/supabase";

export type Contest = {
  id: string;
  matchId: string;
  name: string;
  entryFee: number;
  prizePool: number;
  totalSpots: number;
  filledSpots: number;
  status?: string;
  remainingSpots: number;
  isFull: boolean;
};

export async function listContests(matchId: string): Promise<Contest[]> {
  const { data, error } = await supabase
    .from("contests")
    .select("*")
    .eq("match_id", matchId)
    .order("entry_fee", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    matchId: String(row.match_id),
    name: String(row.name ?? row.title ?? "Contest"),
    entryFee: Number(row.entry_fee ?? 0),
    prizePool: Number(row.prize_pool ?? 0),
    totalSpots: Number(row.total_spots ?? row.max_spots ?? 0),
    filledSpots: Number(row.filled_spots ?? row.joined_spots ?? 0),
    status: row.status ? String(row.status) : undefined,
    remainingSpots: Math.max(0, Number(row.total_spots ?? row.max_spots ?? 0) - Number(row.filled_spots ?? row.joined_spots ?? 0)),
    isFull: Number(row.filled_spots ?? row.joined_spots ?? 0) >= Number(row.total_spots ?? row.max_spots ?? 0),
  }));
}

export async function joinContest(contestId: string, teamId: string) {
  const { data, error } = await supabase.rpc("join_contest", {
    p_contest_id: contestId,
    p_team_id: teamId,
  });

  if (error) throw error;
  return data as string;
}
