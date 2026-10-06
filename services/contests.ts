import { supabase } from "../lib/supabase";

export type Contest = {
  id: string;
  matchId: string;
  name: string;
  entryFee: number;
  prizePool: number;
  totalSpots: number;
  filledSpots: number;
  raw: Record<string, unknown>;
};

const numberValue = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const first = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) if (row[key] !== undefined && row[key] !== null) return row[key];
  return null;
};

export async function listContests(matchId: string): Promise<Contest[]> {
  const { data, error } = await supabase.from("contests").select("*").eq("match_id", matchId);
  if (error) throw error;

  return (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: String(first(row, ["id", "contest_id"]) ?? ""),
      matchId: String(first(row, ["match_id", "matchId"]) ?? matchId),
      name: String(first(row, ["name", "title", "contest_name"]) ?? "Contest"),
      entryFee: numberValue(first(row, ["entry_fee", "entryFee", "fee"])),
      prizePool: numberValue(first(row, ["prize_pool", "prizePool", "total_prize"])),
      totalSpots: numberValue(first(row, ["total_spots", "max_spots", "spots"])),
      filledSpots: numberValue(first(row, ["filled_spots", "joined_spots", "spots_filled"])),
      raw: row,
    };
  }).filter((contest) => Boolean(contest.id));
}

export async function joinContest(contestId: string, teamId: string) {
  const { data, error } = await supabase.rpc("join_contest", {
    p_contest_id: contestId,
    p_team_id: teamId,
  });
  if (error) throw error;
  return data;
}
