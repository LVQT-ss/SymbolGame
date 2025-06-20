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
  FlatList,
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

    // Handle special string session IDs
    if (sessionId === "practice" || sessionId === "quick-submit") {
      console.log(`✅ Special sessionId: ${sessionId}`);
      return sessionId;
    }

    // Try to parse as number for regular session IDs
    const id = parseInt(sessionId as string, 10);
    if (isNaN(id)) {
      console.error(`❌ Invalid sessionId: ${sessionId}`);
      return null;
    }

    console.log(`✅ Valid numeric sessionId: ${id}`);
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
  const [showGameMenu, setShowGameMenu] = useState<boolean>(false);
  const [showGamesList, setShowGamesList] = useState<boolean>(false);
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [gamesLoading, setGamesLoading] = useState<boolean>(false);

  useEffect(() => {
    if (parsedSessionId === "practice") {
      // Practice mode - create offline rounds
      initializePracticeMode();
    } else if (parsedSessionId === "quick-submit") {
      // Quick submit mode - create offline rounds but submit all at once
      initializeQuickSubmitMode();
    } else if (parsedSessionId && typeof parsedSessionId === "number") {
      loadGameSession();
    } else if (parsedSessionId === null) {
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

  const initializePracticeMode = () => {
    console.log("🎮 Initializing practice mode");

    // Create practice rounds with random numbers
    const practiceRounds: Round[] = [];
    for (let i = 1; i <= 10; i++) {
      const first = Math.floor(Math.random() * 100) + 1;
      const second = Math.floor(Math.random() * 100) + 1;
      practiceRounds.push({
        round_number: i,
        first_number: first,
        second_number: second,
      });
    }

    // Create practice game session
    const practiceSession: GameSession = {
      id: 0,
      number_of_rounds: 10,
      completed: false,
      score: 0,
      correct_answers: 0,
      total_time: 0,
    };

    setGameSession(practiceSession);
    setRounds(practiceRounds);
    setScore(0);
    setCorrectAnswers(0);
    setCurrentRoundIndex(0);
    setGameCompleted(false);
    setLoading(false);

    console.log("✅ Practice mode initialized with 10 rounds");
  };

  const initializeQuickSubmitMode = () => {
    console.log("🚀 Initializing quick submit mode");

    // Create rounds with random numbers (similar to practice but will be submitted)
    const quickRounds: Round[] = [];
    for (let i = 1; i <= 10; i++) {
      const first = Math.floor(Math.random() * 100) + 1;
      const second = Math.floor(Math.random() * 100) + 1;
      quickRounds.push({
        round_number: i,
        first_number: first,
        second_number: second,
      });
    }

    // Create quick submit game session
    const quickSession: GameSession = {
      id: 0, // Will be assigned by backend
      number_of_rounds: 10,
      completed: false,
      score: 0,
      correct_answers: 0,
      total_time: 0,
    };

    setGameSession(quickSession);
    setRounds(quickRounds);
    setScore(0);
    setCorrectAnswers(0);
    setCurrentRoundIndex(0);
    setGameCompleted(false);
    setLoading(false);

    console.log("✅ Quick submit mode initialized with 10 rounds");
  };

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

          // Show completion summary
          Alert.alert(
            "Game Already Completed! 🎉",
            `This game has been finished!\n\nFinal Score: ${
              response.game_session.score || 0
            }\nCorrect Answers: ${response.game_session.correct_answers || 0}/${
              response.game_session.number_of_rounds
            }\nTotal Time: ${(response.game_session.total_time || 0).toFixed(
              1
            )}s`,
            [
              { text: "View Results", style: "default" },
              { text: "Back to Menu", onPress: () => router.back() },
            ]
          );
        } else {
          // Find current round
          const completedRounds = response.rounds.filter(
            (r: Round) => r.user_symbol
          ).length;
          setCurrentRoundIndex(completedRounds);

          // Check if all rounds are actually completed but game not marked as completed
          if (completedRounds >= response.game_session.number_of_rounds) {
            Alert.alert(
              "Game Completed! 🎉",
              "All rounds have been completed! The game will be marked as finished.",
              [{ text: "OK", onPress: () => router.back() }]
            );
            setGameCompleted(true);
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
      setRoundStartTime(Date.now());
    }
  };

  const handleStartGame = () => {
    setGameStarted(true);
    setGameStartTime(Date.now());
    startFirstRound();
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
      // Only submit to backend if not practice mode
      if (sessionId !== "practice" && parsedSessionId) {
        await gameAPI.submitRound(parsedSessionId, {
          round_number: currentRound.round_number,
          user_symbol: symbol,
          response_time: responseTime,
        });
      }

      // Move to next round or complete game
      if (currentRoundIndex + 1 >= rounds.length) {
        // Game completed
        if (sessionId === "practice") {
          setGameCompleted(true);
          Alert.alert(
            "Practice Complete! 🎉",
            `Score: ${score + (isCorrect ? 100 : 0)}\nCorrect: ${
              correctAnswers + (isCorrect ? 1 : 0)
            }/${rounds.length}\n\nThis was practice mode - no progress saved.`,
            [
              { text: "Play Again", onPress: () => initializePracticeMode() },
              { text: "Back to Menu", onPress: () => router.back() },
            ]
          );
        } else if (sessionId === "quick-submit") {
          // Submit whole game at once
          await submitWholeGame(updatedRounds);
        } else {
          await completeGame(updatedRounds);
        }
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
      const totalTime = finalRounds.reduce(
        (sum, round) => sum + (round.response_time || 0),
        0
      );

      const gameResults = {
        game_session_id: parsedSessionId,
        total_time: totalTime,
        rounds: finalRounds.map((round) => ({
          round_number: round.round_number,
          first_number: round.first_number,
          second_number: round.second_number,
          user_symbol: round.user_symbol,
          response_time: round.response_time,
        })),
      };

      await gameAPI.completeGame(gameResults);
      setGameCompleted(true);

      Alert.alert(
        "Game Complete!",
        `Final Score: ${
          score + (finalRounds[currentRoundIndex]?.is_correct ? 100 : 0)
        }\nCorrect Answers: ${
          correctAnswers + (finalRounds[currentRoundIndex]?.is_correct ? 1 : 0)
        }/${rounds.length}`,
        [
          { text: "Play Again", onPress: () => router.back() },
          { text: "Menu", onPress: () => router.replace("/game/menu") },
        ]
      );
    } catch (error) {
      console.error("Error completing game:", error);
      Alert.alert("Error", "Failed to complete game");
    }
  };

  const submitWholeGame = async (finalRounds: Round[]) => {
    try {
      setLoading(true);
      console.log("🚀 Submitting whole game...");

      // Calculate final scores
      const finalScore =
        score + (rounds.length - currentRoundIndex > 0 ? 100 : 0);
      const finalCorrect =
        correctAnswers + (rounds.length - currentRoundIndex > 0 ? 1 : 0);
      const totalTime = Date.now() - gameStartTime;

      // Prepare rounds data for submission
      const roundsData = finalRounds.map((round, index) => ({
        user_symbol: round.user_symbol || "",
        response_time: round.response_time || 0,
      }));

      // Submit to backend
      const result = await gameAPI.submitWholeGame({
        difficulty_level: 2,
        number_of_rounds: rounds.length,
        total_time: totalTime / 1000, // Convert to seconds
        rounds: roundsData,
      });

      setGameCompleted(true);

      console.log("✅ Whole game submitted successfully!");
      console.log("📊 Results:", result.game_result);

      Alert.alert(
        "Game Submitted! 🚀",
        `Score: ${result.game_result?.scoring?.final_score || finalScore}\n` +
          `Accuracy: ${
            result.game_result?.performance?.accuracy ||
            Math.round((finalCorrect / rounds.length) * 100)
          }%\n` +
          `Correct: ${
            result.game_result?.performance?.correct_answers || finalCorrect
          }/${rounds.length}\n` +
          `XP Gained: ${
            result.game_result?.scoring?.experience_gained || 0
          }\n` +
          `Coins Earned: ${result.game_result?.scoring?.coins_earned || 0}`,
        [
          { text: "Play Again", onPress: () => initializeQuickSubmitMode() },
          { text: "Back to Menu", onPress: () => router.back() },
        ]
      );
    } catch (error) {
      console.error("❌ Failed to submit whole game:", error);
      Alert.alert("Error", "Failed to submit game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMenu = () => {
    Alert.alert("Leave Game", "Are you sure you want to leave the game?", [
      { text: "Stay", style: "cancel" },
      { text: "Leave", onPress: () => router.back() },
    ]);
  };

  const toggleGameMenu = () => {
    setShowGameMenu(!showGameMenu);
  };

  const handleNewQuickGame = () => {
    setShowGameMenu(false);
    Alert.alert(
      "Start New Quick Game?",
      "This will restart with new numbers. Your current progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "New Game",
          onPress: () => {
            if (sessionId === "quick-submit") {
              initializeQuickSubmitMode();
            } else if (sessionId === "practice") {
              initializePracticeMode();
            }
          },
        },
      ]
    );
  };

  const handleChangeDifficulty = () => {
    setShowGameMenu(false);
    Alert.alert("Change Difficulty", "Choose difficulty level for new game:", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Easy (1-20)",
        onPress: () => generateNewGameWithDifficulty(1),
      },
      {
        text: "Medium (1-50)",
        onPress: () => generateNewGameWithDifficulty(2),
      },
      {
        text: "Hard (1-100)",
        onPress: () => generateNewGameWithDifficulty(3),
      },
    ]);
  };

  const generateNewGameWithDifficulty = (difficulty: number) => {
    const maxNumber = Math.min(10 + difficulty * 20, 100);
    const newRounds: Round[] = [];

    for (let i = 1; i <= 10; i++) {
      const first = Math.floor(Math.random() * maxNumber) + 1;
      const second = Math.floor(Math.random() * maxNumber) + 1;
      newRounds.push({
        round_number: i,
        first_number: first,
        second_number: second,
      });
    }

    setRounds(newRounds);
    setCurrentRoundIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setGameCompleted(false);
    setGameStartTime(Date.now());
    setRoundStartTime(Date.now());

    console.log(
      `🎮 New game generated with difficulty ${difficulty} (max: ${maxNumber})`
    );
  };

  const handleSubmitProgress = async () => {
    setShowGameMenu(false);

    if (sessionId !== "quick-submit") {
      Alert.alert(
        "Not Available",
        "This option is only available in Quick Submit mode."
      );
      return;
    }

    if (currentRoundIndex === 0) {
      Alert.alert(
        "No Progress",
        "Complete at least one round before submitting."
      );
      return;
    }

    Alert.alert(
      "Submit Current Progress?",
      `Submit your answers for the first ${currentRoundIndex} rounds? Remaining rounds will be skipped.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit Now",
          onPress: async () => {
            const completedRounds = rounds.slice(0, currentRoundIndex);
            await submitWholeGame(completedRounds);
          },
        },
      ]
    );
  };

  const handleBrowseGames = async () => {
    setShowGameMenu(false);
    setGamesLoading(true);

    try {
      console.log("🎮 Fetching available games...");
      const response = await gameAPI.getAvailableGames(1, 20);

      if (response && response.available_games) {
        setAvailableGames(response.available_games);
        setShowGamesList(true);
        console.log(
          `✅ Found ${response.available_games.length} available games`
        );
      } else {
        Alert.alert("No Games", "No available games found at the moment.");
      }
    } catch (error) {
      console.error("❌ Failed to fetch available games:", error);
      Alert.alert("Error", "Failed to load available games. Please try again.");
    } finally {
      setGamesLoading(false);
    }
  };

  const handleJoinAvailableGame = async (game: any) => {
    try {
      console.log(`🎮 Joining game ${game.id}...`);

      Alert.alert(
        "Join Game?",
        `Join "${game.admin_instructions}"\n${game.number_of_rounds} rounds • ${game.points_per_correct} points per correct answer\nCreated by: ${game.created_by.full_name}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Join Game",
            onPress: async () => {
              setShowGamesList(false);
              setLoading(true);

              try {
                // Join the game session
                const joinResult = await gameAPI.joinGameSession(game.id);
                console.log("✅ Joined game successfully:", joinResult);

                // Navigate to the joined game
                router.push({
                  pathname: "/game/play",
                  params: {
                    sessionId: game.id.toString(),
                    gameType: "Available Game",
                    title: game.admin_instructions || "Math Challenge",
                  },
                });
              } catch (error) {
                console.error("❌ Failed to join game:", error);
                Alert.alert(
                  "Error",
                  "Failed to join the game. Please try again."
                );
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("❌ Error joining game:", error);
    }
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
                {sessionId === "practice"
                  ? "\n• Practice mode - no progress saved"
                  : ""}
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
          <View style={styles.headerRight}>
            {(sessionId === "quick-submit" || sessionId === "practice") && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={toggleGameMenu}
              >
                <Ionicons name="menu" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>Score: {score}</Text>
            </View>
          </View>
        </View>

        {/* Game Menu Dropdown */}
        {showGameMenu &&
          (sessionId === "quick-submit" || sessionId === "practice") && (
            <>
              {/* Background overlay to close menu */}
              <TouchableOpacity
                style={styles.gameMenuOverlay}
                onPress={() => setShowGameMenu(false)}
                activeOpacity={1}
              />

              <View style={styles.gameMenuDropdown}>
                <View style={styles.gameMenuHeader}>
                  <Text style={styles.gameMenuTitle}>🎮 Game Options</Text>
                  <Text style={styles.gameMenuSubtitle}>
                    {sessionId === "quick-submit"
                      ? "Quick Submit Mode"
                      : "Practice Mode"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.gameMenuOption}
                  onPress={handleNewQuickGame}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={20} color="#4CAF50" />
                  <Text style={styles.gameMenuOptionText}>New Game</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.gameMenuOption}
                  onPress={handleChangeDifficulty}
                  activeOpacity={0.7}
                >
                  <Ionicons name="options" size={20} color="#FF9800" />
                  <Text style={styles.gameMenuOptionText}>
                    Change Difficulty
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.gameMenuOption}
                  onPress={handleBrowseGames}
                  activeOpacity={0.7}
                  disabled={gamesLoading}
                >
                  <Ionicons name="list" size={20} color="#673AB7" />
                  <Text style={styles.gameMenuOptionText}>
                    {gamesLoading ? "Loading..." : "Browse Available Games"}
                  </Text>
                </TouchableOpacity>

                {sessionId === "quick-submit" && (
                  <TouchableOpacity
                    style={styles.gameMenuOption}
                    onPress={handleSubmitProgress}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#2196F3"
                    />
                    <Text style={styles.gameMenuOptionText}>
                      Submit Progress
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.gameMenuOption}
                  onPress={() => {
                    setShowGameMenu(false);
                    router.back();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="home" size={20} color="#9C27B0" />
                  <Text style={styles.gameMenuOptionText}>Back to Menu</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.gameMenuCloseOption}
                  onPress={() => setShowGameMenu(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#888" />
                  <Text style={styles.gameMenuCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        {/* Games List Modal */}
        {showGamesList && (
          <View style={styles.gamesListModal}>
            <View style={styles.gamesListContainer}>
              <View style={styles.gamesListHeader}>
                <Text style={styles.gamesListTitle}>🎮 Available Games</Text>
                <TouchableOpacity
                  style={styles.gamesListCloseButton}
                  onPress={() => setShowGamesList(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={availableGames}
                keyExtractor={(item) => item.id.toString()}
                style={styles.gamesList}
                contentContainerStyle={styles.gamesListContent}
                renderItem={({ item: game }) => (
                  <TouchableOpacity
                    style={styles.gameItem}
                    onPress={() => handleJoinAvailableGame(game)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.gameItemHeader}>
                      <View style={styles.gameItemInfo}>
                        <Text style={styles.gameItemTitle} numberOfLines={2}>
                          {game.admin_instructions || "Math Challenge"}
                        </Text>
                        <Text style={styles.gameItemCreator}>
                          by {game.created_by.full_name}
                        </Text>
                      </View>
                      <View style={styles.gameItemBadge}>
                        <Text style={styles.gameItemBadgeText}>
                          {game.number_of_rounds}
                        </Text>
                        <Text style={styles.gameItemBadgeLabel}>rounds</Text>
                      </View>
                    </View>

                    <View style={styles.gameItemDetails}>
                      <View style={styles.gameItemDetail}>
                        <Ionicons name="time" size={16} color="#888" />
                        <Text style={styles.gameItemDetailText}>
                          {game.time_limit}
                        </Text>
                      </View>
                      <View style={styles.gameItemDetail}>
                        <Ionicons name="trophy" size={16} color="#ffd33d" />
                        <Text style={styles.gameItemDetailText}>
                          {game.points_per_correct} pts
                        </Text>
                      </View>
                      <View style={styles.gameItemDetail}>
                        <Ionicons name="calendar" size={16} color="#888" />
                        <Text style={styles.gameItemDetailText}>
                          {new Date(game.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.gameItemStatus}>
                      <View
                        style={[
                          styles.gameItemStatusDot,
                          { backgroundColor: "#4CAF50" },
                        ]}
                      />
                      <Text style={styles.gameItemStatusText}>
                        Available to Join
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.gamesListEmpty}>
                    <Ionicons
                      name="game-controller-outline"
                      size={64}
                      color="#666"
                    />
                    <Text style={styles.gamesListEmptyTitle}>
                      No Games Available
                    </Text>
                    <Text style={styles.gamesListEmptyText}>
                      There are currently no available games to join.
                    </Text>
                  </View>
                )}
              />
            </View>
          </View>
        )}

        <View style={styles.gameArea}>
          <Text style={styles.roundCounter}>
            Round {currentRoundIndex + 1} of {rounds.length}
          </Text>

          <View style={styles.comparisonContainer}>
            <View style={styles.numberBox}>
              <Text style={styles.numberText}>{currentRound.first_number}</Text>
            </View>
            <View style={styles.symbolPlaceholder}>
              <Text style={styles.questionMark}>?</Text>
            </View>
            <View style={styles.numberBox}>
              <Text style={styles.numberText}>
                {currentRound.second_number}
              </Text>
            </View>
          </View>

          <Text style={styles.questionText}>Which symbol is correct?</Text>

          <View style={styles.symbolButtons}>
            <TouchableOpacity
              style={styles.symbolButton}
              onPress={() => handleSymbolChoice("<")}
              activeOpacity={0.8}
            >
              <Text style={styles.symbolButtonText}>{"<"}</Text>
              <Text style={styles.symbolLabel}>Less Than</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.symbolButton}
              onPress={() => handleSymbolChoice("=")}
              activeOpacity={0.8}
            >
              <Text style={styles.symbolButtonText}>{"="}</Text>
              <Text style={styles.symbolLabel}>Equal To</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.symbolButton}
              onPress={() => handleSymbolChoice(">")}
              activeOpacity={0.8}
            >
              <Text style={styles.symbolButtonText}>{">"}</Text>
              <Text style={styles.symbolLabel}>Greater Than</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.gameControls}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${
                      ((currentRoundIndex + 1) / rounds.length) * 100
                    }%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Round {currentRoundIndex + 1} of {rounds.length} • Correct:{" "}
              {correctAnswers}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (gameCompleted) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="trophy" size={80} color="#ffd33d" />
          <Text style={styles.gameTitle}>Game Complete!</Text>
          <Text style={styles.finalScore}>Final Score: {score}</Text>
          <Text style={styles.accuracy}>
            Accuracy: {correctAnswers}/{rounds.length} (
            {Math.round((correctAnswers / rounds.length) * 100)}%)
          </Text>

          <View style={styles.finalButtons}>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={() => router.back()}
            >
              <Text style={styles.playAgainButtonText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => router.replace("/game/menu")}
            >
              <Text style={styles.menuButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!gameStarted) {
    return renderWaitingScreen();
  }

  if (countdown > 0) {
    return renderCountdown();
  }

  if (gameCompleted) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="trophy" size={80} color="#ffd33d" />
          <Text style={styles.gameTitle}>Game Complete!</Text>
          <Text style={styles.finalScore}>Final Score: {score}</Text>
          <Text style={styles.accuracy}>
            Accuracy: {correctAnswers}/{rounds.length} (
            {Math.round((correctAnswers / rounds.length) * 100)}%)
          </Text>

          <View style={styles.finalButtons}>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={() => router.back()}
            >
              <Text style={styles.playAgainButtonText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => router.replace("/game/menu")}
            >
              <Text style={styles.menuButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

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
    justifyContent: "space-around",
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  numberBox: {
    backgroundColor: "#333",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    minWidth: 100,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#555",
  },
  numberText: {
    fontSize: getResponsiveFontSize(36),
    fontWeight: "bold",
    color: "#fff",
  },
  symbolPlaceholder: {
    backgroundColor: "#444",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    minWidth: 80,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffd33d",
    borderStyle: "dashed",
  },
  questionMark: {
    fontSize: getResponsiveFontSize(36),
    fontWeight: "bold",
    color: "#ffd33d",
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
    minWidth: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  symbolButtonText: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: "bold",
    color: "#25292e",
    marginBottom: 4,
  },
  symbolLabel: {
    fontSize: getResponsiveFontSize(10),
    fontWeight: "500",
    color: "#25292e",
    textAlign: "center",
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
    width: "100%",
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "#444",
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#ffd33d",
    borderRadius: 3,
  },
  progressText: {
    fontSize: getResponsiveFontSize(14),
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  errorText: {
    fontSize: getResponsiveFontSize(18),
    color: "#F44336",
    textAlign: "center",
  },
  finalScore: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: "bold",
    color: "#ffd33d",
    marginTop: 20,
  },
  accuracy: {
    fontSize: getResponsiveFontSize(18),
    color: "#fff",
    marginTop: 10,
    marginBottom: 40,
  },
  finalButtons: {
    width: "100%",
    maxWidth: 300,
  },
  playAgainButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  playAgainButtonText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    color: "#fff",
  },
  menuButton: {
    backgroundColor: "#333",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  menuButtonText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    color: "#fff",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  gameMenuDropdown: {
    position: "absolute",
    top: 80,
    right: getResponsivePadding(),
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 8,
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minWidth: 200,
  },
  gameMenuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  gameMenuOptionText: {
    color: "#fff",
    fontSize: getResponsiveFontSize(16),
    fontWeight: "600",
    marginLeft: 12,
  },
  gameMenuCloseOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    borderTopWidth: 1,
    borderTopColor: "#555",
    marginTop: 8,
  },
  gameMenuCloseText: {
    color: "#888",
    fontSize: getResponsiveFontSize(14),
    fontWeight: "600",
    marginLeft: 12,
  },
  gameMenuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 999,
  },
  gameMenuHeader: {
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#555",
  },
  gameMenuTitle: {
    color: "#fff",
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    textAlign: "center",
  },
  gameMenuSubtitle: {
    color: "#ffd33d",
    fontSize: getResponsiveFontSize(12),
    textAlign: "center",
    marginTop: 4,
    fontWeight: "600",
  },
  gamesListModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 2000,
    justifyContent: "center",
    alignItems: "center",
  },
  gamesListContainer: {
    backgroundColor: "#25292e",
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: "80%",
    width: "90%",
  },
  gamesListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  gamesListTitle: {
    color: "#fff",
    fontSize: getResponsiveFontSize(20),
    fontWeight: "bold",
  },
  gamesListCloseButton: {
    padding: 8,
  },
  gamesList: {
    flex: 1,
  },
  gamesListContent: {
    padding: 16,
  },
  gameItem: {
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  gameItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  gameItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  gameItemTitle: {
    color: "#fff",
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    marginBottom: 4,
  },
  gameItemCreator: {
    color: "#888",
    fontSize: getResponsiveFontSize(12),
  },
  gameItemBadge: {
    backgroundColor: "#ffd33d",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
  },
  gameItemBadgeText: {
    color: "#25292e",
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
  },
  gameItemBadgeLabel: {
    color: "#25292e",
    fontSize: getResponsiveFontSize(10),
    fontWeight: "600",
  },
  gameItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  gameItemDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  gameItemDetailText: {
    color: "#ccc",
    fontSize: getResponsiveFontSize(12),
    marginLeft: 4,
  },
  gameItemStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  gameItemStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  gameItemStatusText: {
    color: "#4CAF50",
    fontSize: getResponsiveFontSize(12),
    fontWeight: "600",
  },
  gamesListEmpty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  gamesListEmptyTitle: {
    color: "#fff",
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  gamesListEmptyText: {
    color: "#888",
    fontSize: getResponsiveFontSize(14),
    textAlign: "center",
    lineHeight: 20,
  },
});
