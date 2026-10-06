import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getMatch, listMatches, subscribeToMatches } from "../../services/matches";

export function useMatches() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["matches"],
    queryFn: () => listMatches(40),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const unsubscribe = subscribeToMatches(() => {
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
    });
    return unsubscribe;
  }, [queryClient]);

  return query;
}

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ["match", matchId],
    queryFn: () => getMatch(matchId),
    enabled: Boolean(matchId),
    staleTime: 10_000,
  });
}
