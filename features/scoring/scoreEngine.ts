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

  return (stats.runs ?? 0) +
    (stats.fours ?? 0) +
    (stats.sixes ?? 0) * 2 +
    (stats.wickets ?? 0) * 25 +
    (stats.catches ?? 0) * 8 +
    (stats.stumpings ?? 0) * 12 +
    (stats.runOuts ?? 0) * 6 +
    (stats.maidens ?? 0) * 8;
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
