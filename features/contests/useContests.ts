import { useQuery } from "@tanstack/react-query";
import { listContests } from "../../services/contests";

export function useContests(matchId: string) {
  return useQuery({
    queryKey: ["contests", matchId],
    queryFn: () => listContests(matchId),
    enabled: Boolean(matchId),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });
}
