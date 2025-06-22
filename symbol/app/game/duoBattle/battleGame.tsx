import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Image,
} from "react-native";
import { battleAPI, gameAPI } from "../../../services/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface BattleSession {
  id: number;
  battle_code: string;
  number_of_rounds: number;
  time_limit: number;
  is_public: boolean;
  status: string;
  creator: {
    id: number;
    username: string;
    full_name: string;
    avatar: string;
    current_level: number;
  };
  opponent?: {
    id: number;
    username: string;
    full_name: string;
    avatar: string;
    current_level: number;
  };
  winner?: {
    id: number;
    username: string;
  };
  creator_score: number;
  opponent_score: number;
  creator_total_time: number;
  opponent_total_time: number;
  rounds: Array<{
    round_number: number;
    symbols: string[];
    correct_answer: string;
    creator_answer?: string;
    opponent_answer?: string;
    creator_time?: number;
    opponent_time?: number;
    creator_correct?: boolean;
    opponent_correct?: boolean;
  }>;
  current_round: number;
  is_completed: boolean;
}

interface GameRound {
  round_number: number;
  symbols: string[];
  correct_answer: string;
  difficulty_level: number;
}

export default function BattleGameScreen() {
  const params = useLocalSearchParams();
  const battleId = params.battleId as string;
  const battleCode = params.battleCode as string;

  const [battleSession, setBattleSession] = useState<BattleSession | null>(
    null
  );
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameLoading, setGameLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [roundStartTime, setRoundStartTime] = useState<number>(0);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [roundTimer, setRoundTimer] = useState<number>(0);
  const [gamePhase, setGamePhase] = useState<
    "waiting" | "playing" | "completed"
  >("waiting");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerInterval = useRef<number | null>(null);

  useEffect(() => {
    if (battleId) {
      loadBattleSession();
    }
  }, [battleId]);

  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (gamePhase === "playing" && currentRound) {
      startRoundTimer();
    }
  }, [gamePhase, currentRound]);

  const startRoundTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    setRoundStartTime(Date.now());
    setRoundTimer(0);

    timerInterval.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - roundStartTime) / 1000);
      setRoundTimer(elapsed);
    }, 1000);
  };

  const loadBattleSession = async () => {
    try {
      setLoading(true);
      const response = await battleAPI.getBattleSession(battleId);

      if (response && response.battle_session) {
        setBattleSession(response.battle_session);

        // Check if battle is ready to start
        if (
          response.battle_session.opponent &&
          !response.battle_session.is_completed
        ) {
          if (
            response.battle_session.current_round <=
            response.battle_session.number_of_rounds
          ) {
            // Load the current round
            await loadCurrentRound(response.battle_session);
            setGamePhase("playing");
          } else {
            setGamePhase("completed");
          }
        } else if (response.battle_session.is_completed) {
          setGamePhase("completed");
        } else {
          setGamePhase("waiting");
          // Poll for opponent joining
          startPollingForOpponent();
        }
      }
    } catch (error) {
      console.error("Error loading battle session:", error);
      Alert.alert("Error", "Failed to load battle session. Returning to menu.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentRound = async (battle: BattleSession) => {
    try {
      setGameLoading(true);

      // Check if round already exists in battle session
      const existingRound = battle.rounds?.find(
        (r) => r.round_number === battle.current_round
      );

      if (existingRound) {
        setCurrentRound({
          round_number: existingRound.round_number,
          symbols: existingRound.symbols,
          correct_answer: existingRound.correct_answer,
          difficulty_level: 2, // Default difficulty
        });
      } else {
        // Generate new round using game API
        const roundResponse = await gameAPI.createInstantGame({
          difficulty_level: 2,
          number_of_rounds: 1,
        });

        if (
          roundResponse &&
          roundResponse.rounds &&
          roundResponse.rounds.length > 0
        ) {
          const newRound = roundResponse.rounds[0];
          setCurrentRound({
            round_number: battle.current_round,
            symbols: newRound.symbols,
            correct_answer: newRound.correct_answer,
            difficulty_level: newRound.difficulty_level,
          });
        }
      }
    } catch (error) {
      console.error("Error loading current round:", error);
      Alert.alert("Error", "Failed to load round data.");
    } finally {
      setGameLoading(false);
    }
  };

  const startPollingForOpponent = () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await battleAPI.getBattleSession(battleId);
        if (
          response &&
          response.battle_session &&
          response.battle_session.opponent
        ) {
          clearInterval(pollInterval);
          setBattleSession(response.battle_session);
          await loadCurrentRound(response.battle_session);
          setGamePhase("playing");
        }
      } catch (error) {
        console.error("Error polling for opponent:", error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  const submitAnswer = async (answer: string) => {
    if (!battleSession || !currentRound || selectedAnswer) return;

    try {
      setSelectedAnswer(answer);

      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }

      const responseTime = Math.floor((Date.now() - roundStartTime) / 1000);

      const roundData = {
        battle_session_id: battleSession.id,
        round_number: currentRound.round_number,
        answer: answer,
        response_time: responseTime,
        symbols: currentRound.symbols,
        correct_answer: currentRound.correct_answer,
      };

      await battleAPI.submitBattleRound(roundData);

      // Show answer feedback
      setTimeout(async () => {
        await moveToNextRound();
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting answer:", error);
      Alert.alert("Error", error.message || "Failed to submit answer.");
      setSelectedAnswer("");
    }
  };

  const moveToNextRound = async () => {
    if (!battleSession) return;

    try {
      // Reload battle session to get updated data
      const response = await battleAPI.getBattleSession(battleId);

      if (response && response.battle_session) {
        setBattleSession(response.battle_session);

        if (
          response.battle_session.current_round <=
          response.battle_session.number_of_rounds
        ) {
          // Load next round
          await loadCurrentRound(response.battle_session);
          setSelectedAnswer("");
          setRoundTimer(0);
        } else {
          // Battle completed
          await completeBattle();
        }
      }
    } catch (error) {
      console.error("Error moving to next round:", error);
    }
  };

  const completeBattle = async () => {
    if (!battleSession) return;

    try {
      const totalTime = Math.floor((Date.now() - gameStartTime) / 1000);
      await battleAPI.completeBattle(battleSession.id, totalTime);

      // Reload final battle data
      const response = await battleAPI.getBattleSession(battleId);
      if (response && response.battle_session) {
        setBattleSession(response.battle_session);
      }

      setGamePhase("completed");
    } catch (error) {
      console.error("Error completing battle:", error);
      setGamePhase("completed");
    }
  };

  const getAnswerStyle = (answer: string) => {
    if (!selectedAnswer) return styles.answerButton;

    if (answer === selectedAnswer) {
      if (answer === currentRound?.correct_answer) {
        return [styles.answerButton, styles.correctAnswer];
      } else {
        return [styles.answerButton, styles.wrongAnswer];
      }
    }

    if (answer === currentRound?.correct_answer) {
      return [styles.answerButton, styles.correctAnswer];
    }

    return [styles.answerButton, styles.disabledAnswer];
  };

  const renderWaitingScreen = () => (
    <View style={styles.waitingContainer}>
      <View style={styles.waitingContent}>
        <Animated.View
          style={[
            styles.battleCodeContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.battleCodeTitle}>Battle Code</Text>
          <Text style={styles.battleCode}>{battleCode}</Text>
        </Animated.View>

        <View style={styles.waitingInfo}>
          <Ionicons name="time" size={32} color="#E91E63" />
          <Text style={styles.waitingTitle}>Waiting for Opponent</Text>
          <Text style={styles.waitingDescription}>
            Share the battle code with your opponent or wait for someone to
            join.
          </Text>
        </View>

        <View style={styles.battleCreator}>
          <Text style={styles.creatorLabel}>Battle Creator</Text>
          <View style={styles.playerInfo}>
            <Image
              source={{
                uri:
                  battleSession?.creator?.avatar ||
                  "https://i.pravatar.cc/100?img=1",
              }}
              style={styles.playerAvatar}
            />
            <View>
              <Text style={styles.playerName}>
                {battleSession?.creator?.username || "Unknown"}
              </Text>
              <Text style={styles.playerLevel}>
                Level {battleSession?.creator?.current_level || 1}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share" size={20} color="#fff" />
          <Text style={styles.shareButtonText}>Share Battle Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGameplayScreen = () => (
    <View style={styles.gameplayContainer}>
      <View style={styles.gameHeader}>
        <View style={styles.roundInfo}>
          <Text style={styles.roundText}>
            Round {currentRound?.round_number} /{" "}
            {battleSession?.number_of_rounds}
          </Text>
          <Text style={styles.timerText}>{roundTimer}s</Text>
        </View>

        <View style={styles.playersContainer}>
          <View style={styles.playerScore}>
            <Image
              source={{
                uri:
                  battleSession?.creator?.avatar ||
                  "https://i.pravatar.cc/100?img=1",
              }}
              style={styles.miniAvatar}
            />
            <Text style={styles.scoreText}>{battleSession?.creator_score}</Text>
          </View>

          <Text style={styles.vsText}>VS</Text>

          <View style={styles.playerScore}>
            <Text style={styles.scoreText}>
              {battleSession?.opponent_score}
            </Text>
            <Image
              source={{ uri: battleSession?.opponent?.avatar }}
              style={styles.miniAvatar}
            />
          </View>
        </View>
      </View>

      {gameLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.loadingText}>Loading round...</Text>
        </View>
      ) : currentRound ? (
        <View style={styles.gameContent}>
          <View style={styles.symbolsContainer}>
            <Text style={styles.questionText}>Find the missing symbol:</Text>
            <View style={styles.symbolsGrid}>
              {currentRound.symbols.map((symbol, index) => (
                <View key={index} style={styles.symbolCard}>
                  <Text style={styles.symbolText}>{symbol}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.answersContainer}>
            <Text style={styles.answersTitle}>Choose your answer:</Text>
            <View style={styles.answersGrid}>
              {/* Generate answer options - in a real implementation, you'd get these from the API */}
              {["A", "B", "C", "D"].map((answer) => (
                <TouchableOpacity
                  key={answer}
                  style={getAnswerStyle(answer)}
                  onPress={() => submitAnswer(answer)}
                  disabled={!!selectedAnswer}
                >
                  <Text style={styles.answerText}>{answer}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderCompletedScreen = () => {
    const isWinner = battleSession?.winner?.id === battleSession?.creator.id;

    return (
      <View style={styles.completedContainer}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>
            {isWinner ? "Victory! 🏆" : "Battle Complete"}
          </Text>
          <Text style={styles.resultSubtitle}>
            {battleSession?.winner
              ? `${battleSession.winner.username} wins!`
              : "It's a tie!"}
          </Text>
        </View>

        <View style={styles.finalScores}>
          <View style={styles.playerResult}>
            <Image
              source={{
                uri:
                  battleSession?.creator?.avatar ||
                  "https://i.pravatar.cc/100?img=1",
              }}
              style={styles.resultAvatar}
            />
            <Text style={styles.resultName}>
              {battleSession?.creator?.username || "Unknown"}
            </Text>
            <Text style={styles.resultScore}>
              {battleSession?.creator_score} points
            </Text>
            <Text style={styles.resultTime}>
              {Math.floor((battleSession?.creator_total_time || 0) / 60)}:
              {String((battleSession?.creator_total_time || 0) % 60).padStart(
                2,
                "0"
              )}
            </Text>
          </View>

          <Text style={styles.finalVs}>VS</Text>

          <View style={styles.playerResult}>
            <Image
              source={{ uri: battleSession?.opponent?.avatar }}
              style={styles.resultAvatar}
            />
            <Text style={styles.resultName}>
              {battleSession?.opponent?.username}
            </Text>
            <Text style={styles.resultScore}>
              {battleSession?.opponent_score} points
            </Text>
            <Text style={styles.resultTime}>
              {Math.floor((battleSession?.opponent_total_time || 0) / 60)}:
              {String((battleSession?.opponent_total_time || 0) % 60).padStart(
                2,
                "0"
              )}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.newBattleButton}
            onPress={() => router.replace("/game/duoBattle/battleMenu")}
          >
            <Text style={styles.buttonText}>New Battle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace("/(tabs)/home")}
          >
            <Text style={[styles.buttonText, styles.homeButtonText]}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>Loading battle...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Battle Arena</Text>
        <View style={styles.placeholder} />
      </View>

      {gamePhase === "waiting" && renderWaitingScreen()}
      {gamePhase === "playing" && renderGameplayScreen()}
      {gamePhase === "completed" && renderCompletedScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#1a1a1a",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(233, 30, 99, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#888",
    fontSize: 16,
  },
  // Waiting Screen Styles
  waitingContainer: {
    flex: 1,
    padding: 20,
  },
  waitingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  battleCodeContainer: {
    backgroundColor: "#1a1a1a",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E91E63",
  },
  battleCodeTitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 8,
  },
  battleCode: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#E91E63",
    fontFamily: "monospace",
  },
  waitingInfo: {
    alignItems: "center",
    gap: 12,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  waitingDescription: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    maxWidth: 280,
  },
  battleCreator: {
    alignItems: "center",
    gap: 12,
  },
  creatorLabel: {
    fontSize: 14,
    color: "#888",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  playerLevel: {
    fontSize: 14,
    color: "#888",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E91E63",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Gameplay Screen Styles
  gameplayContainer: {
    flex: 1,
  },
  gameHeader: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    gap: 16,
  },
  roundInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roundText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  timerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E91E63",
  },
  playersContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  vsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#888",
  },
  gameContent: {
    flex: 1,
    padding: 20,
    gap: 32,
  },
  symbolsContainer: {
    alignItems: "center",
    gap: 16,
  },
  questionText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  symbolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  symbolCard: {
    width: 60,
    height: 60,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  symbolText: {
    fontSize: 24,
    color: "#fff",
  },
  answersContainer: {
    gap: 16,
  },
  answersTitle: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  answersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  answerButton: {
    width: (screenWidth - 60) / 2,
    height: 60,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  correctAnswer: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  wrongAnswer: {
    backgroundColor: "#F44336",
    borderColor: "#F44336",
  },
  disabledAnswer: {
    opacity: 0.5,
  },
  answerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  // Completed Screen Styles
  completedContainer: {
    flex: 1,
    padding: 20,
    gap: 32,
  },
  resultHeader: {
    alignItems: "center",
    gap: 8,
    marginTop: 32,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  resultSubtitle: {
    fontSize: 18,
    color: "#E91E63",
  },
  finalScores: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
  },
  playerResult: {
    alignItems: "center",
    gap: 8,
  },
  resultAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  resultScore: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E91E63",
  },
  resultTime: {
    fontSize: 14,
    color: "#888",
  },
  finalVs: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#888",
  },
  actionButtons: {
    gap: 12,
    marginTop: 32,
  },
  newBattleButton: {
    backgroundColor: "#E91E63",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  homeButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#E91E63",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  homeButtonText: {
    color: "#E91E63",
  },
});
