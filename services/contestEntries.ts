import { supabase } from "../lib/supabase";

export type ContestEntrySummary = {
  id: string;
  contestId: string;
  teamId: string;
  points: number;
  rank: number | null;
};

export async function listMyContestEntriesForMatch(matchId: string): Promise<ContestEntrySummary[]> {
  const { data: contests, error: contestsError } = await supabase
    .from("contests")
    .select("id")
    .eq("match_id", matchId);

  if (contestsError) throw contestsError;

  const contestIds = (contests ?? []).map((row) => String(row.id));
  if (!contestIds.length) return [];

  const { data, error } = await supabase
    .from("contest_entries")
    .select("id, contest_id, team_id, points, rank")
    .in("contest_id", contestIds);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    contestId: String(row.contest_id),
    teamId: String(row.team_id),
    points: Number(row.points ?? 0),
    rank: row.rank == null ? null : Number(row.rank),
  }));
}
