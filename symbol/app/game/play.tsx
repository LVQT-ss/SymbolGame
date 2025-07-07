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
  ScrollView,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { gameAPI, userAPI } from "../../services/api";
import Canvas from "../../components/canvas";
import { Point, recognizeSymbol } from "../../utils/symbolUtils";
import { GameRecorder } from "../../components/GameRecorder";
import { useAuth } from "../../hooks/useAuth";

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
  const { token } = useAuth();

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
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Canvas state for symbol recognition
  const currentPath = useSharedValue<Point[]>([]);
  const [paths, setPaths] = useState<Point[][]>([]);
  const [recognizedSymbol, setRecognizedSymbol] = useState<string>("");
  const [showSymbolFeedback, setShowSymbolFeedback] = useState<boolean>(false);

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

    // 🎲 Shuffle practice rounds for variety
    const shuffledPracticeRounds = [...practiceRounds].sort(
      () => Math.random() - 0.5
    );

    setGameSession(practiceSession);
    setRounds(shuffledPracticeRounds);
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

    // 🎲 Shuffle quick submit rounds for variety
    const shuffledQuickRounds = [...quickRounds].sort(
      () => Math.random() - 0.5
    );

    setGameSession(quickSession);
    setRounds(shuffledQuickRounds);
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

      console.log("📊 Game session API response:", response);

      // Validate response structure matches expected format
      if (response && response.game_session) {
        console.log("✅ Valid game session data received");
        console.log(
          "🎯 Game completed status:",
          response.game_session.completed
        );
        console.log("📊 Rounds received:", response.rounds?.length || 0);
        console.log("📋 First round sample:", response.rounds?.[0]);

        // Set game session data
        setGameSession(response.game_session);
        setRounds(response.rounds || []);
        setScore(response.game_session.score || 0);
        setCorrectAnswers(response.game_session.correct_answers || 0);

        // Validate rounds data
        const validRounds =
          response.rounds?.filter(
            (round: any) =>
              round &&
              typeof round.round_number === "number" &&
              typeof round.first_number === "number" &&
              typeof round.second_number === "number"
          ) || [];

        if (validRounds.length === 0) {
          throw new Error("No valid rounds found in game session");
        }

        console.log(`📊 Game loaded: ${validRounds.length} rounds available`);

        // Check if game is already completed
        if (
          response.game_session.completed ||
          response.progress?.is_completed
        ) {
          setGameCompleted(true);

          Alert.alert(
            "Game Already Completed! 🎉",
            `This game has been finished!\n\n` +
              `Final Score: ${response.game_session.score || 0}\n` +
              `Correct Answers: ${response.game_session.correct_answers || 0}/${
                response.game_session.number_of_rounds
              }\n` +
              `Total Time: ${(response.game_session.total_time || 0).toFixed(
                1
              )}s\n\n` +
              `Created by: ${
                response.game_session.admin_creator?.full_name ||
                response.game_session.admin_creator?.username ||
                "Admin"
              }`,
            [
              { text: "View Results", style: "default" },
              { text: "Back to Menu", onPress: () => router.back() },
            ]
          );
        } else {
          // Game is not completed - user needs to play
          console.log("🎮 Game is not completed, preparing for gameplay");

          // Clear any pre-existing user_symbol data for fresh gameplay
          // This ensures user can play even if API returns pre-filled data
          const freshRounds =
            response.rounds
              ?.map((round: any) => ({
                round_number: round.round_number,
                first_number: round.first_number,
                second_number: round.second_number,
                // Clear user input data for fresh gameplay
                user_symbol: undefined,
                response_time: undefined,
                is_correct: undefined,
              }))
              // CRITICAL: Sort rounds by round_number to ensure correct order
              .sort((a: any, b: any) => a.round_number - b.round_number) || [];

          // 🎲 SHUFFLE rounds for fairness while preserving round_number tracking
          // This makes each game unique while allowing proper backend validation
          const shuffledRounds = [...freshRounds].sort(
            () => Math.random() - 0.5
          );

          setRounds(shuffledRounds);
          setCurrentRoundIndex(0); // Start from first round
          setScore(0); // Reset score for fresh gameplay
          setCorrectAnswers(0); // Reset correct answers

          console.log(
            `🎮 Game ready to play - ${freshRounds.length} rounds loaded`
          );
          console.log("📊 Sample rounds:", freshRounds.slice(0, 2));

          // Show admin instructions if available
          if (response.game_session.admin_instructions) {
            Alert.alert(
              "Game Instructions",
              response.game_session.admin_instructions,
              [{ text: "Got it!" }]
            );
          }
        }
      } else {
        throw new Error("Invalid game session response format");
      }
    } catch (error: any) {
      console.error("❌ Error loading game session:", error);

      // Enhanced error handling
      if (error.message?.includes("not found")) {
        Alert.alert(
          "Game Not Found",
          "The selected game session could not be found. It may have been deleted or is no longer available.",
          [{ text: "Back to Menu", onPress: () => router.back() }]
        );
      } else if (error.message?.includes("Must be a valid number")) {
        Alert.alert("Invalid Game Session", "The game session ID is invalid.", [
          { text: "Go Back", onPress: () => router.back() },
          {
            text: "Try Practice Mode",
            onPress: () => {
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
        ]);
      } else {
        Alert.alert(
          "Loading Error",
          `Failed to load game session: ${
            error.message || "Unknown error"
          }. Please try again.`,
          [
            { text: "Retry", onPress: () => loadGameSession() },
            { text: "Back to Menu", onPress: () => router.back() },
          ]
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
      // Set game start time when the first round actually begins (after countdown)
      setGameStartTime(now);
    }
  };

  const handleStartGame = () => {
    setGameStarted(true);
    // Don't set gameStartTime here - it will be set when first round starts
  };

  // Enhanced point calculation function from duoBattle system
  const calculatePointsWithTimeBonus = (
    isCorrect: boolean,
    responseTime: number
  ): number => {
    if (!isCorrect) return 0;

    // Base score + time bonus (0.5-10 seconds range in 0.5 increments)
    const clampedResponseTime = Math.min(
      10,
      Math.max(0.5, Math.round(responseTime * 2) / 2)
    );
    const timeBonus = Math.max(0, (10 - clampedResponseTime) * 5);
    const pointsEarned = 100 + Math.floor(timeBonus);

    console.log(
      `⚡ Points calculation: Base(100) + TimeBonus(${Math.floor(
        timeBonus
      )}) = ${pointsEarned} [Response time: ${responseTime.toFixed(3)}s]`
    );
    return pointsEarned;
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

    // Calculate points using the enhanced algorithm
    const pointsEarned = calculatePointsWithTimeBonus(isCorrect, responseTime);

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
      setScore((prev) => prev + pointsEarned);
    }

    try {
      // Move to next round or complete game
      if (currentRoundIndex + 1 >= rounds.length) {
        // Game completed
        if (sessionId === "practice") {
          setGameCompleted(true);

          // Redirect to gameResult.tsx for practice mode
          router.push({
            pathname: "/game/gameResult",
            params: {
              gameType: "practice",
              finalScore: (score + (isCorrect ? 100 : 0)).toString(),
              correctAnswers: (correctAnswers + (isCorrect ? 1 : 0)).toString(),
              totalRounds: rounds.length.toString(),
              accuracy: Math.round(
                ((correctAnswers + (isCorrect ? 1 : 0)) / rounds.length) * 100
              ).toString(),
              totalTime: ((Date.now() - gameStartTime) / 1000).toString(),
              xpGained: "0",
              coinsEarned: "0",
            },
          });
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
        // Clear canvas for next round
        clearCanvas();
      }
    } catch (error) {
      console.error("Error submitting round:", error);
      Alert.alert("Error", "Failed to submit round answer");
    }
  };

  const uploadVideoToDatabase = async (uri: string) => {
    try {
      console.log("📹 Uploading video to database...");
      console.log("🔑 Token available:", !!token);

      // Check if we have a valid token
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      // Create form data similar to image upload in Auth.tsx
      const formData = new FormData();

      // Get the file name and type from the URI
      const filename = uri.split("/").pop() || "game-recording.mp4";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `video/${match[1]}` : "video/mp4";

      // Append the video to form data
      formData.append("video", {
        uri: uri,
        type: type,
        name: filename,
      } as any);

      formData.append("duration", "5");

      // Upload to the new record-video endpoint in index.js
      const response = await fetch(
        "https://symbolgame.onrender.com/api/record-video",
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type header - let the browser set it automatically for multipart/form-data
          },
        }
      );

      console.log("📡 Upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Database upload failed with status:",
          response.status
        );
        console.error("❌ Error response:", errorText);

        // Handle specific error cases
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        } else if (response.status === 413) {
          throw new Error("Video file is too large. Please try again.");
        } else if (response.status === 400) {
          throw new Error(
            "Invalid video format or duration exceeded 10 seconds."
          );
        } else {
          throw new Error(
            `Database upload failed: ${response.status} - ${errorText}`
          );
        }
      }

      const data = await response.json();
      console.log("✅ Video uploaded to database successfully:", data);
      return data.recording_url;
    } catch (error) {
      console.error("❌ Error uploading video to database:", error);
      throw error;
    }
  };

  const handleRecordingComplete = async (localUri: string) => {
    try {
      console.log("📹 Starting video upload to database...");
      console.log("📁 Local video URI:", localUri);

      // Upload video directly to database (like image upload in Auth.tsx)
      const databaseVideoUrl = await uploadVideoToDatabase(localUri);
      setRecordingUrl(databaseVideoUrl);

      console.log("✅ Video recording uploaded and URL set:", databaseVideoUrl);

      // Don't show alert for successful upload - let the game flow continue
      // Alert.alert(
      //   "Success",
      //   "Video recording uploaded to database successfully!"
      // );
    } catch (error: any) {
      console.error("❌ Error uploading video:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to upload video to database. ";
      if (error.message?.includes("Network request failed")) {
        errorMessage +=
          "Please check your internet connection and ensure the backend server is running.";
      } else if (error.message?.includes("400")) {
        errorMessage += "Invalid video file or format.";
      } else if (error.message?.includes("401")) {
        errorMessage += "Authentication failed. Please log in again.";
      } else if (error.message?.includes("413")) {
        errorMessage += "Video file is too large.";
      } else {
        errorMessage += error.message || "Unknown error occurred.";
      }

      Alert.alert("Upload Failed", errorMessage, [
        { text: "Continue without video", style: "default" },
        { text: "Try again", onPress: () => handleRecordingComplete(localUri) },
      ]);
    }
  };

  const waitForRecordingToComplete = async (): Promise<void> => {
    return new Promise((resolve) => {
      // Give some time for recording to finish and upload
      console.log("⏳ Waiting for recording to complete...");

      let attempts = 0;
      const maxAttempts = 30; // Wait up to 15 seconds (30 * 500ms)

      const checkRecording = () => {
        attempts++;

        // If we have a recording URL or we've waited long enough, proceed
        if (recordingUrl || attempts >= maxAttempts) {
          console.log(
            `✅ Recording complete. URL: ${
              recordingUrl || "None"
            }, Attempts: ${attempts}`
          );
          resolve();
        } else {
          console.log(
            `🔄 Still waiting for recording... Attempt ${attempts}/${maxAttempts}`
          );
          setTimeout(checkRecording, 500);
        }
      };

      checkRecording();
    });
  };

  const completeGame = async (finalRounds: Round[]) => {
    try {
      console.log("🎮 Completing game with session ID:", parsedSessionId);

      // Skip completion for practice mode
      if (parsedSessionId === "practice") {
        setGameCompleted(true);
        router.push({
          pathname: "/game/gameResult",
          params: {
            gameType: "practice",
            finalScore: score.toString(),
            correctAnswers: correctAnswers.toString(),
            totalRounds: rounds.length.toString(),
            accuracy: Math.round(
              (correctAnswers / rounds.length) * 100
            ).toString(),
            totalTime: ((Date.now() - gameStartTime) / 1000).toString(),
            xpGained: "0",
            coinsGained: "0",
          },
        });
        return;
      }

      // Wait for recording to complete before finishing the game
      await waitForRecordingToComplete();

      console.log("🎥 Final recording URL:", recordingUrl);

      const response = await fetch(
        `https://symbolgame.onrender.com/api/game/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            game_session_id: parsedSessionId,
            total_time: (Date.now() - gameStartTime) / 1000,
            rounds: finalRounds,
            recording_url: recordingUrl,
            recording_duration: 5,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to complete game");
      }

      const data = await response.json();
      setGameCompleted(true);

      console.log("✅ Game completed successfully:", data);

      // 🆕 Update stored user profile with new level/XP info if available
      if (data.updatedUserInfo) {
        console.log("🎉 Updating user level info:", data.updatedUserInfo);
        await userAPI.updateStoredUserLevel(data.updatedUserInfo);

        // 🆕 Also update statistics immediately for instant UI refresh
        await userAPI.updateStoredUserStats();
      }

      // Get results data from server response
      const finalScore = data.data?.game_result?.scoring?.final_score || score;
      const finalCorrect =
        data.data?.game_result?.performance?.correct_answers || correctAnswers;
      const accuracy =
        data.data?.game_result?.performance?.accuracy ||
        Math.round((correctAnswers / rounds.length) * 100);
      const xpGained = data.data?.game_result?.scoring?.experience_gained || 0;
      const coinsEarned = data.data?.game_result?.scoring?.coins_earned || 0;

      // Redirect to gameResult.tsx instead of showing alert
      router.push({
        pathname: "/game/gameResult",
        params: {
          gameType: "session",
          sessionId: (parsedSessionId || 0).toString(),
          finalScore: finalScore.toString(),
          correctAnswers: finalCorrect.toString(),
          totalRounds: rounds.length.toString(),
          accuracy: accuracy.toString(),
          totalTime: (Date.now() - gameStartTime) / 1000,
          xpGained: xpGained.toString(),
          coinsEarned: coinsEarned.toString(),
        },
      });
    } catch (error: any) {
      console.error("❌ Error completing game:", error);
      Alert.alert(
        "Completion Error",
        `Failed to complete game: ${error.message || "Unknown error"}`,
        [{ text: "Back to Menu", onPress: () => router.replace("/game/menu") }]
      );
    }
  };

  const submitWholeGame = async (finalRounds: Round[]) => {
    try {
      setLoading(true);
      console.log("🚀 Submitting whole game...");

      // Wait for recording to complete before submitting
      await waitForRecordingToComplete();

      console.log("🎥 Final recording URL for submit:", recordingUrl);

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

      // Submit to backend with recording URL
      const result = await gameAPI.submitWholeGame({
        difficulty_level: 2,
        number_of_rounds: rounds.length,
        total_time: totalTime / 1000, // Convert to seconds
        rounds: roundsData,
        recording_url: recordingUrl,
        recording_duration: 5,
      });

      setGameCompleted(true);

      console.log("✅ Whole game submitted successfully!");
      console.log("📊 Results:", result.game_result);

      // 🆕 Update stored user profile with new level/XP info if available
      if (result.updated_user_info) {
        console.log("🎉 Updating user level info:", result.updated_user_info);
        await userAPI.updateStoredUserLevel(result.updated_user_info);

        // 🆕 Also update statistics immediately for instant UI refresh
        await userAPI.updateStoredUserStats();
      }

      // Get results data from server response
      const serverScore =
        result.game_result?.scoring?.final_score || finalScore;
      const serverCorrect =
        result.game_result?.performance?.correct_answers || finalCorrect;
      const serverAccuracy =
        result.game_result?.performance?.accuracy ||
        Math.round((finalCorrect / rounds.length) * 100);
      const xpGained = result.game_result?.scoring?.experience_gained || 0;
      const coinsEarned = result.game_result?.scoring?.coins_earned || 0;

      // Redirect to gameResult.tsx instead of showing alert
      router.push({
        pathname: "/game/gameResult",
        params: {
          gameType: "quick-submit",
          finalScore: serverScore.toString(),
          correctAnswers: serverCorrect.toString(),
          totalRounds: rounds.length.toString(),
          accuracy: serverAccuracy.toString(),
          totalTime: (totalTime / 1000).toString(),
          xpGained: xpGained.toString(),
          coinsEarned: coinsEarned.toString(),
        },
      });
    } catch (error: any) {
      console.error("❌ Error in submitWholeGame:", error);
      Alert.alert(
        "Submit Error",
        `Failed to submit game: ${error.message || "Unknown error"}`,
        [{ text: "Back to Menu", onPress: () => router.replace("/game/menu") }]
      );
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
    // Reset timing - gameStartTime will be set when first round actually starts
    const now = Date.now();
    setGameStartTime(now);
    setRoundStartTime(now);

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

  // Canvas gesture handlers
  const handleGestureStart = () => {
    setShowSymbolFeedback(false);
    setRecognizedSymbol("");
  };

  const handleGestureEnd = (path: Point[]) => {
    if (path && path.length > 0) {
      // Add the path to completed paths for visual feedback
      setPaths((prev) => [...prev, path]);

      // Recognize the symbol
      const result = recognizeSymbol(path);
      setRecognizedSymbol(result.symbol);
      setShowSymbolFeedback(true);

      // Auto-submit the recognized symbol after a short delay
      setTimeout(() => {
        handleSymbolChoice(result.symbol);
      }, 1000); // 1 second delay to show recognition feedback
    }
  };

  const clearCanvas = () => {
    setPaths([]);
    currentPath.value = [];
    setRecognizedSymbol("");
    setShowSymbolFeedback(false);
  };

  const renderWaitingScreen = () => {
    // Get game details from navigation params
    const {
      difficulty,
      rounds,
      timeLimit,
      adminInstructions,
      createdBy,
      rewards,
    } = params;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToMenu}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Game Lobby</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffd33d" />
              <Text style={styles.loadingText}>Loading game session...</Text>
            </View>
          ) : (
            <>
              {/* Success Banner */}
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                <Text style={styles.successText}>
                  Successfully Joined Game!
                </Text>
              </View>

              {/* Game Details Card */}
              <View style={styles.gameDetailsCard}>
                <View style={styles.gameCardHeader}>
                  <Ionicons name="game-controller" size={48} color="#ffd33d" />
                  <View style={styles.gameCardTitleSection}>
                    <Text style={styles.gameCardTitle}>
                      {title || "Symbol Match Game"}
                    </Text>
                    <Text style={styles.gameCardSubtitle}>
                      Created by {createdBy || "Admin"}
                    </Text>
                  </View>
                </View>

                <View style={styles.gameStatsGrid}>
                  <View style={styles.statItem}>
                    <Ionicons name="layers" size={24} color="#2196F3" />
                    <Text style={styles.statLabel}>Rounds</Text>
                    <Text style={styles.statValue}>
                      {rounds || gameSession?.number_of_rounds || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Ionicons name="speedometer" size={24} color="#FF9800" />
                    <Text style={styles.statLabel}>Difficulty</Text>
                    <Text style={styles.statValue}>
                      {difficulty || "Medium"}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Ionicons name="time" size={24} color="#9C27B0" />
                    <Text style={styles.statLabel}>Time Limit</Text>
                    <Text style={styles.statValue}>
                      {timeLimit ? `${timeLimit}m` : "10m"}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Ionicons name="diamond" size={24} color="#4CAF50" />
                    <Text style={styles.statLabel}>Rewards</Text>
                    <Text style={styles.statValueSmall}>
                      {rewards || "100 coins + 50 XP"}
                    </Text>
                  </View>
                </View>

                {adminInstructions &&
                  typeof adminInstructions === "string" &&
                  adminInstructions.trim() !== "" && (
                    <View style={styles.instructionsCard}>
                      <View style={styles.instructionsHeader}>
                        <Ionicons
                          name="information-circle"
                          size={20}
                          color="#2196F3"
                        />
                        <Text style={styles.instructionsTitle}>
                          Game Instructions
                        </Text>
                      </View>
                      <Text style={styles.instructionsText}>
                        {adminInstructions}
                      </Text>
                    </View>
                  )}
              </View>

              {/* Start Game Button */}
              <TouchableOpacity
                style={styles.primaryStartButton}
                onPress={handleStartGame}
              >
                <Ionicons name="play" size={24} color="#fff" />
                <Text style={styles.primaryStartButtonText}>Start Game</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    );
  };

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

          <Text style={styles.questionText}>
            Draw the correct symbol below:
          </Text>

          <View style={styles.canvasSection}>
            <View style={styles.canvasContainer}>
              <Canvas
                currentPath={currentPath}
                paths={paths}
                onGestureStart={handleGestureStart}
                onGestureEnd={handleGestureEnd}
              />

              {showSymbolFeedback && (
                <View style={styles.recognitionFeedback}>
                  <Text style={styles.recognizedSymbolText}>
                    Recognized: {recognizedSymbol}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.canvasControls}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearCanvas}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>

              <View style={styles.symbolHints}>
                <Text style={styles.hintsTitle}>Draw:</Text>
                <View style={styles.hintSymbols}>
                  <Text style={styles.hintSymbol}>{"<"}</Text>
                  <Text style={styles.hintLabel}>Less</Text>
                </View>
                <View style={styles.hintSymbols}>
                  <Text style={styles.hintSymbol}>{"="}</Text>
                  <Text style={styles.hintLabel}>Equal</Text>
                </View>
                <View style={styles.hintSymbols}>
                  <Text style={styles.hintSymbol}>{">"}</Text>
                  <Text style={styles.hintLabel}>Greater</Text>
                </View>
              </View>
            </View>
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

        {/* Add GameRecorder component with automatic recording */}
        {!gameCompleted && (
          <GameRecorder
            onRecordingComplete={handleRecordingComplete}
            maxDuration={5}
            autoStart={true}
            gameStarted={gameStarted && countdown === 0}
          />
        )}
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
  // New lobby styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: getResponsiveFontSize(16),
    marginTop: 16,
    fontWeight: "600",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderColor: "#4CAF50",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  successText: {
    color: "#4CAF50",
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    marginLeft: 12,
  },
  gameDetailsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  gameCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  gameCardTitleSection: {
    flex: 1,
    marginLeft: 16,
  },
  gameCardTitle: {
    color: "#fff",
    fontSize: getResponsiveFontSize(22),
    fontWeight: "bold",
    marginBottom: 4,
  },
  gameCardSubtitle: {
    color: "#888",
    fontSize: getResponsiveFontSize(14),
    fontWeight: "500",
  },
  gameStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statLabel: {
    color: "#888",
    fontSize: getResponsiveFontSize(12),
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    color: "#fff",
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
  },
  statValueSmall: {
    color: "#fff",
    fontSize: getResponsiveFontSize(12),
    fontWeight: "bold",
    textAlign: "center",
  },
  instructionsCard: {
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    borderColor: "#2196F3",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  howToPlayCard: {
    backgroundColor: "rgba(255, 211, 61, 0.1)",
    borderColor: "#ffd33d",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  howToPlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  howToPlayTitle: {
    color: "#ffd33d",
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    marginLeft: 8,
  },
  howToPlaySteps: {
    marginBottom: 12,
  },
  playStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffd33d",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    color: "#25292e",
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
  },
  stepText: {
    color: "#fff",
    fontSize: getResponsiveFontSize(16),
    fontWeight: "500",
    flex: 1,
  },
  practiceNote: {
    color: "#ffd33d",
    fontSize: getResponsiveFontSize(14),
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },
  primaryStartButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryStartButtonText: {
    color: "#fff",
    fontSize: getResponsiveFontSize(20),
    fontWeight: "bold",
    marginLeft: 8,
  },
  // Scroll styles
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: 16,
    paddingBottom: 32,
  },
  // Canvas styles
  canvasSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  canvasContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  recognitionFeedback: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  recognizedSymbolText: {
    color: "#4CAF50",
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    textAlign: "center",
  },
  canvasControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: getResponsiveFontSize(14),
    fontWeight: "600",
    marginLeft: 4,
  },
  symbolHints: {
    alignItems: "center",
  },
  hintsTitle: {
    color: "#888",
    fontSize: getResponsiveFontSize(12),
    fontWeight: "600",
    marginBottom: 8,
  },
  hintSymbols: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  hintSymbol: {
    color: "#ffd33d",
    fontSize: getResponsiveFontSize(20),
    fontWeight: "bold",
    marginRight: 6,
    minWidth: 24,
    textAlign: "center",
  },
  hintLabel: {
    color: "#ccc",
    fontSize: getResponsiveFontSize(12),
    fontWeight: "500",
  },
});
