import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface Round {
  round_number: number;
  first_number: number;
  second_number: number;
  user_symbol?: string;
  response_time?: number;
  is_correct?: boolean;
}

interface GameEngineProps {
  rounds: Round[];
  currentRoundIndex: number;
  onSymbolSelect: (symbol: string, responseTime: number) => void;
  gameStarted: boolean;
  isPaused: boolean;
  timeLimit?: number; // seconds per round
  showCorrectAnswer?: boolean;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
}

export default function GameEngine({
  rounds,
  currentRoundIndex,
  onSymbolSelect,
  gameStarted,
  isPaused,
  timeLimit = 30,
  showCorrectAnswer = false,
  difficulty,
}: GameEngineProps) {
  const [roundStartTime, setRoundStartTime] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [animationValue] = useState(new Animated.Value(0));
  const [numberAnimations] = useState({
    left: new Animated.Value(0),
    right: new Animated.Value(0),
  });

  const currentRound = rounds[currentRoundIndex];

  // Start round timer
  useEffect(() => {
    if (gameStarted && !isPaused && currentRound) {
      setRoundStartTime(Date.now());
      setTimeRemaining(timeLimit);
      setSelectedSymbol(null);

      // Animate numbers appearing
      Animated.parallel([
        Animated.spring(numberAnimations.left, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(numberAnimations.right, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
          delay: 200,
        }),
      ]).start();

      // Animate entrance
      Animated.spring(animationValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();
    }
  }, [currentRoundIndex, gameStarted, isPaused]);

  // Timer countdown
  useEffect(() => {
    if (!gameStarted || isPaused || selectedSymbol) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit with no answer
          handleSymbolPress("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, isPaused, selectedSymbol, currentRoundIndex]);

  const getCorrectSymbol = useCallback(() => {
    if (!currentRound) return "=";

    const { first_number, second_number } = currentRound;
    if (first_number > second_number) return ">";
    if (first_number < second_number) return "<";
    return "=";
  }, [currentRound]);

  const handleSymbolPress = useCallback(
    async (symbol: string) => {
      if (selectedSymbol || !currentRound) return;

      const responseTime =
        symbol === "timeout" ? timeLimit : (Date.now() - roundStartTime) / 1000;
      const finalSymbol = symbol === "timeout" ? "" : symbol;

      setSelectedSymbol(finalSymbol);

      // Haptic feedback
      if (symbol !== "timeout") {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
          // Fallback to vibration for older devices
          Vibration.vibrate(50);
        }
      }

      // Show feedback animation
      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Brief delay to show selection
      setTimeout(
        () => {
          onSymbolSelect(finalSymbol, responseTime);

          // Reset animations for next round
          numberAnimations.left.setValue(0);
          numberAnimations.right.setValue(0);
          animationValue.setValue(0);
        },
        symbol === "timeout" ? 0 : 500
      );
    },
    [selectedSymbol, currentRound, roundStartTime, timeLimit, onSymbolSelect]
  );

  const getSymbolButtonStyle = (symbol: string) => {
    const isSelected = selectedSymbol === symbol;
    const correctSymbol = getCorrectSymbol();
    const isCorrect = symbol === correctSymbol;

    let backgroundColor = "#2196F3";
    let borderColor = "#1976D2";

    if (isSelected) {
      backgroundColor = isCorrect ? "#4CAF50" : "#F44336";
      borderColor = isCorrect ? "#388E3C" : "#D32F2F";
    } else if (showCorrectAnswer && symbol === correctSymbol) {
      backgroundColor = "#4CAF50";
      borderColor = "#388E3C";
    }

    return {
      ...styles.symbolButton,
      backgroundColor,
      borderColor,
      opacity: isSelected ? 0.9 : 1,
      transform: [{ scale: isSelected ? 0.95 : 1 }],
    };
  };

  const getProgressColor = () => {
    const percentage = (timeRemaining / timeLimit) * 100;
    if (percentage > 60) return "#4CAF50";
    if (percentage > 30) return "#FF9800";
    return "#F44336";
  };

  const getDifficultyMultiplier = () => {
    switch (difficulty) {
      case "Easy":
        return 1.0;
      case "Medium":
        return 1.2;
      case "Hard":
        return 1.5;
      case "Expert":
        return 2.0;
      default:
        return 1.0;
    }
  };

  if (!currentRound) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Loading next round...</Text>
      </View>
    );
  }

  const progressPercentage = (timeRemaining / timeLimit) * 100;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              scale: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
          opacity: animationValue,
        },
      ]}
    >
      {/* Timer and Progress */}
      <View style={styles.timerContainer}>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progressPercentage}%`,
                backgroundColor: getProgressColor(),
              },
            ]}
          />
        </View>
        <Text style={[styles.timerText, { color: getProgressColor() }]}>
          {timeRemaining}s
        </Text>
      </View>

      {/* Round Info */}
      <View style={styles.roundInfoContainer}>
        <Text style={styles.roundNumber}>
          Round {currentRound.round_number}
        </Text>
        <Text style={styles.difficultyText}>{difficulty} Mode</Text>
      </View>

      {/* Numbers Display */}
      <View style={styles.numbersContainer}>
        <Animated.View
          style={[
            styles.numberContainer,
            {
              transform: [
                {
                  translateX: numberAnimations.left.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
                { scale: numberAnimations.left },
              ],
            },
          ]}
        >
          <Text style={styles.number}>{currentRound.first_number}</Text>
        </Animated.View>

        <View style={styles.symbolPlaceholder}>
          <Text style={styles.questionMark}>?</Text>
        </View>

        <Animated.View
          style={[
            styles.numberContainer,
            {
              transform: [
                {
                  translateX: numberAnimations.right.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
                { scale: numberAnimations.right },
              ],
            },
          ]}
        >
          <Text style={styles.number}>{currentRound.second_number}</Text>
        </Animated.View>
      </View>

      {/* Symbol Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={getSymbolButtonStyle("<")}
          onPress={() => handleSymbolPress("<")}
          disabled={!!selectedSymbol}
          activeOpacity={0.8}
        >
          <Text style={styles.symbolText}>{"<"}</Text>
          <Text style={styles.symbolLabel}>Less Than</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={getSymbolButtonStyle("=")}
          onPress={() => handleSymbolPress("=")}
          disabled={!!selectedSymbol}
          activeOpacity={0.8}
        >
          <Text style={styles.symbolText}>{"="}</Text>
          <Text style={styles.symbolLabel}>Equal To</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={getSymbolButtonStyle(">")}
          onPress={() => handleSymbolPress(">")}
          disabled={!!selectedSymbol}
          activeOpacity={0.8}
        >
          <Text style={styles.symbolText}>{">"}</Text>
          <Text style={styles.symbolLabel}>Greater Than</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <Text style={styles.instructionText}>
        Choose the correct symbol to compare the numbers
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  timerContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
    transition: "width 1s ease-in-out",
  },
  timerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  roundInfoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  roundNumber: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  difficultyText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  numbersContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  numberContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    minWidth: 80,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  number: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2196F3",
  },
  symbolPlaceholder: {
    backgroundColor: "#FFF3E0",
    padding: 20,
    borderRadius: 15,
    minWidth: 60,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF9800",
    borderStyle: "dashed",
  },
  questionMark: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FF9800",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  symbolButton: {
    backgroundColor: "#2196F3",
    padding: 20,
    borderRadius: 15,
    minWidth: 90,
    alignItems: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  symbolText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  symbolLabel: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  instructionText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  waitingText: {
    textAlign: "center",
    fontSize: 18,
    color: "#666",
    fontWeight: "500",
  },
});
