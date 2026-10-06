import { useQuery } from "@tanstack/react-query";
import { listMyContestEntries } from "../../services/myMatches";

export function useMyMatches() {
  return useQuery({
    queryKey: ["my-matches"],
    queryFn: listMyContestEntries,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}
