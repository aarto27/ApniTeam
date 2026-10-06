import { cricketFantasyPoints } from "./scoringRules";

export type PlayerStats = {
  playerId: string;
  runs?: number;
  fours?: number;
  sixes?: number;
  wickets?: number;
  catches?: number;
  stumpings?: number;
  runOuts?: number;
  maidens?: number;
  goals?: number;
  assists?: number;
  cleanSheet?: boolean;
};

export type FantasyScore = {
  playerId: string;
  basePoints: number;
  multiplier: number;
  totalPoints: number;
};

export function calculatePlayerScore(stats: PlayerStats, sport: "cricket" | "football"): number {
  if (sport === "football") {
    return (stats.goals ?? 0) * 10 +
      (stats.assists ?? 0) * 5 +
      (stats.cleanSheet ? 4 : 0);
  }

  return cricketFantasyPoints({
    runs: stats.runs, fours: stats.fours, sixes: stats.sixes,
    wickets: stats.wickets, catches: stats.catches, stumpings: stats.stumpings,
    runOuts: stats.runOuts, maidenOvers: stats.maidens,
  });
}

export function calculateTeamScore(
  players: PlayerStats[],
  captainId: string,
  viceCaptainId: string,
  sport: "cricket" | "football",
): FantasyScore[] {
  return players.map((player) => {
    const basePoints = calculatePlayerScore(player, sport);
    const multiplier = player.playerId === captainId ? 2 : player.playerId === viceCaptainId ? 1.5 : 1;
    return {
      playerId: player.playerId,
      basePoints,
      multiplier,
      totalPoints: basePoints * multiplier,
    };
  });
}


export function calculateEntryPoints(
  selectedPlayerIds: string[],
  captainId: string,
  viceCaptainId: string,
  scores: PlayerStats[],
  sport: "cricket" | "football",
) {
  const selected = new Set(selectedPlayerIds);
  return calculateTeamScore(
    scores.filter((player) => selected.has(player.playerId)),
    captainId,
    viceCaptainId,
    sport,
  ).reduce((total, score) => total + score.totalPoints, 0);
}
