import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { gameAPI } from "../../services/api";

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

interface Round {
  round_number: number;
  first_number: number;
  second_number: number;
  user_symbol?: string;
  response_time?: number;
  is_correct?: boolean;
}

interface GameSession {
  id: number;
  number_of_rounds: number;
  completed: boolean;
  score: number;
  correct_answers: number;
  total_time: number;
}

export default function GameScreen() {
  const params = useLocalSearchParams();
  const { sessionId, gameType, title } = params;

  // Validate and parse sessionId
  const parsedSessionId = useMemo(() => {
    if (!sessionId) {
      console.error("❌ No sessionId provided");
      return null;
    }

    const id = parseInt(sessionId as string, 10);
    if (isNaN(id)) {
      console.error(`❌ Invalid sessionId: ${sessionId}`);
      return null;
    }

    console.log(`✅ Valid sessionId: ${id}`);
    return id;
  }, [sessionId]);

  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [loading, setLoading] = useState(false);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number>(0);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<number>(0);

  useEffect(() => {
    if (parsedSessionId) {
      loadGameSession();
    } else {
      Alert.alert(
        "Invalid Game Session",
        "Cannot load game: Invalid session ID",
        [{ text: "Go Back", onPress: () => router.back() }]
      );
    }
  }, [parsedSessionId]);

  useEffect(() => {
    if (gameStarted && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameStarted && countdown === 0) {
      startFirstRound();
    }
  }, [gameStarted, countdown]);

  const loadGameSession = async () => {
    if (!parsedSessionId) return;

    try {
      setLoading(true);
      console.log(`🔄 Loading game session ${parsedSessionId}`);
      const response = await gameAPI.getGameSession(parsedSessionId);

      if (response && response.game_session) {
        setGameSession(response.game_session);
        setRounds(response.rounds || []);
        setScore(response.game_session.score || 0);
        setCorrectAnswers(response.game_session.correct_answers || 0);

        // Check if game is already completed
        if (
          response.game_session.completed ||
          response.progress?.is_completed
        ) {
          setGameCompleted(true);

          // Navigate to result screen for completed game
          router.push({
            pathname: "/game/gameResult",
            params: { sessionId: parsedSessionId?.toString() || sessionId },
          });
          return;
        } else {
          // Find current round
          const completedRounds = response.rounds.filter(
            (r: Round) => r.user_symbol
          ).length;
          setCurrentRoundIndex(completedRounds);

          // Check if all rounds are actually completed but game not marked as completed
          if (completedRounds >= response.game_session.number_of_rounds) {
            setGameCompleted(true);
            router.push({
              pathname: "/game/gameResult",
              params: { sessionId: parsedSessionId?.toString() || sessionId },
            });
            return;
          }
        }
      }
    } catch (error: any) {
      console.error("❌ Error loading game session:", error);

      // Check if this is the specific "invalid session ID" error
      if (error.message && error.message.includes("Must be a valid number")) {
        Alert.alert(
          "Invalid Game Session",
          "The game session ID is invalid. This might happen in offline mode.",
          [
            {
              text: "Go Back",
              onPress: () => router.back(),
            },
            {
              text: "Try Practice Mode",
              onPress: () => {
                // Create a simple practice round
                const practiceRounds: Round[] = [
                  { round_number: 1, first_number: 25, second_number: 18 },
                  { round_number: 2, first_number: 7, second_number: 31 },
                  { round_number: 3, first_number: 50, second_number: 50 },
                ];

                setRounds(practiceRounds);
                setGameSession({
                  id: 0,
                  number_of_rounds: 3,
                  completed: false,
                  score: 0,
                  correct_answers: 0,
                  total_time: 0,
                });

                Alert.alert(
                  "Practice Mode",
                  "Playing in offline practice mode. Your progress won't be saved.",
                  [{ text: "OK" }]
                );
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Connection Error",
          `Failed to load game session: ${
            error.message || "Unknown error"
          }. Please check your connection and try again.`,
          [{ text: "Go Back", onPress: () => router.back() }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const startFirstRound = () => {
    if (rounds.length > 0 && currentRoundIndex < rounds.length) {
      const now = Date.now();
      setRoundStartTime(now);
      setGameStartTime(now);
    }
  };

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleSymbolChoice = async (symbol: string) => {
    if (currentRoundIndex >= rounds.length || gameCompleted) return;

    const currentRound = rounds[currentRoundIndex];
    const responseTime = (Date.now() - roundStartTime) / 1000; // Convert to seconds

    // Calculate correct answer
    let correctSymbol = "=";
    if (currentRound.first_number > currentRound.second_number) {
      correctSymbol = ">";
    } else if (currentRound.first_number < currentRound.second_number) {
      correctSymbol = "<";
    }

    const isCorrect = symbol === correctSymbol;

    // Update local state
    const updatedRounds = [...rounds];
    updatedRounds[currentRoundIndex] = {
      ...currentRound,
      user_symbol: symbol,
      response_time: responseTime,
      is_correct: isCorrect,
    };
    setRounds(updatedRounds);

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
      setScore((prev) => prev + 100);
    }

    try {
      // Submit round to backend
      await gameAPI.submitRound(parsedSessionId, {
        round_number: currentRound.round_number,
        user_symbol: symbol,
        response_time: responseTime,
      });

      // Move to next round or complete game
      if (currentRoundIndex + 1 >= rounds.length) {
        // Game completed
        await completeGame(updatedRounds);
      } else {
        // Next round
        setCurrentRoundIndex((prev) => prev + 1);
        setRoundStartTime(Date.now());
      }
    } catch (error) {
      console.error("Error submitting round:", error);
      Alert.alert("Error", "Failed to submit round answer");
    }
  };

  const completeGame = async (finalRounds: Round[]) => {
    try {
      const calculatedTotalTime = finalRounds.reduce(
        (sum, round) => sum + (round.response_time || 0),
        0
      );

      // Calculate final score and correct answers
      const finalCorrectAnswers = finalRounds.filter(
        (round) => round.is_correct
      ).length;
      const calculatedFinalScore = finalRounds.reduce((sum, round) => {
        if (round.is_correct) {
          // Apply same scoring logic as backend (base 100 + time bonus)
          const responseTime = Math.min(
            10,
            Math.max(0.5, Math.round((round.response_time || 10) * 2) / 2)
          );
          const timeBonus = Math.max(0, (10 - responseTime) * 5);
          return sum + 100 + Math.floor(timeBonus);
        }
        return sum;
      }, 0);

      // Store final results for result screen
      setTotalTime(calculatedTotalTime);
      setFinalScore(calculatedFinalScore);
      setCorrectAnswers(finalCorrectAnswers);

      const gameResults = {
        game_session_id: parsedSessionId,
        total_time: calculatedTotalTime,
        rounds: finalRounds.map((round) => ({
          round_number: round.round_number,
          first_number: round.first_number,
          second_number: round.second_number,
          user_symbol: round.user_symbol,
          response_time: round.response_time,
        })),
      };

      const response = await gameAPI.completeGame(gameResults);

      // Update with server response if available
      if (response?.finalScore) {
        setFinalScore(response.finalScore);
      }
      if (response?.correctAnswers) {
        setCorrectAnswers(response.correctAnswers);
      }

      // Navigate directly to result screen without showing completion screen
      router.push({
        pathname: "/game/gameResult",
        params: { sessionId: parsedSessionId?.toString() || sessionId },
      });
    } catch (error) {
      console.error("Error completing game:", error);
      Alert.alert(
        "Error",
        "Failed to complete game. Showing local results instead."
      );

      // Navigate to result screen even if completion fails
      router.push({
        pathname: "/game/gameResult",
        params: { sessionId: parsedSessionId?.toString() || sessionId },
      });
    }
  };

  const handleBackToMenu = () => {
    Alert.alert("Leave Game", "Are you sure you want to leave the game?", [
      { text: "Stay", style: "cancel" },
      { text: "Leave", onPress: () => router.back() },
    ]);
  };

  const getCurrentRound = () => {
    return rounds[currentRoundIndex];
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
        {loading ? (
          <ActivityIndicator size="large" color="#ffd33d" />
        ) : (
          <>
            <View style={styles.gameInfo}>
              <Ionicons name="game-controller" size={64} color="#ffd33d" />
              <Text style={styles.gameTitle}>
                {title || "Symbol Match Game"}
              </Text>
              <Text style={styles.gameType}>
                {gameType || "Symbol Comparison"}
              </Text>
              <Text style={styles.sessionId}>Session: {sessionId}</Text>
              {gameSession && (
                <Text style={styles.roundsInfo}>
                  {gameSession.number_of_rounds} rounds to play
                </Text>
              )}
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>How to Play:</Text>
              <Text style={styles.instructionsText}>
                • Compare two numbers{"\n"}• Choose the correct symbol: {">"},{" "}
                {"<"}, or {"="}
                {"\n"}• Answer as quickly as possible{"\n"}• Earn 100 points for
                each correct answer
              </Text>
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartGame}
            >
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          </>
        )}
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

  const renderGame = () => {
    const currentRound = getCurrentRound();

    if (!currentRound) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>No rounds available</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToMenu}
          >
            <Ionicons name="pause" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score: {score}</Text>
          </View>
        </View>

        <View style={styles.gameArea}>
          <Text style={styles.roundCounter}>
            Round {currentRoundIndex + 1} of {rounds.length}
          </Text>

          <View style={styles.comparisonContainer}>
            <Text style={styles.numberText}>{currentRound.first_number}</Text>
            <Text style={styles.vsText}>vs</Text>
            <Text style={styles.numberText}>{currentRound.second_number}</Text>
          </View>

          <Text style={styles.questionText}>Which symbol is correct?</Text>

          <View style={styles.symbolButtons}>
            <TouchableOpacity
              style={styles.symbolButton}
              onPress={() => handleSymbolChoice("<")}
            >
              <Text style={styles.symbolButtonText}>{"<"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.symbolButton}
              onPress={() => handleSymbolChoice("=")}
            >
              <Text style={styles.symbolButtonText}>{"="}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.symbolButton}
              onPress={() => handleSymbolChoice(">")}
            >
              <Text style={styles.symbolButtonText}>{">"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.gameControls}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Correct: {correctAnswers}/{rounds.length}
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
  roundsInfo: {
    fontSize: getResponsiveFontSize(14),
    color: "#ccc",
    marginTop: 8,
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
  roundCounter: {
    fontSize: getResponsiveFontSize(18),
    color: "#888",
    marginBottom: 30,
  },
  comparisonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  numberText: {
    fontSize: getResponsiveFontSize(48),
    fontWeight: "bold",
    color: "#fff",
    marginHorizontal: 20,
  },
  vsText: {
    fontSize: getResponsiveFontSize(20),
    color: "#888",
    marginHorizontal: 20,
  },
  questionText: {
    fontSize: getResponsiveFontSize(20),
    color: "#fff",
    marginBottom: 40,
    textAlign: "center",
  },
  symbolButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: 400,
  },
  symbolButton: {
    backgroundColor: "#ffd33d",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  symbolButtonText: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: "bold",
    color: "#25292e",
  },
  gameControls: {
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
    backgroundColor: "#2a2d32",
  },
  progressContainer: {
    alignItems: "center",
  },
  progressText: {
    fontSize: getResponsiveFontSize(16),
    color: "#fff",
    fontWeight: "bold",
  },
  errorText: {
    fontSize: getResponsiveFontSize(18),
    color: "#F44336",
    textAlign: "center",
  },
});
