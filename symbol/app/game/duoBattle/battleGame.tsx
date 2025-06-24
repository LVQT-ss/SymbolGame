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
  creator_error_count?: number;
  opponent_error_count?: number;
  creator_total_time: number;
  opponent_total_time: number;
  creator_completed: boolean;
  opponent_completed: boolean;
  started_at: string;
  completed_at: string;
  completed?: boolean;
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
    "waiting" | "ready-to-start" | "countdown" | "playing" | "waiting-for-both"
  >("waiting");
  const [countdownValue, setCountdownValue] = useState(3);
  const [isMyTurn, setIsMyTurn] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState<any>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollingInterval = useRef<any>(null);
  const roundPollingInterval = useRef<any>(null);
  const countdownInterval = useRef<any>(null);
  const battleStartTimeout = useRef<any>(null);

  useEffect(() => {
    if (battleId) {
      // Set up Socket.IO listeners first, then initialize
      setupSocketConnection();
      initializeUser();
    }

    return () => {
      cleanupSocketListeners();
      clearAllTimers();
    };
  }, [battleId]);

  const initializeUser = async () => {
    try {
      // Always try to get current user data to ensure we have it
      const userData = await userAPI.getStoredUserData();
      if (userData && userData.id) {
        setCurrentUserId(userData.id);
        console.log("✅ User ID initialized from storage:", userData.id);
      } else {
        console.warn("⚠️ No stored user data found - user may need to log in");
      }
      await loadBattleSession();
    } catch (error) {
      console.error("Error initializing user:", error);
      // Still try to load battle session even if user initialization fails
      await loadBattleSession();
    }
  };

  const setupSocketConnection = async () => {
    try {
      console.log("🔧 Setting up Socket.IO connection for battle:", battleId);

      // Set up event listeners first
      console.log("🔗 Setting up Socket.IO event listeners...");
      socketService.addEventListener("opponent-joined", handleOpponentJoined);
      socketService.addEventListener(
        "creator-started-battle",
        handleCreatorStartedBattle
      );
      socketService.addEventListener("countdown-start", handleCountdownStart);
      socketService.addEventListener("countdown-update", handleCountdownUpdate);
      socketService.addEventListener(
        "countdown-finished",
        handleCountdownFinished
      );
      socketService.addEventListener("round-submitted", handleRoundSubmitted);
      socketService.addEventListener("round-result", handleRoundResult);
      socketService.addEventListener("player-completed", handlePlayerCompleted);
      socketService.addEventListener("battle-completed", handleBattleCompleted);
      console.log("✅ Socket.IO event listeners registered:", [
        "opponent-joined",
        "creator-started-battle",
        "countdown-start",
        "countdown-update",
        "countdown-finished",
        "round-submitted",
        "round-result",
        "player-completed",
        "battle-completed",
      ]);

      // Connect to Socket.IO server
      await socketService.connect();

      // Wait for connection and join battle room
      let connectionAttempts = 0;
      const maxConnectionAttempts = 10;

      const checkConnectionAndJoin = () => {
        connectionAttempts++;

        if (socketService.isSocketConnected()) {
          console.log("✅ Socket connected, joining battle room");
          socketService.joinBattle(battleId);
        } else if (connectionAttempts < maxConnectionAttempts) {
          console.log(
            `🔄 Waiting for socket connection... (${connectionAttempts}/${maxConnectionAttempts})`
          );
          setTimeout(checkConnectionAndJoin, 1000);
        } else {
          console.log("❌ Socket connection timeout, falling back to polling");
          socketService.testConnection();
        }
      };

      // Start checking connection after a short delay
      setTimeout(checkConnectionAndJoin, 1000);
    } catch (error) {
      console.error("Error setting up socket connection:", error);
    }
  };

  const cleanupSocketListeners = () => {
    socketService.removeEventListener("opponent-joined", handleOpponentJoined);
    socketService.removeEventListener(
      "creator-started-battle",
      handleCreatorStartedBattle
    );
    socketService.removeEventListener("countdown-start", handleCountdownStart);
    socketService.removeEventListener(
      "countdown-update",
      handleCountdownUpdate
    );
    socketService.removeEventListener(
      "countdown-finished",
      handleCountdownFinished
    );
    socketService.removeEventListener("round-submitted", handleRoundSubmitted);
    socketService.removeEventListener("round-result", handleRoundResult);
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
  const handleOpponentJoined = async (data: any) => {
    console.log("🎮 Opponent joined via socket:", data);
    if (data.battleId === battleId) {
      console.log("✅ Opponent joined! Moving to ready-to-start phase...");

      // Stop polling if active
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }

      // Reload battle session to get updated data including rounds
      try {
        await loadBattleSession();
        console.log(
          "🎮 Battle session reloaded, moving to ready-to-start phase"
        );

        // Move to ready-to-start phase (wait for creator to click start)
        setGamePhase("ready-to-start");
      } catch (error) {
        console.error(
          "Error reloading battle session after opponent joined:",
          error
        );
        // Fallback to manual state update
        setOpponent(data.opponent);
        setGamePhase("ready-to-start");
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
    if (data.battleId === battleId) {
      // A player completed, transition to waiting for both
      console.log(
        "⏳ Player finished, transitioning to waiting-for-both phase"
      );
      setGamePhase("waiting-for-both");
      setWaitingForOpponent(true);
      startPulseAnimation();
      // Don't call completeBattle() here - wait for battle-completed event
    }
  };

  const handleCreatorStartedBattle = (data: any) => {
    const currentBattleId = parseInt(battleId);
    const eventBattleId = parseInt(data.battleId);

    if (eventBattleId === currentBattleId) {
      console.log("🚀 Creator started battle, using socket-driven countdown");
      if (battleStartTimeout.current) {
        clearTimeout(battleStartTimeout.current);
      }
      // Don't start local countdown, wait for socket countdown events
      console.log("⏰ Waiting for synchronized countdown from server");
    }
  };

  const handleCountdownStart = (data: any) => {
    const currentBattleId = parseInt(battleId);
    const eventBattleId = parseInt(data.battleId);

    if (eventBattleId === currentBattleId) {
      console.log("⏰ Starting synchronized countdown from server");

      // Clear any existing countdown and fallback timers
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      if (battleStartTimeout.current) {
        clearTimeout(battleStartTimeout.current);
        battleStartTimeout.current = null;
      }

      setGamePhase("countdown");
      setCountdownValue(data.countdown || 3);

      // Start local countdown as fallback only if socket updates fail
      countdownInterval.current = setTimeout(() => {
        console.log(
          "⚠️ Fallback countdown timeout - no socket updates received"
        );
        setGamePhase("playing");
        setCurrentRoundIndex(0);
        setGameStartTime(Date.now());
      }, (data.countdown || 3) * 1000 + 1000); // Extra 1000ms buffer
    }
  };

  const handleCountdownUpdate = (data: any) => {
    const currentBattleId = parseInt(battleId);
    const eventBattleId = parseInt(data.battleId);

    if (eventBattleId === currentBattleId) {
      console.log("⏰ Countdown update:", data.countdown);
      setCountdownValue(data.countdown);

      // Clear any fallback timeout since we're getting socket updates
      if (countdownInterval.current) {
        clearTimeout(countdownInterval.current);
        countdownInterval.current = null;
      }
    }
  };

  const handleCountdownFinished = (data: any) => {
    const currentBattleId = parseInt(battleId);
    const eventBattleId = parseInt(data.battleId);

    if (eventBattleId === currentBattleId) {
      console.log("🎮 Countdown finished, starting battle gameplay");

      // Clear all countdown timers
      if (countdownInterval.current) {
        clearTimeout(countdownInterval.current);
        countdownInterval.current = null;
      }
      if (battleStartTimeout.current) {
        clearTimeout(battleStartTimeout.current);
        battleStartTimeout.current = null;
      }

      // Force transition to playing phase
      setCountdownValue(0);
      setGamePhase("playing");
      setCurrentRoundIndex(0);
      setGameStartTime(Date.now());
      console.log("✅ Transitioned to playing phase via socket event");
    }
  };

  const handleRoundResult = (data: any) => {
    const currentBattleId = parseInt(battleId);
    const eventBattleId = parseInt(data.battleId);

    if (eventBattleId === currentBattleId) {
      console.log("🎯 Round result received:", data);

      // Show round result feedback
      setLastRoundResult({
        roundNumber: data.roundNumber,
        creatorAnswer: data.creatorAnswer,
        opponentAnswer: data.opponentAnswer,
        correctAnswer: data.correctAnswer,
        creatorCorrect: data.creatorCorrect,
        opponentCorrect: data.opponentCorrect,
        creatorTime: data.creatorTime,
        opponentTime: data.opponentTime,
      });
      setShowRoundResult(true);

      // Hide result after 2 seconds
      setTimeout(() => {
        setShowRoundResult(false);
        setLastRoundResult(null);
      }, 2000);
    }
  };

  const handleBattleCompleted = (data: any) => {
    const currentBattleId = parseInt(battleId);
    const eventBattleId = parseInt(data.battleId);

    if (eventBattleId === currentBattleId) {
      console.log("🏁 Battle completed event received:", data);
      console.log("🏁 Creator details:", data.results?.creator);
      console.log("🏁 Opponent details:", data.results?.opponent);

      // Update battle session with the detailed results data from socket event
      if (data.results) {
        setBattleSession((prev) =>
          prev
            ? {
                ...prev,
                creator_total_time: data.results.creator.total_time,
                opponent_total_time: data.results.opponent.total_time,
                creator_score: data.results.creator.score,
                opponent_score: data.results.opponent.score,
                creator_correct_answers: data.results.creator.correctAnswers,
                opponent_correct_answers: data.results.opponent.correctAnswers,
                creator_error_count: data.results.creator.errorCount,
                opponent_error_count: data.results.opponent.errorCount,
                completed_at: data.completed_at,
                completed: true,
              }
            : null
        );

        // Update winner
        if (data.results.winner) {
          setWinner(data.results.winner);
        }
      }

      // Transition to results immediately with updated data
      setWaitingForOpponent(false);
      setGameLoading(false);
      // Navigate to results page with proper user ID
      navigateToResults();
    }
  };

  const startBattle = async () => {
    try {
      setGameLoading(true);
      console.log("🚀 Starting battle, waiting for server countdown...");
      await battleAPI.startBattle(battleId);

      // Only set fallback timeout, don't start countdown directly
      battleStartTimeout.current = setTimeout(() => {
        console.log(
          "⚠️ Fallback: No server countdown received, starting local countdown"
        );
        startLocalCountdown();
      }, 5000); // 5 second fallback timeout
    } catch (error) {
      console.error(
        "❌ Error starting battle, using fallback countdown:",
        error
      );
      startLocalCountdown();
    } finally {
      setGameLoading(false);
    }
  };

  const startLocalCountdown = () => {
    console.log("⚠️ Starting local fallback countdown");

    // Prevent multiple countdowns - check current phase more strictly
    if (gamePhase === "countdown") {
      console.log("🚫 Countdown already in progress, ignoring");
      return;
    }

    if (gamePhase === "playing") {
      console.log("🚫 Game already started, ignoring countdown request");
      return;
    }

    // Clear any existing timers
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    if (battleStartTimeout.current) {
      clearTimeout(battleStartTimeout.current);
      battleStartTimeout.current = null;
    }

    setGamePhase("countdown");
    setCountdownValue(3);

    let currentCount = 3;
    countdownInterval.current = setInterval(() => {
      currentCount--;
      console.log("⏰ Local countdown:", currentCount);

      if (currentCount <= 0) {
        // Clear the interval
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;

        // Always transition to playing when countdown finishes
        setCountdownValue(0);
        setGamePhase("playing");
        setCurrentRoundIndex(0);
        setGameStartTime(Date.now());
        console.log("✅ Local countdown finished, transitioned to playing");
      } else {
        setCountdownValue(currentCount);
      }
    }, 1000);
  };

  // Legacy function - now just calls the new one
  const startCountdown = () => {
    startLocalCountdown();
  };

  const clearAllTimers = () => {
    console.log("🧹 Clearing all timers and intervals");

    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }

    if (battleStartTimeout.current) {
      clearTimeout(battleStartTimeout.current);
      battleStartTimeout.current = null;
    }

    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }

    if (roundPollingInterval.current) {
      clearInterval(roundPollingInterval.current);
      roundPollingInterval.current = null;
    }
  };

  const navigateToResults = async () => {
    console.log("🎯 Preparing to navigate to results page");

    // Ensure we have a valid user ID before navigation
    let validUserId = currentUserId;

    if (!validUserId || validUserId === 0) {
      console.log("⚠️ No valid currentUserId, fetching from stored user data");
      try {
        const userData = await userAPI.getStoredUserData();
        if (userData && userData.id) {
          validUserId = userData.id;
          setCurrentUserId(validUserId); // Update state for consistency
          console.log("✅ Retrieved user ID from storage:", validUserId);
        }
      } catch (error) {
        console.error("❌ Failed to get stored user data:", error);
      }
    }

    // Clear all timers before navigation
    clearAllTimers();

    // Navigate to results page with validated user ID
    router.replace({
      pathname: "/game/duoBattle/battleResult",
      params: {
        battleId: battleId,
        currentUserId: validUserId?.toString() || "0",
      },
    });

    console.log("🎯 Navigated to results with user ID:", validUserId);
  };

  const transitionToResults = async () => {
    console.log("🎯 Transitioning to results page");
    await navigateToResults();
  };

  useEffect(() => {
    if (gamePhase === "playing" && rounds.length > 0) {
      console.log("🎮 Game phase set to playing, starting round timer");
      setRoundStartTime(Date.now());

      // Set game start time if not already set
      if (!gameStartTime) {
        console.log("⏰ Setting game start time");
        setGameStartTime(Date.now());
      }
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
          console.log("🏁 Battle completed, navigating to results");
          await navigateToResults();
          return;
        } else if (
          response.opponent &&
          response.rounds &&
          response.rounds.length > 0
        ) {
          console.log(
            "🎮 Battle has opponent and rounds, determining current state..."
          );
          console.log("Opponent:", response.opponent.username);
          console.log("Rounds count:", response.rounds.length);

          // Check if any rounds have been played (battle is in progress)
          const hasPlayedRounds = response.rounds.some(
            (round: BattleRound) =>
              round.creator_symbol || round.opponent_symbol
          );

          // Don't override countdown or playing state
          if (gamePhase === "countdown" || gamePhase === "playing") {
            console.log("🚫 Not overriding current game phase:", gamePhase);
            return;
          }

          if (hasPlayedRounds) {
            console.log("🎮 Battle is in progress, setting phase to playing");
            setGamePhase("playing");
            // Find current round
            const currentRound = findCurrentRound(
              response.rounds,
              currentUserId || response.creator.id
            );
            console.log("Current round index:", currentRound);
            setCurrentRoundIndex(currentRound);
            setGameStartTime(Date.now());
          } else {
            console.log(
              "⏳ Battle has opponent but hasn't started, setting phase to ready-to-start"
            );
            setGamePhase("ready-to-start");
          }
        } else {
          // Don't override countdown or playing state
          if (gamePhase === "countdown" || gamePhase === "playing") {
            console.log("🚫 Not overriding current game phase:", gamePhase);
            return;
          }

          console.log("⏳ No opponent or rounds yet, setting phase to waiting");
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
    console.log("🔄 Starting polling for opponent...");

    // Poll for opponent joining (works as fallback and primary detection)
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await battleAPI.getBattleSession(battleId);
        if (
          response &&
          response.opponent &&
          response.rounds &&
          response.rounds.length > 0
        ) {
          console.log(
            "🎮 Polling detected opponent joined! Moving to ready-to-start..."
          );

          // Update state
          setOpponent(response.opponent);
          setRounds(response.rounds);

          // Clear polling
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
          }

          // Move to ready-to-start phase (wait for creator to click start)
          setGamePhase("ready-to-start");
        }
      } catch (error) {
        console.error("Error polling for opponent:", error);
      }
    }, 3000); // Check every 3 seconds
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
    console.log(
      "🔄 Starting polling: Waiting for opponent to finish all rounds..."
    );

    roundPollingInterval.current = setInterval(async () => {
      try {
        console.log("🔍 Polling for battle completion...");
        const response = await battleAPI.getBattleSession(battleId);

        if (response && response.battle_session) {
          const battleCompleted = response.battle_session.completed;
          const creatorCompleted = response.battle_session.creator_completed;
          const opponentCompleted = response.battle_session.opponent_completed;

          console.log("📊 Battle completion status:", {
            battleCompleted,
            creatorCompleted,
            opponentCompleted,
            battleId: response.battle_session.id,
          });

          if (battleCompleted) {
            console.log(
              "✅ POLLING: Battle completion detected! Transitioning to results..."
            );

            if (roundPollingInterval.current) {
              clearInterval(roundPollingInterval.current);
              roundPollingInterval.current = null;
            }

            // Use same transition function as Socket.IO event
            transitionToResults();
          } else {
            console.log(
              "⏳ Polling: Battle not yet completed, continuing to wait..."
            );
          }
        } else {
          console.warn("❌ Polling: No battle session data received");
        }
      } catch (error) {
        console.error("❌ Error polling for battle completion:", error);
      }
    }, 2000);
  };

  const submitAnswer = async (answer: string) => {
    if (
      !battleSession ||
      currentRoundIndex >= rounds.length ||
      selectedAnswer
    ) {
      return; // Prevent multiple submissions for same round
    }

    // Ensure we're in playing phase when submitting answers
    if (gamePhase !== "playing") {
      console.log(
        "🔧 Force setting game phase to playing during answer submission"
      );
      setGamePhase("playing");
    }

    setSelectedAnswer(answer);

    const currentRound = rounds[currentRoundIndex];
    const responseTime = (Date.now() - roundStartTime) / 1000; // Convert to seconds with decimal precision
    const isCreator = currentUserId === creator?.id;

    // Immediately update UI with user's answer
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

    // Immediately move to next round - no waiting
    moveToNextRound();

    // Submit to backend in background (no UI blocking)
    try {
      if (socketService.isSocketConnected()) {
        socketService.submitRound(
          battleSession.id,
          currentRound.round_number,
          answer,
          responseTime
        );
      }

      await battleAPI.submitBattleRound({
        battle_session_id: battleSession.id,
        round_number: currentRound.round_number,
        user_symbol: answer,
        response_time: responseTime,
      });
    } catch (error) {
      // Silent background submission - don't interrupt gameplay
    }
  };

  const moveToNextRound = () => {
    setSelectedAnswer("");

    // Ensure we stay in playing phase during round transitions
    if (gamePhase !== "playing") {
      console.log(
        "🔧 Force setting game phase to playing during round transition"
      );
      setGamePhase("playing");
    }

    if (currentRoundIndex + 1 >= rounds.length) {
      // All rounds completed for this player - complete battle immediately
      completeBattle();
    } else {
      // Move to next round immediately
      setCurrentRoundIndex(currentRoundIndex + 1);
      setRoundStartTime(Date.now());
      console.log(
        `🎮 Moved to round ${currentRoundIndex + 2}/${rounds.length}`
      );
    }
  };

  const completeBattle = async () => {
    try {
      setGameLoading(true);
      const totalTime = (Date.now() - gameStartTime) / 1000; // Convert to seconds with decimal precision
      setTotalGameTime(totalTime);

      const response = await battleAPI.completeBattle(
        battleSession!.id,
        totalTime
      );

      if (response) {
        // Current player completed, transition to waiting for both
        setGamePhase("waiting-for-both");
        setWaitingForOpponent(true);
        startPulseAnimation();

        if (socketService.isSocketConnected()) {
          socketService.completeBattle(battleSession!.id);
        }
      }
    } catch (error) {
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

  const formatTime = (seconds: number): string => {
    // For response times, show decimal seconds (e.g., 0.531s)
    if (seconds < 60) {
      return `${seconds.toFixed(3)}s`;
    }
    // For longer times, show minutes:seconds with decimals
    const mins = Math.floor(seconds / 60);
    const remainingSecs = (seconds % 60).toFixed(3);
    return `${mins}:${remainingSecs.padStart(6, "0")}`;
  };

  const renderWaitingForBothScreen = () => (
    <View style={styles.waitingContainer}>
      <Animated.View
        style={[styles.waitingIcon, { transform: [{ scale: pulseAnim }] }]}
      >
        <Ionicons name="hourglass" size={80} color="#E91E63" />
      </Animated.View>

      <Text style={styles.waitingTitle}>Waiting for Results</Text>
      <Text style={styles.waitingSubtitle}>
        Both players have completed their rounds.{"\n"}
        Calculating final results...
      </Text>

      <View style={styles.battleCodeContainer}>
        <Text style={styles.waitingInfo}>
          🔄 Processing battle results{"\n"}
          📊 Comparing scores and performance{"\n"}
          🏆 Determining the winner
        </Text>
      </View>
    </View>
  );

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

  const renderReadyToStartScreen = () => {
    const isCreator = currentUserId === creator?.id;
    const playersInRoom = [creator, opponent].filter((player) => player).length;
    const totalPlayers = 2;

    return (
      <View style={styles.readyToStartContainer}>
        <Text style={styles.readyToStartTitle}>Ready to Battle!</Text>

        {isCreator && (
          <View style={styles.roomStatusContainer}>
            <View style={styles.roomStatusHeader}>
              <Ionicons name="people" size={24} color="#E91E63" />
              <Text style={styles.roomStatusTitle}>Battle Room</Text>
            </View>

            <View style={styles.roomStatusInfo}>
              <View style={styles.playerCountContainer}>
                <Text style={styles.playerCountText}>
                  {playersInRoom}/{totalPlayers}
                </Text>
                <Text style={styles.playerCountLabel}>Players</Text>
              </View>

              <View style={styles.roomStatusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        playersInRoom === totalPlayers ? "#4CAF50" : "#FF9800",
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        playersInRoom === totalPlayers ? "#4CAF50" : "#FF9800",
                    },
                  ]}
                >
                  {playersInRoom === totalPlayers
                    ? "Ready to Start"
                    : "Waiting for Players"}
                </Text>
              </View>
            </View>

            <View style={styles.playersListContainer}>
              <View style={styles.playerListItem}>
                <Ionicons name="star" size={20} color="#E91E63" />
                <Text style={styles.playerListName}>{creator?.username}</Text>
                <View style={styles.playerListStatus}>
                  <View
                    style={[
                      styles.playerStatusDot,
                      { backgroundColor: "#4CAF50" },
                    ]}
                  />
                  <Text style={styles.playerStatusText}>Connected</Text>
                </View>
              </View>

              <View style={styles.playerListItem}>
                <Ionicons name="person" size={20} color="#888" />
                <Text style={styles.playerListName}>
                  {opponent?.username || "Waiting for opponent..."}
                </Text>
                <View style={styles.playerListStatus}>
                  <View
                    style={[
                      styles.playerStatusDot,
                      { backgroundColor: opponent ? "#4CAF50" : "#666" },
                    ]}
                  />
                  <Text style={styles.playerStatusText}>
                    {opponent ? "Connected" : "Waiting"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.readyToStartPlayers}>
          <View style={styles.readyToStartPlayer}>
            <Ionicons name="shield" size={40} color="#E91E63" />
            <Text style={styles.readyToStartPlayerName}>
              {creator?.username}
            </Text>
            <Text style={styles.readyToStartPlayerLevel}>
              Level {creator?.current_level}
            </Text>
          </View>

          <Text style={styles.readyToStartVS}>VS</Text>

          <View style={styles.readyToStartPlayer}>
            <Ionicons name="flash" size={40} color="#E91E63" />
            <Text style={styles.readyToStartPlayerName}>
              {opponent?.username}
            </Text>
            <Text style={styles.readyToStartPlayerLevel}>
              Level {opponent?.current_level}
            </Text>
          </View>
        </View>

        {isCreator ? (
          <View style={styles.readyToStartCreatorSection}>
            <Text style={styles.readyToStartInstruction}>
              When both players are ready, tap the button below to start the
              battle!
            </Text>

            <TouchableOpacity
              style={[
                styles.startBattleButton,
                { opacity: playersInRoom === totalPlayers ? 1 : 0.6 },
              ]}
              onPress={startBattle}
              disabled={gameLoading || playersInRoom !== totalPlayers}
            >
              {gameLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="play" size={24} color="#fff" />
                  <Text style={styles.startBattleButtonText}>Start Battle</Text>
                </>
              )}
            </TouchableOpacity>

            {playersInRoom !== totalPlayers && (
              <Text style={styles.startBattleDisabledText}>
                Waiting for all players to join before starting
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.readyToStartOpponentSection}>
            <Animated.View
              style={[
                styles.waitingIcon,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Ionicons name="hourglass-outline" size={60} color="#E91E63" />
            </Animated.View>
            <Text style={styles.readyToStartWaitingText}>
              Waiting for {creator?.username} to start the battle...
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCountdownScreen = () => (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdownTitle}>Get Ready!</Text>

      <Animated.View
        style={[styles.countdownCircle, { transform: [{ scale: pulseAnim }] }]}
      >
        {countdownValue > 0 ? (
          <Text style={styles.countdownNumber}>{countdownValue}</Text>
        ) : (
          <Text style={styles.countdownGo}>GO!</Text>
        )}
      </Animated.View>

      <Text style={styles.countdownSubtitle}>
        Battle starts in {countdownValue > 0 ? countdownValue : "now"}...
      </Text>

      {/* Players Info */}
      <View style={styles.countdownPlayers}>
        <View style={styles.countdownPlayer}>
          <Text style={styles.countdownPlayerName}>{creator?.username}</Text>
          <Text style={styles.countdownPlayerLevel}>
            Level {creator?.current_level}
          </Text>
        </View>

        <Text style={styles.countdownVS}>VS</Text>

        <View style={styles.countdownPlayer}>
          <Text style={styles.countdownPlayerName}>{opponent?.username}</Text>
          <Text style={styles.countdownPlayerLevel}>
            Level {opponent?.current_level}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderGameplayScreen = () => {
    const currentRound = getCurrentRound();

    // If waiting for opponent to finish all rounds
    if (waitingForOpponent) {
      // Start polling if not already started (regardless of Socket.IO status for redundancy)
      if (!roundPollingInterval.current) {
        console.log("🔄 Starting polling for battle completion...");
        startWaitingForOpponentToFinish();
      }

      return (
        <View style={styles.gameplayContainer}>
          <View style={styles.waitingForOpponentContainer}>
            <ActivityIndicator size="large" color="#E91E63" />
            <Text style={styles.waitingTitle}>All rounds completed!</Text>
            <Text style={styles.waitingText}>
              Waiting for opponent to finish...
            </Text>
            <Text style={styles.waitingText}>
              {socketService.isSocketConnected()
                ? "Connected via Socket.IO"
                : "Using polling for updates"}
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
          >
            <Text style={styles.answerText}>{"<"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={getAnswerStyle("=")}
            onPress={() => submitAnswer("=")}
          >
            <Text style={styles.answerText}>{"="}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={getAnswerStyle(">")}
            onPress={() => submitAnswer(">")}
          >
            <Text style={styles.answerText}>{">"}</Text>
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
      {gamePhase === "ready-to-start" && renderReadyToStartScreen()}
      {gamePhase === "countdown" && renderCountdownScreen()}
      {gamePhase === "playing" && renderGameplayScreen()}
      {gamePhase === "waiting-for-both" && renderWaitingForBothScreen()}
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
  // Countdown Screen Styles
  countdownContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  countdownTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
    textAlign: "center",
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#1a1a1a",
    borderWidth: 4,
    borderColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  countdownNumber: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#E91E63",
  },
  countdownGo: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  countdownSubtitle: {
    fontSize: 18,
    color: "#888",
    textAlign: "center",
    marginBottom: 60,
  },
  countdownPlayers: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
  },
  countdownPlayer: {
    alignItems: "center",
    flex: 1,
  },
  countdownPlayerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  countdownPlayerLevel: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  countdownVS: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E91E63",
    marginHorizontal: 20,
  },
  // Ready to Start Screen Styles
  readyToStartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  readyToStartTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 50,
    textAlign: "center",
  },
  readyToStartPlayers: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  readyToStartPlayer: {
    alignItems: "center",
    flex: 1,
  },
  readyToStartPlayerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  readyToStartPlayerLevel: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  readyToStartVS: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#E91E63",
    marginHorizontal: 30,
  },
  readyToStartCreatorSection: {
    alignItems: "center",
    width: "100%",
  },
  readyToStartInstruction: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  startBattleButton: {
    backgroundColor: "#E91E63",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startBattleButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  readyToStartOpponentSection: {
    alignItems: "center",
  },
  readyToStartWaitingText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  startBattleDisabledText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 15,
    fontStyle: "italic",
  },
  // Room Status Styles
  roomStatusContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    width: "100%",
    borderWidth: 1,
    borderColor: "#333",
  },
  roomStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  roomStatusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  roomStatusInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  playerCountContainer: {
    alignItems: "center",
  },
  playerCountText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E91E63",
  },
  playerCountLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  roomStatusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  playersListContainer: {
    gap: 12,
  },
  playerListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#222",
  },
  playerListName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    flex: 1,
    marginLeft: 8,
  },
  playerListStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  playerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  playerStatusText: {
    fontSize: 12,
    color: "#888",
  },
  // Round Result Overlay Styles
  roundResultOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  roundResultContent: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 16,
    width: "80%",
    maxHeight: "80%",
  },

  roundResultAnswers: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  roundResultPlayer: {
    alignItems: "center",
  },
  roundResultPlayerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  roundResultAnswer: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  roundResultTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  roundResultCorrect: {
    alignItems: "center",
  },
  roundResultCorrectLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  roundResultCorrectAnswer: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
});
