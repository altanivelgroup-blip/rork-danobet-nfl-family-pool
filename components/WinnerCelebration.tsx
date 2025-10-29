import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Trophy } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

interface Confetti {
  x: number;
  y: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
}

interface WinnerCelebrationProps {
  visible: boolean;
  winnerName: string;
  winnerPoints: number;
  onClose: () => void;
}

const CONFETTI_COLORS = ["#FC4C02", "#008E97", "#FFD700", "#10b981", "#E1E8ED"];

export default function WinnerCelebration({
  visible,
  winnerName,
  winnerPoints,
  onClose,
}: WinnerCelebrationProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const trophyScale = useRef(new Animated.Value(0)).current;
  const trophyRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const particles: Confetti[] = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * width,
          y: new Animated.Value(-50),
          rotation: new Animated.Value(0),
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: Math.random() * 10 + 5,
        });
      }
      setConfetti(particles);

      Animated.parallel([
        Animated.spring(trophyScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(trophyRotation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(trophyRotation, {
            toValue: -1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(trophyRotation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      particles.forEach((particle, i) => {
        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: height + 50,
            duration: 3000 + Math.random() * 2000,
            delay: i * 30,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(particle.rotation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            })
          ),
        ]).start();
      });
    } else {
      trophyScale.setValue(0);
      trophyRotation.setValue(0);
    }
  }, [visible]);

  const trophyRotationInterpolate = trophyRotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-15deg", "15deg"],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {confetti.map((particle, i) => {
          const rotationInterpolate = particle.rotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: particle.x,
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  transform: [
                    { translateY: particle.y },
                    { rotate: rotationInterpolate },
                  ],
                },
              ]}
            />
          );
        })}

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.trophyContainer,
              {
                transform: [
                  { scale: trophyScale },
                  { rotate: trophyRotationInterpolate },
                ],
              },
            ]}
          >
            <View style={styles.trophyGlow}>
              <Trophy size={80} color="#FFD700" fill="#FFD700" />
            </View>
          </Animated.View>

          <Text style={styles.congrats}>🎉 WINNER! 🎉</Text>
          <Text style={styles.winnerName}>{winnerName}</Text>
          <Text style={styles.points}>{winnerPoints} Points</Text>

          <View style={styles.grandmaMessage}>
            <Text style={styles.grandmaEmoji}>👵</Text>
            <Text style={styles.grandmaText}>
              &ldquo;Well done, sweetheart! Grandma is proud of you!&rdquo;
            </Text>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  confetti: {
    position: "absolute",
    borderRadius: 2,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  trophyContainer: {
    marginBottom: 24,
  },
  trophyGlow: {
    backgroundColor: "#FFD70030",
    borderRadius: 60,
    padding: 20,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  congrats: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  winnerName: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: "#FFD700",
    marginBottom: 8,
    textAlign: "center",
  },
  points: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: "#FC4C02",
    marginBottom: 32,
  },
  grandmaMessage: {
    backgroundColor: "#008E9730",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#008E97",
  },
  grandmaEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  grandmaText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#E1E8ED",
    textAlign: "center",
    fontStyle: "italic" as const,
  },
  closeButton: {
    backgroundColor: "#FC4C02",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
