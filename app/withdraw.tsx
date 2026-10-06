import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { requestWithdrawal } from "../services/withdrawals";
import { theme } from "../lib/theme";

export default function Withdraw() {
  const [amount, setAmount] = useState("");
  const [upi, setUpi] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    setMessage("");
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 100) {
      setMessage("Minimum withdrawal is ₹100.");
      return;
    }
    try {
      await requestWithdrawal(value, { type: "upi", upi });
      setAmount("");
      setMessage("Withdrawal request submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Withdrawal failed.");
    }
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Withdraw</Text>
      <Text style={styles.note}>Funds are reserved immediately. Rejected requests are refunded automatically.</Text>
      <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Amount" style={styles.input} />
      <TextInput value={upi} onChangeText={setUpi} autoCapitalize="none" placeholder="UPI ID" style={styles.input} />
      <Pressable onPress={submit} style={styles.button}><Text style={styles.buttonText}>Request withdrawal</Text></Pressable>
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles=StyleSheet.create({
  page:{flex:1,backgroundColor:theme.colors.bg,padding:20,paddingTop:28},
  title:{fontSize:28,fontWeight:"900",color:theme.colors.text},
  note:{marginTop:8,color:theme.colors.muted,lineHeight:19},
  input:{marginTop:14,backgroundColor:"#fff",borderWidth:1,borderColor:theme.colors.border,borderRadius:12,padding:14},
  button:{marginTop:14,backgroundColor:theme.colors.primary,borderRadius:12,padding:14,alignItems:"center"},
  buttonText:{color:"#fff",fontWeight:"900"},
  message:{marginTop:14,color:theme.colors.primary,fontWeight:"700"},
});
