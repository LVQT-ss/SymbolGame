import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from "react-native";
import { gameAPI } from "../../services/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface GameSession {
  id: number;
  number_of_rounds: number;
  completed: boolean;
  score: number;
  correct_answers: number;
  total_time: number;
  started_at?: string;
  completed_at?: string;
}

interface GameRound {
  round_number: number;
  first_number: number;
  second_number: number;
  user_symbol?: string;
  response_time?: number;
  is_correct?: boolean;
  points_earned?: number;
}

interface Player {
  id: number;
  username: string;
  full_name: string;
  current_level: number;
}

export default function GameResultScreen() {
  const params = useLocalSearchParams();
  const sessionId = params.sessionId as string;

  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadGameResults();
    }
  }, [sessionId]);

  const loadGameResults = async () => {
    try {
      setLoading(true);
      console.log("🔄 Loading game results for session ID:", sessionId);

      // Get current user data
      const { userAPI } = await import("../../services/api");
      const userData = await userAPI.getStoredUserData();
      if (userData) {
        setPlayer(userData);
      }

      // Load game session and results
      const response = await gameAPI.getGameSession(parseInt(sessionId));
      console.log("✅ Game results loaded:", response);

      if (response && response.game_session) {
        setGameSession(response.game_session);
        setRounds(response.rounds || []);
      } else {
        setError("Game session not found");
      }
    } catch (error) {
      console.error("❌ Error loading game results:", error);
      setError("Failed to load game results");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    // Show the raw time with 3 decimal places (e.g., 3.771)
    return seconds.toFixed(3);
  };

  const getPerformanceRating = (
    accuracy: number
  ): { text: string; color: string; icon: string } => {
    if (accuracy >= 90)
      return { text: "Excellent!", color: "#4CAF50", icon: "star" };
    if (accuracy >= 75)
      return { text: "Great!", color: "#8BC34A", icon: "thumbs-up" };
    if (accuracy >= 60)
      return { text: "Good", color: "#FFC107", icon: "checkmark-circle" };
    if (accuracy >= 40)
      return { text: "Fair", color: "#FF9800", icon: "help-circle" };
    return { text: "Keep Practicing", color: "#F44336", icon: "refresh" };
  };

  const calculateAverageTime = (): number => {
    if (rounds.length === 0) return 0;
    const totalResponseTime = rounds.reduce(
      (sum, round) => sum + (round.response_time || 0),
      0
    );
    return totalResponseTime / rounds.length;
  };

  const getFastestRound = (): GameRound | null => {
    if (rounds.length === 0) return null;
    return rounds.reduce((fastest, current) => {
      if (
        !fastest ||
        (current.response_time &&
          current.response_time < (fastest.response_time || Infinity))
      ) {
        return current;
      }
      return fastest;
    });
  };

  const getSlowestRound = (): GameRound | null => {
    if (rounds.length === 0) return null;
    return rounds.reduce((slowest, current) => {
      if (
        !slowest ||
        (current.response_time &&
          current.response_time > (slowest.response_time || 0))
      ) {
        return current;
      }
      return slowest;
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffd33d" />
        <Text style={styles.loadingText}>Loading game results...</Text>
      </View>
    );
  }

  if (error || !gameSession) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={80} color="#F44336" />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>
          {error || "Unable to load game results"}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/game/menu")}
        >
          <Text style={styles.backButtonText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const accuracy =
    gameSession.number_of_rounds > 0
      ? (gameSession.correct_answers / gameSession.number_of_rounds) * 100
      : 0;
  const performance = getPerformanceRating(accuracy);
  const averageTime = calculateAverageTime();
  const fastestRound = getFastestRound();
  const slowestRound = getSlowestRound();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#25292e" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header with Trophy */}
        <View style={styles.resultHeader}>
          <Ionicons
            name={performance.icon as any}
            size={64}
            color={performance.color}
          />
          <Text style={styles.resultTitle}>Game Complete!</Text>
          <Text style={[styles.performanceText, { color: performance.color }]}>
            {performance.text}
          </Text>
        </View>

        {/* Main Score Card */}
        <View style={styles.mainScoreCard}>
          <Text style={styles.finalScoreLabel}>Final Score</Text>
          <Text style={styles.finalScore}>{gameSession.score || 0}</Text>
          <Text style={styles.accuracyText}>
            {gameSession.correct_answers}/{gameSession.number_of_rounds} correct
            ({accuracy.toFixed(1)}%)
          </Text>
        </View>

        {/* Performance Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="time" size={28} color="#2196F3" />
            <Text style={styles.statLabel}>Total Time</Text>
            <Text style={styles.statValue}>
              {formatTime(gameSession.total_time)}
            </Text>
            <Text style={styles.statSubtext}>
              Avg: {formatTime(averageTime)} per round
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="flash" size={28} color="#FF9800" />
            <Text style={styles.statLabel}>Fastest Round</Text>
            <Text style={styles.statValue}>
              {fastestRound
                ? formatTime(fastestRound.response_time || 0)
                : "N/A"}
            </Text>
            {fastestRound && (
              <Text style={styles.statSubtext}>
                Round {fastestRound.round_number}
              </Text>
            )}
          </View>
        </View>

        {/* Detailed Analysis */}
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisTitle}>📊 Performance Analysis</Text>

          <View style={styles.analysisRow}>
            <Text style={styles.analysisLabel}>Speed Rating</Text>
            <Text style={styles.analysisValue}>
              {averageTime < 2
                ? "⚡ Lightning Fast"
                : averageTime < 4
                ? "🔥 Quick"
                : averageTime < 6
                ? "⏱️ Steady"
                : "🐢 Take Your Time"}
            </Text>
          </View>

          <View style={styles.analysisRow}>
            <Text style={styles.analysisLabel}>Consistency</Text>
            <Text style={styles.analysisValue}>
              {fastestRound &&
              slowestRound &&
              slowestRound.response_time &&
              fastestRound.response_time
                ? Math.abs(
                    slowestRound.response_time - fastestRound.response_time
                  ) < 2
                  ? "🎯 Very Consistent"
                  : Math.abs(
                      slowestRound.response_time - fastestRound.response_time
                    ) < 4
                  ? "📈 Consistent"
                  : "📊 Variable"
                : "🤔 Analyzing..."}
            </Text>
          </View>

          <View style={styles.analysisRow}>
            <Text style={styles.analysisLabel}>Points per Correct</Text>
            <Text style={styles.analysisValue}>
              {gameSession.correct_answers > 0
                ? Math.round(gameSession.score / gameSession.correct_answers)
                : 0}{" "}
              pts avg
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Action Buttons at Bottom */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/game/menu")}
        >
          <Ionicons name="home" size={24} color="#25292e" />
          <Text style={styles.primaryButtonText}>Back to Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/(tabs)/leaderboard")}
        >
          <Ionicons name="trophy" size={22} color="#ffd33d" />
          <Text style={styles.secondaryButtonText}>Leaderboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#25292e",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#25292e",
    padding: 20,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for fixed buttons
  },
  fixedButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    padding: 20,
    backgroundColor: "#25292e",
    borderTopWidth: 1,
    borderTopColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resultHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
    marginBottom: 6,
  },
  performanceText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  mainScoreCard: {
    backgroundColor: "#333",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#ffd33d",
  },
  finalScoreLabel: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 8,
    fontWeight: "600",
  },
  finalScore: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffd33d",
    marginBottom: 8,
  },
  accuracyText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  statLabel: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
  analysisContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  analysisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  analysisLabel: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  analysisValue: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },

  primaryButton: {
    flex: 1,
    backgroundColor: "#ffd33d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
    shadowColor: "#ffd33d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#25292e",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#333",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
    borderWidth: 2,
    borderColor: "#ffd33d",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryButtonText: {
    color: "#ffd33d",
    fontSize: 16,
    fontWeight: "600",
  },

  backButton: {
    backgroundColor: "#ffd33d",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  backButtonText: {
    color: "#25292e",
    fontSize: 16,
    fontWeight: "bold",
  },
});
