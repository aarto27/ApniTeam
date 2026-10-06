import { useQuery } from "@tanstack/react-query";
import { listMyContestEntriesForMatch } from "../../services/contestEntries";

export function useContestEntries(matchId: string) {
  return useQuery({
    queryKey: ["contest-entries", matchId],
    queryFn: () => listMyContestEntriesForMatch(matchId),
    enabled: Boolean(matchId),
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}
