import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useWallet } from "../../features/wallet/useWallet";
import { formatCurrency } from "../../lib/format";
import { theme } from "../../lib/theme";

export default function Wallet() {
  const { data, isLoading, isError } = useWallet();

  return (
    <View style={styles.page}>
      <Text style={styles.kicker}>WALLET</Text>
      <Text style={styles.title}>Your balance</Text>

      <View style={styles.balance}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.amount}>{formatCurrency(data?.balance ?? 0)}</Text>}
        <Text style={styles.caption}>Available balance</Text>
      </View>

      {isError && <Text style={styles.error}>Unable to load wallet. Sign in and try again.</Text>}

      <View style={styles.grid}>
        <View style={styles.item}><Text style={styles.label}>Deposit</Text><Text style={styles.value}>{formatCurrency(data?.deposit ?? 0)}</Text></View>
        <View style={styles.item}><Text style={styles.label}>Winnings</Text><Text style={styles.value}>{formatCurrency(data?.winnings ?? 0)}</Text></View>
        <View style={styles.item}><Text style={styles.label}>Bonus</Text><Text style={styles.value}>{formatCurrency(data?.bonus ?? 0)}</Text></View>
      </View>

      <Text style={styles.note}>Payments and withdrawals are server-authoritative. The app never changes wallet balances directly.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.bg, padding: 20, paddingTop: 28 },
  kicker: { color: theme.colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: "900", marginTop: 5 },
  balance: { marginTop: 20, backgroundColor: theme.colors.primary, borderRadius: 20, padding: 22 },
  amount: { color: "#fff", fontSize: 34, fontWeight: "900" },
  caption: { color: "#FFECEF", marginTop: 5, fontSize: 12 },
  grid: { flexDirection: "row", gap: 8, marginTop: 12 },
  item: { flex: 1, backgroundColor: "#fff", borderRadius: 13, borderWidth: 1, borderColor: theme.colors.border, padding: 12 },
  label: { color: theme.colors.muted, fontSize: 10, fontWeight: "700" },
  value: { color: theme.colors.text, fontSize: 14, fontWeight: "900", marginTop: 5 },
  error: { marginTop: 12, color: theme.colors.primary, fontWeight: "700" },
  note: { marginTop: 20, color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
});