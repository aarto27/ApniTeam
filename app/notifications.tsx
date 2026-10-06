import { useEffect } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listNotifications, markNotificationRead } from "../services/notifications";
import { theme } from "../lib/theme";

export default function Notifications() {
  const client = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    return;
  }, []);

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Notifications</Text>
      {!data.length && <Text style={styles.empty}>No notifications yet.</Text>}
      {data.map((item) => (
        <Pressable
          key={String(item.id)}
          onPress={async () => {
            await markNotificationRead(String(item.id));
            await client.invalidateQueries({ queryKey: ["notifications"] });
          }}
          style={[styles.card, !item.read_at && styles.unread]}
        >
          <Text style={styles.heading}>{String(item.title)}</Text>
          <Text style={styles.body}>{String(item.body)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 18, paddingBottom: 30 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg },
  title: { fontSize: 28, fontWeight: "900", color: theme.colors.text, marginBottom: 12 },
  card: { backgroundColor: "#fff", borderRadius: 15, padding: 15, marginTop: 9, borderWidth: 1, borderColor: theme.colors.border },
  unread: { borderColor: theme.colors.primary },
  heading: { fontSize: 14, fontWeight: "900", color: theme.colors.text },
  body: { marginTop: 5, color: theme.colors.muted, lineHeight: 18 },
  empty: { marginTop: 20, color: theme.colors.muted },
});
