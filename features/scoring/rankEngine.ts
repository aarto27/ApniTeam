export type ContestScore = {
  entryId: string;
  userId: string;
  points: number;
  previousRank?: number | null;
};

export function rankEntries(entries: ContestScore[]) {
  const sorted = [...entries].sort((a, b) => b.points - a.points || a.entryId.localeCompare(b.entryId));
  let lastPoints: number | null = null;
  let rank = 0;

  return sorted.map((entry, index) => {
    if (lastPoints === null || entry.points !== lastPoints) rank = index + 1;
    lastPoints = entry.points;
    return { ...entry, rank };
  });
}
