import { useMutation, useQuery } from "@tanstack/react-query";
import { getMatchPlayers, normalizeBuilderPlayer, saveTeam } from "../../services/teamBuilder";

export function useMatchPlayers(matchId: string) {
  return useQuery({
    queryKey: ["match-players", matchId],
    queryFn: async () => {
      const rows = await getMatchPlayers(matchId);
      return rows.map(normalizeBuilderPlayer);
    },
    enabled: Boolean(matchId),
    staleTime: 60_000,
  });
}

export function useSaveTeam() {
  return useMutation({ mutationFn: saveTeam });
}
