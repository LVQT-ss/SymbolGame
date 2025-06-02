import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive helper functions
const getResponsiveFontSize = (baseSize: number) => {
  const width = Dimensions.get("window").width;
  if (width >= 1024) return baseSize * 1.4;
  if (width >= 768) return baseSize * 1.2;
  return baseSize;
};

const getResponsivePadding = () => {
  const width = Dimensions.get("window").width;
  if (width >= 1024) return 32;
  if (width >= 768) return 24;
  return 20;
};

export default function GameScreen() {
  const params = useLocalSearchParams();
  const { sessionId, gameType, title } = params;

  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (gameStarted && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, countdown]);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleBackToMenu = () => {
    Alert.alert("Leave Game", "Are you sure you want to leave the game?", [
      { text: "Stay", style: "cancel" },
      { text: "Leave", onPress: () => router.back() },
    ]);
  };

  const handleGameComplete = () => {
    Alert.alert(
      "Game Complete!",
      "Well played! Your score has been recorded.",
      [
        { text: "Play Again", onPress: () => router.back() },
        { text: "Menu", onPress: () => router.replace("/game/menu") },
      ]
    );
  };

  const renderWaitingScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToMenu}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Game Lobby</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.gameInfo}>
          <Ionicons name="game-controller" size={64} color="#ffd33d" />
          <Text style={styles.gameTitle}>{title || "Game Session"}</Text>
          <Text style={styles.gameType}>{gameType || "Unknown"}</Text>
          <Text style={styles.sessionId}>Session: {sessionId}</Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to Play:</Text>
          <Text style={styles.instructionsText}>
            • Match symbols as quickly as possible{"\n"}• Higher accuracy = more
            points{"\n"}• Beat other players to win{"\n"}• Earn coins and
            experience
          </Text>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCountdown = () => (
    <View style={styles.container}>
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownText}>Get Ready!</Text>
        <Text style={styles.countdownNumber}>{countdown}</Text>
        <Text style={styles.countdownSubtext}>Game starting...</Text>
      </View>
    </View>
  );

  const renderGame = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToMenu}>
          <Ionicons name="pause" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: 0</Text>
        </View>
      </View>

      <View style={styles.gameArea}>
        <Text style={styles.placeholderText}>🎮</Text>
        <Text style={styles.gameInstructions}>
          Game Implementation Coming Soon!
        </Text>
        <Text style={styles.gameDetails}>
          This is where the actual {gameType} game would be implemented.
        </Text>

        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleGameComplete}
        >
          <Text style={styles.demoButtonText}>Simulate Game Complete</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gameControls}>
        <View style={styles.timerContainer}>
          <Ionicons name="time" size={16} color="#888" />
          <Text style={styles.timerText}>05:00</Text>
        </View>
        <View style={styles.livesContainer}>
          <Ionicons name="heart" size={16} color="#F44336" />
          <Text style={styles.livesText}>3</Text>
        </View>
      </View>
    </View>
  );

  if (!gameStarted) {
    return renderWaitingScreen();
  }

  if (countdown > 0) {
    return renderCountdown();
  }

  return renderGame();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: getResponsivePadding(),
    paddingTop: getResponsivePadding(),
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: getResponsiveFontSize(20),
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  scoreText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: "#ffd33d",
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(),
    justifyContent: "center",
    alignItems: "center",
  },
  gameInfo: {
    alignItems: "center",
    marginBottom: 40,
  },
  gameTitle: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    textAlign: "center",
  },
  gameType: {
    fontSize: getResponsiveFontSize(16),
    color: "#ffd33d",
    marginTop: 8,
  },
  sessionId: {
    fontSize: getResponsiveFontSize(12),
    color: "#888",
    marginTop: 4,
  },
  instructions: {
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    width: "100%",
    maxWidth: 400,
  },
  instructionsTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: getResponsiveFontSize(14),
    color: "#ccc",
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: "#ffd33d",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    color: "#25292e",
  },
  countdownContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#25292e",
  },
  countdownText: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  countdownNumber: {
    fontSize: getResponsiveFontSize(80),
    fontWeight: "bold",
    color: "#ffd33d",
    marginBottom: 20,
  },
  countdownSubtext: {
    fontSize: getResponsiveFontSize(16),
    color: "#888",
  },
  gameArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: getResponsivePadding(),
  },
  placeholderText: {
    fontSize: 100,
    marginBottom: 20,
  },
  gameInstructions: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  gameDetails: {
    fontSize: getResponsiveFontSize(14),
    color: "#888",
    textAlign: "center",
    marginBottom: 30,
  },
  demoButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  demoButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: "#fff",
  },
  gameControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
    backgroundColor: "#2a2d32",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timerText: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 6,
  },
  livesContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  livesText: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 6,
  },
});
