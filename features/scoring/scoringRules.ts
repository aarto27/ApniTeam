export type CricketStats = {
  runs?: number; fours?: number; sixes?: number; wickets?: number; catches?: number;
  stumpings?: number; runOuts?: number; maidenOvers?: number; bowledWickets?: number;
  lbwWickets?: number; hitWicketWickets?: number; duck?: boolean; inningsBalls?: number;
  inningsRuns?: number; oversBowled?: number; runsConceded?: number;
};

export const CRICKET_SCORING = {
  run: 1, fourBonus: 1, sixBonus: 2, wicket: 25, catch: 8, stumping: 12,
  runOut: 6, maidenOver: 8, bowledBonus: 8, lbwBonus: 8, hitWicketBonus: 8,
  duckPenalty: -2, strikeRateBelow70Penalty: -2, strikeRateBelow50Penalty: -4,
  strikeRateAbove100Bonus: 2, strikeRateAbove120Bonus: 4,
  economyBelow5Bonus: 3, economyBelow4Bonus: 5, economyAbove10Penalty: -2,
  economyAbove12Penalty: -4,
} as const;

const n = (value?: number) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function cricketFantasyPoints(stats: CricketStats) {
  const runs = n(stats.runs), fours = n(stats.fours), sixes = n(stats.sixes);
  const wickets = n(stats.wickets), catches = n(stats.catches), stumpings = n(stats.stumpings);
  const runOuts = n(stats.runOuts), maidens = n(stats.maidenOvers);

  let points = runs + fours * 1 + sixes * 2 + wickets * 25 + catches * 8 +
    stumpings * 12 + runOuts * 6 + maidens * 8 +
    n(stats.bowledWickets) * 8 + n(stats.lbwWickets) * 8 + n(stats.hitWicketWickets) * 8;

  if (stats.duck) points += -2;

  const balls = n(stats.inningsBalls);
  if (balls > 0) {
    const strikeRate = (n(stats.inningsRuns) / balls) * 100;
    if (strikeRate < 50) points -= 4;
    else if (strikeRate < 70) points -= 2;
    else if (strikeRate >= 120) points += 4;
    else if (strikeRate >= 100) points += 2;
  }

  const overs = n(stats.oversBowled);
  if (overs > 0) {
    const economy = n(stats.runsConceded) / overs;
    if (economy < 4) points += 5;
    else if (economy < 5) points += 3;
    else if (economy > 12) points -= 4;
    else if (economy > 10) points -= 2;
  }

  return points;
}

export function applyCaptainMultiplier(points: number, role: "captain" | "vice" | "normal") {
  if (role === "captain") return points * 2;
  if (role === "vice") return points * 1.5;
  return points;
}
