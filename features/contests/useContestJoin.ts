import { useMutation, useQueryClient } from "@tanstack/react-query";
import { joinContest } from "../../services/contests";

export function useContestJoin(matchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contestId, teamId }: { contestId: string; teamId: string }) => joinContest(contestId, teamId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["contests", matchId] }),
        queryClient.invalidateQueries({ queryKey: ["contest-entries", matchId] }),
        queryClient.invalidateQueries({ queryKey: ["my-matches"] }),
        queryClient.invalidateQueries({ queryKey: ["wallet"] }),
      ]);
    },
  });
}
