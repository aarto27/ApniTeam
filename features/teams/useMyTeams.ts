import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { listMyTeams } from "../../services/teams";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
    staleTime: 60_000,
  });
}

export function useMyTeams(matchId: string) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ["my-teams", user.data?.id, matchId],
    queryFn: () => listMyTeams(user.data!.id, matchId),
    enabled: Boolean(user.data?.id && matchId),
    staleTime: 10_000,
  });
}
