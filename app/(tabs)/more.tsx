import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../lib/theme";

export default function More() {
  return (
    <View style={s.page}>
      <Text style={s.title}>More</Text>
      <Text style={s.sub}>Profile, help, settings and account controls.</Text>
      <Link href="/profile" asChild>
        <Pressable style={s.item}><Text style={s.itemText}>Profile & team name</Text><Text style={s.arrow}>›</Text></Pressable>
      </Link>
      <Link href="/notifications" asChild>
        <Pressable style={s.item}><Text style={s.itemText}>Notifications</Text><Text style={s.arrow}>›</Text></Pressable>
      </Link>
      <Link href="/admin" asChild>
        <Pressable style={s.item}><Text style={s.itemText}>Admin operations</Text><Text style={s.arrow}>›</Text></Pressable>
      </Link>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.bg, padding: 20, paddingTop: 28 },
  title: { fontSize: 28, fontWeight: "900", color: theme.colors.text },
  sub: { marginTop: 8, color: theme.colors.muted, lineHeight: 21 },
  item: { marginTop: 20, backgroundColor: "#fff", borderRadius: 15, borderWidth: 1, borderColor: theme.colors.border, padding: 16, flexDirection: "row", justifyContent: "space-between" },
  itemText: { color: theme.colors.text, fontWeight: "800" },
  arrow: { color: theme.colors.muted, fontSize: 22 },
});