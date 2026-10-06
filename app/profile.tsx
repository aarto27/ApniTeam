import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { theme } from "../../lib/theme";

export default function Profile() {
  const [teamName, setTeamName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    const value = teamName.trim();
    if (!value) { setMessage("Team name is required."); return; }
    setSaving(true);
    setMessage("");
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Sign in required.");
      const { error } = await supabase.from("profiles").upsert({ id: data.user.id, team_name: value });
      if (error) throw error;
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.page}>
      <Text style={styles.kicker}>PROFILE</Text>
      <Text style={styles.title}>Your team identity</Text>
      <Text style={styles.sub}>This name can be shown on contest entries and leaderboards.</Text>
      <TextInput value={teamName} onChangeText={setTeamName} placeholder="Team name" placeholderTextColor={theme.colors.muted} style={styles.input} maxLength={40} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable disabled={saving} onPress={save} style={[styles.button, saving && styles.disabled]}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save profile</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.bg, padding: 20, paddingTop: 28 },
  kicker: { color: theme.colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: theme.colors.text, fontSize: 27, fontWeight: "900", marginTop: 5 },
  sub: { color: theme.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  input: { marginTop: 20, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 14, color: theme.colors.text },
  message: { marginTop: 12, color: theme.colors.primary, fontWeight: "700" },
  button: { marginTop: 18, backgroundColor: theme.colors.primary, borderRadius: 14, padding: 15, alignItems: "center" },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "900" },
});