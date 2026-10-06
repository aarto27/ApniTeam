export type CricketStats = {
  runs?: number;
  fours?: number;
  sixes?: number;
  wickets?: number;
  catches?: number;
  stumpings?: number;
  runOuts?: number;
  maidenOvers?: number;
};

export function cricketFantasyPoints(stats: CricketStats) {
  const runs = Number(stats.runs ?? 0);
  const fours = Number(stats.fours ?? 0);
  const sixes = Number(stats.sixes ?? 0);
  const wickets = Number(stats.wickets ?? 0);
  const catches = Number(stats.catches ?? 0);
  const stumpings = Number(stats.stumpings ?? 0);
  const runOuts = Number(stats.runOuts ?? 0);
  const maidens = Number(stats.maidenOvers ?? 0);

  return runs + fours + sixes * 2 + wickets * 25 + catches * 8 + stumpings * 12 + runOuts * 6 + maidens * 8;
}

export function applyCaptainMultiplier(points: number, role: "captain" | "vice" | "normal") {
  if (role === "captain") return points * 2;
  if (role === "vice") return points * 1.5;
  return points;
}
