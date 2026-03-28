import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Gift, Heart } from "lucide-react-native";

interface GrandmaSuperbowlProps {
  visible: boolean;
  onClose: () => void;
  seasonWinner: {
    name: string;
    emoji: string;
    totalWins: number;
  };
}

export default function GrandmaSuperbowl({
  visible,
  onClose,
  seasonWinner,
}: GrandmaSuperbowlProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(heartPulse, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(heartPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
      heartPulse.setValue(1);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[styles.content, { transform: [{ scale: scaleAnim }] }]}
          >
            <View style={styles.grandmaContainer}>
              <Text style={styles.grandmaEmoji}>👵</Text>
              <Animated.View
                style={{ transform: [{ scale: heartPulse }] }}
              >
                <Heart size={32} color="#FC4C02" fill="#FC4C02" />
              </Animated.View>
            </View>

            <Text style={styles.title}>
              Grandma&apos;s Super Bowl Special
            </Text>

            <View style={styles.messageCard}>
              <Text style={styles.message}>
                &ldquo;My dear family,{"\n\n"}
                Another wonderful season has come to an end. Watching you all
                compete, laugh, and spend time together brings such joy to my
                heart.{"\n\n"}
                This isn&apos;t just about football - it&apos;s about family, tradition,
                and the memories we create together.&rdquo;
              </Text>
            </View>

            <View style={styles.winnerSection}>
              <Text style={styles.winnerLabel}>Season Champion</Text>
              <View style={styles.winnerCard}>
                <Text style={styles.winnerEmoji}>{seasonWinner.emoji}</Text>
                <Text style={styles.winnerName}>{seasonWinner.name}</Text>
                <Text style={styles.winnerStats}>
                  {seasonWinner.totalWins} Wins
                </Text>
              </View>
            </View>

            <View style={styles.giftSection}>
              <Gift size={40} color="#FFD700" />
              <Text style={styles.giftTitle}>Special Gift Awaits!</Text>
              <Text style={styles.giftMessage}>
                {seasonWinner.name}, Grandma has something special for you!
                {"\n"}
                See you at Sunday dinner! 🍽️
              </Text>
            </View>

            <View style={styles.familySection}>
              <Text style={styles.familyTitle}>Thank You Everyone!</Text>
              <Text style={styles.familyMessage}>
                To all my grandchildren, children, and extended family -{"\n"}
                Thank you for making this season memorable.{"\n"}
                Can&apos;t wait to do it again next year! 🏈❤️
              </Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>
                Close with Love ❤️
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "#fff5f0",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  grandmaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  grandmaEmoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#002C5F",
    marginBottom: 20,
    textAlign: "center",
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#008E97",
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: "#002C5F",
    fontStyle: "italic" as const,
    textAlign: "left",
  },
  winnerSection: {
    width: "100%",
    marginBottom: 24,
  },
  winnerLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  winnerCard: {
    backgroundColor: "#FFD70030",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  winnerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  winnerName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#002C5F",
    marginBottom: 4,
  },
  winnerStats: {
    fontSize: 16,
    color: "#FC4C02",
    fontWeight: "600" as const,
  },
  giftSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  giftTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#002C5F",
    marginTop: 12,
    marginBottom: 8,
  },
  giftMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  familySection: {
    backgroundColor: "#008E9720",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: "100%",
  },
  familyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#002C5F",
    textAlign: "center",
    marginBottom: 12,
  },
  familyMessage: {
    fontSize: 14,
    color: "#002C5F",
    textAlign: "center",
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: "#FC4C02",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
