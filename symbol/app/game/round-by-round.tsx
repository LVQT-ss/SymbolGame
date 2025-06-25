import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { gameAPI } from "../../services/api";

interface GameSession {
  id: number;
  number_of_rounds: number;
  completed: boolean;
  score: number;
  correct_answers: number;
  total_time: number;
  admin_instructions?: string;
  created_by_admin: boolean;
}

interface CurrentRound {
  round_number: number;
  first_number: number;
  second_number: number;
}

interface Progress {
  current_round_number?: number;
  completed_rounds: number;
  total_rounds: number;
  is_completed: boolean;
}

export default function RoundByRoundGame() {
  const { gameId } = useLocalSearchParams();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [currentRound, setCurrentRound] = useState<CurrentRound | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    loadGameSession();
  }, [gameId]);

  const loadGameSession = async () => {
    try {
      setLoading(true);
      const response = await gameAPI.getGameSession(gameId as string);
      setGameSession(response.game_session);
      setCurrentRound(response.current_round);
      setProgress(response.progress);
      setStartTime(Date.now());

      // If game is already completed, navigate to results
      if (response.progress.is_completed) {
        navigateToResults();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const submitRound = async (userSymbol: string) => {
    if (!currentRound || submitting || !startTime) return;

    try {
      setSubmitting(true);
      const responseTime = (Date.now() - startTime) / 1000;

      const roundData = {
        round_number: currentRound.round_number,
        user_symbol: userSymbol,
        response_time: responseTime,
      };

      const response = await gameAPI.submitRound(gameId as string, roundData);

      // Show round result feedback
      Alert.alert(
        response.round_result.is_correct ? "✅ Correct!" : "❌ Wrong!",
        `${currentRound.first_number} ${response.round_result.correct_symbol} ${currentRound.second_number}\n` +
          `Your answer: ${userSymbol}\n` +
          `Time: ${responseTime.toFixed(1)}s`,
        [
          {
            text: "Next",
            onPress: () => {
              if (response.progress.is_game_complete) {
                completeGame();
              } else {
                // Move to next round
                setCurrentRound(response.next_round);
                setProgress(response.progress);
                setStartTime(Date.now());
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const completeGame = async () => {
    try {
      setLoading(true);
      await gameAPI.completeGameRounds(gameId as string);
      navigateToResults();
    } catch (error: any) {
      Alert.alert("Error", error.message);
      // Even if there's an error, try to navigate to results
      navigateToResults();
    } finally {
      setLoading(false);
    }
  };

  const navigateToResults = () => {
    router.push({
      pathname: "/game/gameResult",
      params: { sessionId: gameId as string },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  if (!currentRound) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Game Complete!</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigateToResults()}
        >
          <Text style={styles.buttonText}>View Results</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#666", marginTop: 10 }]}
          onPress={() => router.replace("/game/menu")}
        >
          <Text style={styles.buttonText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Round {currentRound.round_number}</Text>
        <Text style={styles.progress}>
          {progress?.completed_rounds}/{progress?.total_rounds} completed
        </Text>
        {gameSession?.admin_instructions && (
          <Text style={styles.instructions}>
            {gameSession.admin_instructions}
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${
                ((progress?.completed_rounds || 0) /
                  (progress?.total_rounds || 1)) *
                100
              }%`,
            },
          ]}
        />
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>Compare the numbers</Text>
        <View style={styles.numbersContainer}>
          <Text style={styles.number}>{currentRound.first_number}</Text>
          <Text style={styles.vs}>VS</Text>
          <Text style={styles.number}>{currentRound.second_number}</Text>
        </View>
      </View>

      {/* Answer Buttons */}
      <View style={styles.answersContainer}>
        <TouchableOpacity
          style={[styles.answerButton, styles.greaterButton]}
          onPress={() => submitRound(">")}
          disabled={submitting}
        >
          <Text style={styles.answerText}>
            {currentRound.first_number} {">"} {currentRound.second_number}
          </Text>
          <Text style={styles.symbolText}>GREATER</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.answerButton, styles.equalButton]}
          onPress={() => submitRound("=")}
          disabled={submitting}
        >
          <Text style={styles.answerText}>
            {currentRound.first_number} {"="} {currentRound.second_number}
          </Text>
          <Text style={styles.symbolText}>EQUAL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.answerButton, styles.lessButton]}
          onPress={() => submitRound("<")}
          disabled={submitting}
        >
          <Text style={styles.answerText}>
            {currentRound.first_number} {"<"} {currentRound.second_number}
          </Text>
          <Text style={styles.symbolText}>LESS</Text>
        </TouchableOpacity>
      </View>

      {submitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.submittingText}>Submitting...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  progress: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  instructions: {
    fontSize: 14,
    color: "#007AFF",
    textAlign: "center",
    fontStyle: "italic",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginBottom: 30,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
  questionContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  questionText: {
    fontSize: 20,
    color: "#666",
    marginBottom: 20,
  },
  numbersContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  number: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 10,
    textAlign: "center",
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vs: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#999",
  },
  answersContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 15,
  },
  answerButton: {
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greaterButton: {
    backgroundColor: "#4CAF50",
  },
  equalButton: {
    backgroundColor: "#FF9800",
  },
  lessButton: {
    backgroundColor: "#F44336",
  },
  answerText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  symbolText: {
    color: "#FFF",
    fontSize: 14,
    opacity: 0.9,
  },
  submittingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  submittingText: {
    color: "#FFF",
    fontSize: 18,
    marginTop: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
