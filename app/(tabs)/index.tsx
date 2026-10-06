import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "../../lib/theme";

const matches = [
  { id:"demo-1", title:"India vs Australia", league:"International", starts:"Today · 7:30 PM", status:"UPCOMING" },
  { id:"demo-2", title:"Arsenal vs Chelsea", league:"Premier League", starts:"Today · 10:00 PM", status:"UPCOMING" },
];

export default function Home() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.top}><View><Text style={styles.greeting}>Welcome back</Text><Text style={styles.brand}>ApniTeam</Text></View><View style={styles.wallet}><Text style={styles.walletLabel}>Balance</Text><Text style={styles.walletValue}>₹0</Text></View></View>
      <View style={styles.hero}><Text style={styles.heroKicker}>FANTASY SPORTS</Text><Text style={styles.heroTitle}>Pick smart.<Text> Play better.</Text></Text><Text style={styles.heroText}>Create teams before the deadline and follow every point live.</Text></View>
      <Text style={styles.section}>Matches</Text>
      {matches.map(m => <Link key={m.id} href={{ pathname:"/match/[id]", params:{id:m.id} }} asChild><View style={styles.matchCard}><View><Text style={styles.status}>{m.status}</Text><Text style={styles.matchTitle}>{m.title}</Text><Text style={styles.league}>{m.league}</Text><Text style={styles.start}>{m.starts}</Text></View><Text style={styles.arrow}>›</Text></View></Link>)}
    </ScrollView>
  );
}
const styles=StyleSheet.create({
 page:{flex:1,backgroundColor:theme.colors.bg},content:{padding:18,paddingTop:24,paddingBottom:30},
 top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},greeting:{fontSize:12,color:theme.colors.muted},brand:{fontSize:24,fontWeight:"900",color:theme.colors.text},
 wallet:{backgroundColor:"#fff",borderRadius:14,paddingHorizontal:14,paddingVertical:10,borderWidth:1,borderColor:theme.colors.border},walletLabel:{fontSize:10,color:theme.colors.muted},walletValue:{fontSize:16,fontWeight:"900",color:theme.colors.text},
 hero:{marginTop:18,backgroundColor:theme.colors.primary,borderRadius:22,padding:22},heroKicker:{color:"#FFD9DD",fontSize:11,fontWeight:"800",letterSpacing:1.4},heroTitle:{color:"#fff",fontSize:30,fontWeight:"900",marginTop:8},heroText:{color:"#FFECEF",fontSize:13,lineHeight:19,marginTop:8},
 section:{fontSize:18,fontWeight:"900",color:theme.colors.text,marginTop:26,marginBottom:10},matchCard:{backgroundColor:"#fff",borderRadius:18,borderWidth:1,borderColor:theme.colors.border,padding:16,marginBottom:10,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},status:{fontSize:10,color:theme.colors.primary,fontWeight:"900",letterSpacing:1},matchTitle:{fontSize:17,fontWeight:"800",color:theme.colors.text,marginTop:4},league:{fontSize:12,color:theme.colors.muted,marginTop:2},start:{fontSize:12,color:theme.colors.text,marginTop:8,fontWeight:"700"},arrow:{fontSize:28,color:theme.colors.muted}
});
