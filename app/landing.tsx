import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleNavigate = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.replace("/(tabs)");
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/i0x7khabc8qq558cnkt0m" }}
            style={styles.image}
          />
        </View>

        <Text style={styles.quoteText}>
          This isn&apos;t just football. It&apos;s family.
        </Text>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleNavigate}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonIcon}>🏈</Text>
            <Text style={styles.buttonText}>Make Your Picks</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0097A7",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  imageContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#FF6B00",
    marginBottom: 32,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  quoteText: {
    fontSize: 24,
    fontStyle: "italic",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 48,
    lineHeight: 32,
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#FF6B00",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    gap: 10,
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
