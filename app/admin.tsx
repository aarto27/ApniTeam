import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { extendMatch, updateWithdrawalStatus } from "../services/operations";
import { supabase } from "../lib/supabase";
import { theme } from "../lib/theme";

export default function Admin() {
  const [matchId, setMatchId] = useState("");
  const [effectiveStart, setEffectiveStart] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const withdrawals = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function extend() {
    setMessage("");
    try {
      await extendMatch(matchId.trim(), new Date(effectiveStart).toISOString(), reason.trim());
      setMessage("Match timing updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update match.");
    }
  }

  async function resolve(id: string, status: "approved" | "rejected" | "paid") {
    try {
      await updateWithdrawalStatus(id, status);
      await withdrawals.refetch();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update withdrawal.");
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>OPERATIONS</Text>
      <Text style={styles.title}>Admin</Text>

      <View style={styles.card}>
        <Text style={styles.heading}>Extend / reschedule match</Text>
        <TextInput value={matchId} onChangeText={setMatchId} placeholder="Match UUID" style={styles.input} />
        <TextInput value={effectiveStart} onChangeText={setEffectiveStart} placeholder="2026-10-06T18:30:00+05:30" style={styles.input} />
        <TextInput value={reason} onChangeText={setReason} placeholder="Reason" style={styles.input} />
        <Pressable onPress={extend} style={styles.button}><Text style={styles.buttonText}>Apply timing change</Text></Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Withdrawals</Text>
        {withdrawals.isLoading && <ActivityIndicator color={theme.colors.primary} />}
        {!withdrawals.data?.length && !withdrawals.isLoading && <Text style={styles.muted}>No withdrawal requests.</Text>}
        {withdrawals.data?.map((item) => (
          <View key={String(item.id)} style={styles.withdrawal}>
            <Text style={styles.heading}>₹{Number(item.amount).toLocaleString("en-IN")}</Text>
            <Text style={styles.muted}>{String(item.status)}</Text>
            {item.status === "pending" && (
              <View style={styles.actions}>
                <Pressable onPress={() => resolve(String(item.id), "approved")} style={styles.small}><Text>Approve</Text></Pressable>
                <Pressable onPress={() => resolve(String(item.id), "rejected")} style={styles.small}><Text>Reject</Text></Pressable>
              </View>
            )}
            {item.status === "approved" && (
              <Pressable onPress={() => resolve(String(item.id), "paid")} style={styles.small}><Text>Mark paid</Text></Pressable>
            )}
          </View>
        ))}
      </View>

      {!!message && <Text style={styles.message}>{message}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 18, paddingBottom: 40 },
  kicker: { color: theme.colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { fontSize: 28, fontWeight: "900", color: theme.colors.text, marginTop: 5 },
  card: { marginTop: 14, backgroundColor: "#fff", borderRadius: 16, padding: 15, borderWidth: 1, borderColor: theme.colors.border },
  heading: { fontSize: 14, fontWeight: "900", color: theme.colors.text },
  input: { marginTop: 9, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 12, color: theme.colors.text },
  button: { marginTop: 10, backgroundColor: theme.colors.primary, borderRadius: 10, padding: 13, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "900" },
  withdrawal: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
  muted: { marginTop: 4, color: theme.colors.muted, fontSize: 12 },
  actions: { flexDirection: "row", gap: 8, marginTop: 8 },
  small: { backgroundColor: "#F2F3F6", padding: 9, borderRadius: 8 },
  message: { marginTop: 12, color: theme.colors.primary, fontWeight: "700" },
});
