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
} from "react-native";
import { battleAPI, userAPI } from "../../../services/api";
import socketService from "../../../services/socketService";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface BattleSession {
  id: number;
  battle_code: string;
  number_of_rounds: number;
  time_limit: number;
  is_public: boolean;
  creator_score: number;
  opponent_score: number;
  creator_correct_answers: number;
  opponent_correct_answers: number;
  creator_completed: boolean;
  opponent_completed: boolean;
  started_at: string;
  completed_at: string;
}

interface Player {
  id: number;
  username: string;
  full_name: string;
  avatar: string;
  current_level: number;
}

interface BattleRound {
  round_number: number;
  first_number: number;
  second_number: number;
  correct_symbol: string;
  creator_symbol?: string;
  creator_response_time?: number;
  creator_is_correct?: boolean;
  opponent_symbol?: string;
  opponent_response_time?: number;
  opponent_is_correct?: boolean;
  round_winner?: string;
}

export default function BattleGameScreen() {
  const params = useLocalSearchParams();
  const battleId = params.battleId as string;
  const battleCode = params.battleCode as string;
  const source = params.source as string; // 'create' or 'join' to help identify user role

  const [battleSession, setBattleSession] = useState<BattleSession | null>(
    null
  );
  const [creator, setCreator] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [rounds, setRounds] = useState<BattleRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameLoading, setGameLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [roundStartTime, setRoundStartTime] = useState<number>(0);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [totalGameTime, setTotalGameTime] = useState<number>(0);
  const [gamePhase, setGamePhase] = useState<
    "waiting" | "playing" | "completed"
  >("waiting");
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState<any>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollingInterval = useRef<any>(null);
  const roundPollingInterval = useRef<any>(null);

  useEffect(() => {
    if (battleId) {
      initializeUser();
      setupSocketConnection();
    }

    return () => {
      cleanupSocketListeners();
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      if (roundPollingInterval.current) {
        clearInterval(roundPollingInterval.current);
      }
    };
  }, [battleId]);

  const initializeUser = async () => {
    try {
      // Try to get current user data
      const userData = await userAPI.getStoredUserData();
      if (userData && userData.id) {
        setCurrentUserId(userData.id);
      }
      await loadBattleSession();
    } catch (error) {
      console.error("Error initializing user:", error);
      await loadBattleSession();
    }
  };

  const setupSocketConnection = async () => {
    try {
      // Connect to Socket.IO server
      await socketService.connect();

      // Set up event listeners
      socketService.addEventListener("opponent-joined", handleOpponentJoined);
      socketService.addEventListener("round-submitted", handleRoundSubmitted);
      socketService.addEventListener("player-completed", handlePlayerCompleted);
      socketService.addEventListener("battle-completed", handleBattleCompleted);

      // Join the battle room if connected
      if (socketService.isSocketConnected()) {
        socketService.joinBattle(battleId);
      }
    } catch (error) {
      console.error("Error setting up socket connection:", error);
    }
  };

  const cleanupSocketListeners = () => {
    socketService.removeEventListener("opponent-joined", handleOpponentJoined);
    socketService.removeEventListener("round-submitted", handleRoundSubmitted);
    socketService.removeEventListener(
      "player-completed",
      handlePlayerCompleted
    );
    socketService.removeEventListener(
      "battle-completed",
      handleBattleCompleted
    );
    socketService.leaveBattle(battleId);
  };

  // Socket event handlers
  const handleOpponentJoined = (data: any) => {
    console.log("🎮 Opponent joined via socket:", data);
    if (data.battleId === battleId) {
      setOpponent(data.opponent);
      setGamePhase("playing");
      setCurrentRoundIndex(0);

      // Stop polling if active
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    }
  };

  const handleRoundSubmitted = (data: any) => {
    console.log("🎯 Round submitted via socket:", data);
    if (data.battleId === battleId && data.userId !== currentUserId) {
      // Opponent submitted, immediately move to next round
      moveToNextRound();
    }
  };

  const handlePlayerCompleted = (data: any) => {
    console.log("🏁 Player completed via socket:", data);
    if (data.battleId === battleId && data.userId !== currentUserId) {
      // Opponent completed all rounds
      setWaitingForOpponent(false);
      completeBattle();
    }
  };

  const handleBattleCompleted = (data: any) => {
    console.log("🎉 Battle completed via socket:", data);
    if (data.battleId === battleId) {
      // Battle is fully completed, load final results
      setWaitingForOpponent(false);
      loadBattleSession().then(() => {
        setGamePhase("completed");
      });
    }
  };

  useEffect(() => {
    if (gamePhase === "playing" && rounds.length > 0) {
      setRoundStartTime(Date.now());
    }
  }, [gamePhase, currentRoundIndex]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadBattleSession = async () => {
    try {
      setLoading(true);
      const response = await battleAPI.getBattleSession(battleId);

      if (response && response.battle_session) {
        setBattleSession(response.battle_session);
        setCreator(response.creator);
        setOpponent(response.opponent);
        setWinner(response.winner);
        setRounds(response.rounds || []);

        // Determine current user based on source parameter and battle context
        if (!currentUserId) {
          console.log("Determining current user - Source:", source);
          console.log("Battle has opponent:", !!response.opponent);
          console.log("Creator:", response.creator.username);
          console.log("Opponent:", response.opponent?.username);

          // Use source parameter to determine user role
          if (source === "create") {
            // User created the battle, they are the creator
            setCurrentUserId(response.creator.id);
            console.log(
              "Set current user as creator:",
              response.creator.username
            );
          } else if (source === "join") {
            // User joined the battle, they are the opponent
            if (response.opponent) {
              setCurrentUserId(response.opponent.id);
              console.log(
                "Set current user as opponent:",
                response.opponent.username
              );
            } else {
              // This shouldn't happen, but fallback to creator
              setCurrentUserId(response.creator.id);
              console.log("Fallback: Set current user as creator");
            }
          } else {
            // No source parameter, use fallback logic
            if (!response.opponent) {
              // No opponent yet, so current user must be the creator
              setCurrentUserId(response.creator.id);
              console.log("No opponent: Set current user as creator");
            } else {
              // Use battle timing to determine
              const battleJustStarted =
                response.battle_session.started_at &&
                new Date(response.battle_session.started_at).getTime() >
                  Date.now() - 30000;

              if (battleJustStarted) {
                setCurrentUserId(response.opponent.id);
                console.log(
                  "Battle just started: Set current user as opponent"
                );
              } else {
                setCurrentUserId(response.creator.id);
                console.log("Existing battle: Set current user as creator");
              }
            }
          }
        } else {
          // Verify currentUserId matches one of the players
          if (
            currentUserId !== response.creator.id &&
            currentUserId !== response.opponent?.id
          ) {
            console.warn(
              "Current user not part of this battle, using source to determine"
            );
            if (source === "join" && response.opponent) {
              setCurrentUserId(response.opponent.id);
            } else {
              setCurrentUserId(response.creator.id);
            }
          } else {
            console.log("Current user verified:", currentUserId);
          }
        }

        // Determine game phase
        if (response.battle_session.completed_at) {
          setGamePhase("completed");
        } else if (
          response.opponent &&
          response.rounds &&
          response.rounds.length > 0
        ) {
          setGamePhase("playing");
          // Find current round
          const currentRound = findCurrentRound(
            response.rounds,
            response.creator.id
          );
          setCurrentRoundIndex(currentRound);
        } else {
          setGamePhase("waiting");
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

  const findCurrentRound = (
    gameRounds: BattleRound[],
    userId: number
  ): number => {
    // Find the first round where current user hasn't answered
    const isCreator = creator?.id === userId;

    for (let i = 0; i < gameRounds.length; i++) {
      const round = gameRounds[i];
      const userAnswered = isCreator
        ? round.creator_symbol !== null && round.creator_symbol !== undefined
        : round.opponent_symbol !== null && round.opponent_symbol !== undefined;

      if (!userAnswered) {
        return i;
      }
    }

    // All rounds answered
    return gameRounds.length;
  };

  const startPollingForOpponent = () => {
    startPulseAnimation();
    // Socket.IO will handle opponent joining notifications
    // Keeping this as fallback for cases where socket connection fails
    pollingInterval.current = setInterval(async () => {
      if (!socketService.isSocketConnected()) {
        try {
          const response = await battleAPI.getBattleSession(battleId);
          if (response && response.opponent) {
            setOpponent(response.opponent);
            setRounds(response.rounds || []);
            setGamePhase("playing");
            setCurrentRoundIndex(0);

            if (pollingInterval.current) {
              clearInterval(pollingInterval.current);
            }
          }
        } catch (error) {
          console.error("Error polling for opponent:", error);
        }
      }
    }, 5000); // Reduced frequency since Socket.IO is primary method
  };

  const startWaitingForOpponent = () => {
    console.log("🔄 Starting to wait for opponent answer...");

    roundPollingInterval.current = setInterval(async () => {
      try {
        const response = await battleAPI.getBattleSession(battleId);
        if (response && response.rounds) {
          const currentRound = response.rounds[currentRoundIndex];
          if (currentRound) {
            const isCreator = currentUserId === creator?.id;
            const opponentAnswered = isCreator
              ? currentRound.opponent_symbol !== null &&
                currentRound.opponent_symbol !== undefined
              : currentRound.creator_symbol !== null &&
                currentRound.creator_symbol !== undefined;

            if (opponentAnswered) {
              console.log("✅ Opponent answered! Moving to next round");

              // Update rounds with opponent's answer
              setRounds(response.rounds);
              setWaitingForOpponent(false);
              setShowRoundResult(true);

              if (roundPollingInterval.current) {
                clearInterval(roundPollingInterval.current);
              }

              // Show result then move to next round
              setTimeout(() => {
                setShowRoundResult(false);
                moveToNextRound();
              }, 2000);
            }
          }
        }
      } catch (error) {
        console.error("Error polling for opponent answer:", error);
      }
    }, 1000); // Poll every second for faster response
  };

  const startWaitingForOpponentToFinish = () => {
    console.log("🔄 Waiting for opponent to finish all rounds...");

    roundPollingInterval.current = setInterval(async () => {
      try {
        const response = await battleAPI.getBattleSession(battleId);
        if (response && response.rounds) {
          const allRoundsCompleted = response.rounds.every(
            (round: BattleRound) => {
              return (
                round.creator_symbol !== null &&
                round.creator_symbol !== undefined &&
                round.opponent_symbol !== null &&
                round.opponent_symbol !== undefined
              );
            }
          );

          if (allRoundsCompleted) {
            console.log(
              "✅ Both players finished all rounds! Completing battle"
            );
            setRounds(response.rounds);
            setWaitingForOpponent(false);

            if (roundPollingInterval.current) {
              clearInterval(roundPollingInterval.current);
            }

            completeBattle();
          }
        }
      } catch (error) {
        console.error("Error polling for opponent completion:", error);
      }
    }, 2000);
  };

  const submitAnswer = async (answer: string) => {
    if (
      submittingAnswer ||
      !battleSession ||
      currentRoundIndex >= rounds.length
    ) {
      return;
    }

    try {
      setSubmittingAnswer(true);
      setSelectedAnswer(answer);

      const currentRound = rounds[currentRoundIndex];
      const responseTime = Math.floor((Date.now() - roundStartTime) / 1000);
      const isCreator = currentUserId === creator?.id;

      // Immediately update UI with user's answer for instant feedback
      const updatedRounds = [...rounds];
      if (isCreator) {
        updatedRounds[currentRoundIndex] = {
          ...updatedRounds[currentRoundIndex],
          creator_symbol: answer,
          creator_response_time: responseTime,
        };
      } else {
        updatedRounds[currentRoundIndex] = {
          ...updatedRounds[currentRoundIndex],
          opponent_symbol: answer,
          opponent_response_time: responseTime,
        };
      }
      setRounds(updatedRounds);

      // Emit Socket.IO event for instant notification
      if (socketService.isSocketConnected()) {
        socketService.submitRound(
          battleSession.id,
          currentRound.round_number,
          answer,
          responseTime
        );
      }

      // Submit to backend
      const response = await battleAPI.submitBattleRound({
        battle_session_id: battleSession.id,
        round_number: currentRound.round_number,
        user_symbol: answer,
        response_time: responseTime,
      });

      if (response && response.round_result) {
        // Update with server response
        const serverUpdatedRounds = [...updatedRounds];
        if (isCreator) {
          serverUpdatedRounds[currentRoundIndex] = {
            ...serverUpdatedRounds[currentRoundIndex],
            creator_is_correct: response.round_result.is_correct,
          };
        } else {
          serverUpdatedRounds[currentRoundIndex] = {
            ...serverUpdatedRounds[currentRoundIndex],
            opponent_is_correct: response.round_result.is_correct,
          };
        }
        setRounds(serverUpdatedRounds);
        setLastRoundResult(response.round_result);

        // Immediately move to next round - no delays or round results
        moveToNextRound();
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      Alert.alert("Error", "Failed to submit answer. Please try again.");

      // Revert UI changes on error
      setSelectedAnswer("");
      const revertedRounds = [...rounds];
      const isCreator = currentUserId === creator?.id;
      if (isCreator) {
        revertedRounds[currentRoundIndex] = {
          ...revertedRounds[currentRoundIndex],
          creator_symbol: undefined,
          creator_response_time: undefined,
        };
      } else {
        revertedRounds[currentRoundIndex] = {
          ...revertedRounds[currentRoundIndex],
          opponent_symbol: undefined,
          opponent_response_time: undefined,
        };
      }
      setRounds(revertedRounds);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const moveToNextRound = () => {
    setSelectedAnswer("");

    if (currentRoundIndex + 1 >= rounds.length) {
      // All rounds completed for this player - complete battle immediately
      completeBattle();
    } else {
      // Move to next round immediately
      setCurrentRoundIndex(currentRoundIndex + 1);
      setRoundStartTime(Date.now());
    }
  };

  const completeBattle = async () => {
    try {
      setGameLoading(true);
      const totalTime = Math.floor((Date.now() - gameStartTime) / 1000);
      setTotalGameTime(totalTime);

      // Emit Socket.IO event for instant notification
      if (socketService.isSocketConnected()) {
        socketService.completeBattle(battleSession!.id);
      }

      const response = await battleAPI.completeBattle(
        battleSession!.id,
        totalTime
      );

      if (response) {
        if (response.battle_completed) {
          // Battle is fully completed, show final results
          await loadBattleSession();
          setGamePhase("completed");
        } else {
          // Current player finished, but waiting for opponent to complete
          setWaitingForOpponent(true);
          // No need for polling anymore - Socket.IO will handle notifications
        }
      }
    } catch (error) {
      console.error("Error completing battle:", error);
      Alert.alert("Error", "Failed to complete battle. Please try again.");
    } finally {
      setGameLoading(false);
    }
  };

  const getCurrentRound = (): BattleRound | null => {
    if (currentRoundIndex >= rounds.length) return null;
    return rounds[currentRoundIndex];
  };

  const getAnswerStyle = (answer: string) => {
    const baseStyle = styles.answerButton;
    if (selectedAnswer === answer) {
      return [baseStyle, styles.selectedAnswer];
    }
    return baseStyle;
  };

  const renderWaitingScreen = () => (
    <View style={styles.waitingContainer}>
      <Animated.View
        style={[styles.waitingIcon, { transform: [{ scale: pulseAnim }] }]}
      >
        <Ionicons name="hourglass-outline" size={80} color="#E91E63" />
      </Animated.View>

      <Text style={styles.waitingTitle}>Waiting for Opponent</Text>
      <Text style={styles.waitingSubtitle}>
        Share this battle code with your opponent:
      </Text>

      <View style={styles.battleCodeContainer}>
        <Text style={styles.battleCodeText}>{battleCode}</Text>
        <TouchableOpacity style={styles.copyButton}>
          <Ionicons name="copy-outline" size={20} color="#E91E63" />
        </TouchableOpacity>
      </View>

      <Text style={styles.waitingInfo}>
        The battle will start automatically when someone joins.
      </Text>
    </View>
  );

  const renderGameplayScreen = () => {
    const currentRound = getCurrentRound();

    // If waiting for opponent to finish all rounds
    if (waitingForOpponent) {
      return (
        <View style={styles.gameplayContainer}>
          <View style={styles.waitingForOpponentContainer}>
            <ActivityIndicator size="large" color="#E91E63" />
            <Text style={styles.waitingTitle}>All rounds completed!</Text>
            <Text style={styles.waitingText}>
              Waiting for opponent to finish...
            </Text>
          </View>
        </View>
      );
    }

    if (!currentRound) return null;

    const isCreator = currentUserId === creator?.id;
    const userAnswered = isCreator
      ? currentRound.creator_symbol !== null &&
        currentRound.creator_symbol !== undefined
      : currentRound.opponent_symbol !== null &&
        currentRound.opponent_symbol !== undefined;

    return (
      <View style={styles.gameplayContainer}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentRoundIndex + 1) / rounds.length) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Round {currentRoundIndex + 1} of {rounds.length}
          </Text>
        </View>

        {/* Players Info */}
        <View style={styles.playersContainer}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{creator?.username}</Text>
            <Text style={styles.playerScore}>
              {battleSession?.creator_score || 0}
            </Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{opponent?.username}</Text>
            <Text style={styles.playerScore}>
              {battleSession?.opponent_score || 0}
            </Text>
          </View>
        </View>

        {/* Game Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>Compare the numbers:</Text>
          <View style={styles.numbersContainer}>
            <Text style={styles.number}>{currentRound.first_number}</Text>
            <Text style={styles.questionMark}>?</Text>
            <Text style={styles.number}>{currentRound.second_number}</Text>
          </View>
        </View>

        {/* Answer Buttons */}
        <View style={styles.answersContainer}>
          <TouchableOpacity
            style={getAnswerStyle("<")}
            onPress={() => submitAnswer("<")}
            disabled={submittingAnswer}
          >
            <Text style={styles.answerText}>{"<"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={getAnswerStyle("=")}
            onPress={() => submitAnswer("=")}
            disabled={submittingAnswer}
          >
            <Text style={styles.answerText}>{"="}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={getAnswerStyle(">")}
            onPress={() => submitAnswer(">")}
            disabled={submittingAnswer}
          >
            <Text style={styles.answerText}>{">"}</Text>
          </TouchableOpacity>
        </View>

        {submittingAnswer && (
          <View style={styles.submittingOverlay}>
            <ActivityIndicator size="large" color="#E91E63" />
            <Text style={styles.submittingText}>Submitting answer...</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCompletedScreen = () => {
    const isCreator = currentUserId === creator?.id;
    const userWon = winner?.id === currentUserId;
    const isTie = !winner;

    return (
      <View style={styles.completedContainer}>
        <View style={styles.resultIcon}>
          <Ionicons
            name={userWon ? "trophy" : isTie ? "ribbon" : "medal"}
            size={80}
            color={userWon ? "#FFD700" : isTie ? "#C0C0C0" : "#CD7F32"}
          />
        </View>

        <Text style={styles.resultTitle}>
          {userWon ? "Victory!" : isTie ? "It's a Tie!" : "Defeat"}
        </Text>

        <Text style={styles.resultSubtitle}>
          {userWon
            ? "Congratulations! You won the battle!"
            : isTie
            ? "Great game! You both performed equally well."
            : "Good effort! Better luck next time."}
        </Text>

        {/* Final Scores */}
        <View style={styles.finalScoresContainer}>
          <View style={styles.finalPlayerScore}>
            <Text style={styles.finalPlayerName}>{creator?.username}</Text>
            <Text style={styles.finalPlayerPoints}>
              {battleSession?.creator_score || 0}
            </Text>
            <Text style={styles.finalPlayerDetails}>
              {battleSession?.creator_correct_answers || 0}/{rounds.length}{" "}
              correct
            </Text>
          </View>

          <View style={styles.finalPlayerScore}>
            <Text style={styles.finalPlayerName}>{opponent?.username}</Text>
            <Text style={styles.finalPlayerPoints}>
              {battleSession?.opponent_score || 0}
            </Text>
            <Text style={styles.finalPlayerDetails}>
              {battleSession?.opponent_correct_answers || 0}/{rounds.length}{" "}
              correct
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/game/duoBattle/battleMenu")}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.primaryButtonText}>New Battle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/game/duoBattle/battleMenu")}
          >
            <Text style={styles.secondaryButtonText}>Back to Menu</Text>
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
        <Text style={styles.headerTitle}>Battle: {battleCode}</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: "#333",
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  // Waiting Screen Styles
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  waitingIcon: {
    marginBottom: 32,
  },
  waitingTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  waitingSubtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 24,
  },
  battleCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E91E63",
    marginBottom: 24,
  },
  battleCodeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E91E63",
    fontFamily: "monospace",
    letterSpacing: 2,
    marginRight: 16,
  },
  copyButton: {
    padding: 8,
  },
  waitingInfo: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  // Gameplay Screen Styles
  gameplayContainer: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E91E63",
  },
  progressText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
  playersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  playerInfo: {
    alignItems: "center",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  playerScore: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E91E63",
  },
  vsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },
  questionContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  questionTitle: {
    fontSize: 18,
    color: "#888",
    marginBottom: 24,
  },
  numbersContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  number: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    textAlign: "center",
    minWidth: 100,
  },
  questionMark: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#E91E63",
  },
  answersContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  answerButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedAnswer: {
    backgroundColor: "#E91E63",
    borderColor: "#E91E63",
  },
  answerText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  waitingForOpponentContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  waitingText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  waitingForOpponentText: {
    fontSize: 16,
    color: "#888",
    marginTop: 16,
  },
  submittingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  submittingText: {
    fontSize: 16,
    color: "#fff",
    marginTop: 16,
  },
  // Completed Screen Styles
  completedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultIcon: {
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  resultSubtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  finalScoresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 40,
  },
  finalPlayerScore: {
    alignItems: "center",
  },
  finalPlayerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  finalPlayerPoints: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 4,
  },
  finalPlayerDetails: {
    fontSize: 12,
    color: "#666",
  },
  actionButtonsContainer: {
    width: "100%",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#E91E63",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },
  // Round Result Styles
  roundResultContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    marginHorizontal: 20,
  },
  roundResultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 20,
  },
  roundResultDetails: {
    alignItems: "center",
    gap: 8,
  },
  roundResultText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  roundWinnerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 8,
  },
  // Answered State Styles
  answeredContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  answeredText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  answeredSubtext: {
    fontSize: 14,
    color: "#4CAF50",
  },
});
