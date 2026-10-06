import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getContestLeaderboard, subscribeToLeaderboard } from "../../services/liveScoring";

export function useContestLeaderboard(contestId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["leaderboard", contestId],
    queryFn: () => getContestLeaderboard(contestId),
    enabled: Boolean(contestId),
    staleTime: 5_000,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (!contestId) return;
    return subscribeToLeaderboard(contestId, () => {
      void queryClient.invalidateQueries({ queryKey: ["leaderboard", contestId] });
    });
  }, [contestId, queryClient]);

  return query;
}
