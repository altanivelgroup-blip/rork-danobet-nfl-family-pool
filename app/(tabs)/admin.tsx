import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const [isAdmin] = useState(true);

  const handleUnlockResults = () => {
    Alert.alert("Success", "Results unlocked for all users!");
    console.log("Admin action: Unlock results");
  };

  const handleAwardWinners = () => {
    Alert.alert("Success", "Winners awarded!");
    console.log("Admin action: Award winners");
  };

  const handleResetWeek = () => {
    Alert.alert("Confirm", "Reset next week?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: () => {
          console.log("Admin action: Reset week");
        },
      },
    ]);
  };

  if (!isAdmin) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.noAccessText}>🚫 Admin access only</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.headerText}>⚙️ Admin Panel</Text>
        <Text style={styles.subHeader}>DanoBet.G Controls</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Controls</Text>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleUnlockResults}
            testID="unlock-results"
          >
            <Text style={styles.buttonText}>🔓 Unlock Results</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.successButton]}
            onPress={handleAwardWinners}
            testID="award-winners"
          >
            <Text style={styles.buttonText}>🏆 Award Winners</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={handleResetWeek}
            testID="reset-week"
          >
            <Text style={styles.buttonText}>🔄 Reset Next Week</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>✅ Backend Connected</Text>
            <Text style={styles.statusText}>✅ Database Active</Text>
            <Text style={styles.statusText}>✅ Leaderboard Synced</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#002C5F",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#008E97",
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subHeader: {
    fontSize: 16,
    color: "#E1E8ED",
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginVertical: 6,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#008E97",
  },
  successButton: {
    backgroundColor: "#10b981",
  },
  warningButton: {
    backgroundColor: "#FC4C02",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statusCard: {
    backgroundColor: "#0b1220",
    borderRadius: 14,
    padding: 16,
  },
  statusText: {
    fontSize: 14,
    color: "#E1E8ED",
    marginVertical: 4,
  },
  noAccessText: {
    fontSize: 20,
    color: "#E1E8ED",
    textAlign: "center",
  },
});
