import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { theme } from "../../lib/theme";

export default function Otp() {
  const { phone = "" } = useLocalSearchParams<{ phone: string }>();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    if (token.trim().length < 6) return Alert.alert("Invalid OTP", "Enter the 6-digit code.");
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: token.trim(), type: "sms" });
    setBusy(false);
    if (error) return Alert.alert("Verification failed", error.message);
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your number</Text>
      <Text style={styles.subtitle}>We sent a code to {phone}.</Text>
      <TextInput value={token} onChangeText={setToken} keyboardType="number-pad" maxLength={6} placeholder="123456" style={styles.input} />
      <Pressable style={styles.button} onPress={verify} disabled={busy}><Text style={styles.buttonText}>{busy ? "Verifying..." : "Verify & Continue"}</Text></Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:theme.colors.bg,padding:24,paddingTop:64},
  title:{fontSize:30,fontWeight:"900",color:theme.colors.text},
  subtitle:{marginTop:8,fontSize:14,color:theme.colors.muted},
  input:{marginTop:28,backgroundColor:"#fff",borderWidth:1,borderColor:theme.colors.border,borderRadius:theme.radius.md,padding:16,fontSize:22,letterSpacing:6},
  button:{marginTop:14,backgroundColor:theme.colors.primary,borderRadius:theme.radius.md,padding:16,alignItems:"center"},
  buttonText:{color:"#fff",fontWeight:"800"}
});
