import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { theme } from "../../lib/theme";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const requestOtp = async () => {
    const normalized = phone.trim();
    if (!normalized) return Alert.alert("Phone required", "Enter your phone number.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    setBusy(false);
    if (error) return Alert.alert("Unable to send OTP", error.message);
    router.push({ pathname: "/auth/otp", params: { phone: normalized } });
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.eyebrow}>APNITEAM</Text>
        <Text style={styles.title}>Build your winning XI.</Text>
        <Text style={styles.subtitle}>Fast match discovery, cleaner team building, and live fantasy updates.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Mobile number</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 9876543210"
          placeholderTextColor={theme.colors.muted}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.88 }]} onPress={requestOtp} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? "Sending..." : "Continue"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 24, justifyContent: "space-between", paddingTop: 72, paddingBottom: 36 },
  eyebrow: { color: theme.colors.primary, fontWeight: "800", letterSpacing: 2, fontSize: 13 },
  title: { marginTop: 12, color: theme.colors.text, fontWeight: "900", fontSize: 36, lineHeight: 42 },
  subtitle: { marginTop: 12, color: theme.colors.muted, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 18, borderWidth: 1, borderColor: theme.colors.border },
  label: { color: theme.colors.text, fontWeight: "700", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, fontSize: 16, color: theme.colors.text },
  button: { marginTop: 12, backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 15, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
