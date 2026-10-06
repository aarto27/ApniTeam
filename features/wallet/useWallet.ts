import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { getWallet, createDepositOrder } from "../../services/wallet";

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("You must be signed in.");
      return getWallet(data.user.id);
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useCreateDepositOrder() {
  return useMutation({ mutationFn: createDepositOrder });
}
