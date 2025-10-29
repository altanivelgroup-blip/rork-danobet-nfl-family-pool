import { StyleSheet, Text, View, Image, ScrollView } from "react-native";

export default function TabOneScreen() {
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerContainer}>
        <Image
          source={require("@/assets/images/dano-tribute.png")}
          style={styles.tributeImage}
        />
        <Text style={styles.tributeText}>
          Dano says: Choose wisely… are you happy with your picks?
        </Text>
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.title}>DanoBet.G 🏈</Text>
        <Text style={styles.text}>Weekly NFL Family Pool</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#002C5F",
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#008E97",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 5,
  },
  tributeImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FC4C02",
    marginBottom: 10,
  },
  tributeText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "700",
    marginTop: 4,
    textShadowColor: "#002C5F",
    textShadowRadius: 4,
    paddingHorizontal: 20,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  text: {
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 20,
    color: "#E1E8ED",
  },
});
