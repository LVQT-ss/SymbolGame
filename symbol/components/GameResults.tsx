import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { width: screenWidth } = Dimensions.get("window");

interface RoundResult {
  round_number: number;
  first_number: number;
  second_number: number;
  user_symbol: string;
  correct_symbol: string;
  is_correct: boolean;
  response_time: number;
}

interface GameStats {
  totalRounds: number;
  correctAnswers: number;
  totalTime: number;
  averageTime: number;
  accuracy: number;
  score: number;
  difficulty: string;
  experienceGained?: number;
  coinsEarned?: number;
  newAchievements?: Achievement[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

interface GameResultsProps {
  gameStats: GameStats;
  roundResults: RoundResult[];
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onViewLeaderboard: () => void;
  showDetailedResults?: boolean;
}

export default function GameResults({
  gameStats,
  roundResults,
  onPlayAgain,
  onBackToMenu,
  onViewLeaderboard,
  showDetailedResults = true,
}: GameResultsProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Celebrate if high accuracy
    if (gameStats.accuracy >= 90) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  }, []);

  const getPerformanceLevel = () => {
    const { accuracy } = gameStats;
    if (accuracy >= 95)
      return { level: "Perfect!", color: "#FFD700", icon: "trophy" };
    if (accuracy >= 85)
      return { level: "Excellent!", color: "#4CAF50", icon: "star" };
    if (accuracy >= 75)
      return { level: "Great!", color: "#2196F3", icon: "thumbs-up" };
    if (accuracy >= 60)
      return { level: "Good!", color: "#FF9800", icon: "checkmark-circle" };
    return { level: "Keep Trying!", color: "#F44336", icon: "refresh" };
  };

  const getTimeRating = () => {
    const avgTime = gameStats.averageTime;
    if (avgTime <= 2)
      return { rating: "Lightning Fast!", color: "#FFD700", icon: "flash" };
    if (avgTime <= 4)
      return { rating: "Very Quick!", color: "#4CAF50", icon: "timer" };
    if (avgTime <= 6)
      return { rating: "Good Pace", color: "#2196F3", icon: "time" };
    if (avgTime <= 10)
      return { rating: "Steady", color: "#FF9800", icon: "hourglass" };
    return { rating: "Take Your Time", color: "#F44336", icon: "pause" };
  };

  const shareResults = async () => {
    try {
      const message =
        `🎮 I just completed a Symbol Game!\n\n` +
        `📊 Score: ${gameStats.score}\n` +
        `🎯 Accuracy: ${gameStats.accuracy}%\n` +
        `⏱️ Average Time: ${gameStats.averageTime.toFixed(1)}s\n` +
        `🏆 Difficulty: ${gameStats.difficulty}\n\n` +
        `Can you beat my score? 🤔`;

      await Share.share({
        message,
        title: "Symbol Game Results",
      });
    } catch (error) {
      Alert.alert("Error", "Unable to share results");
    }
  };

  const performance = getPerformanceLevel();
  const timeRating = getTimeRating();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons
            name={performance.icon as any}
            size={60}
            color={performance.color}
          />
          <Text style={[styles.performanceText, { color: performance.color }]}>
            {performance.level}
          </Text>
          <Text style={styles.gameCompleteText}>Game Complete!</Text>
        </View>

        {/* Main Stats */}
        <View style={styles.mainStatsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{gameStats.score}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{gameStats.accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {gameStats.correctAnswers}/{gameStats.totalRounds}
            </Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
        </View>

        {/* Detailed Stats */}
        <View style={styles.detailedStatsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="flash" size={24} color={timeRating.color} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Speed Rating</Text>
              <Text style={[styles.detailValue, { color: timeRating.color }]}>
                {timeRating.rating}
              </Text>
            </View>
            <Text style={styles.detailNumber}>
              {gameStats.averageTime.toFixed(1)}s avg
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={24} color="#666" />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Total Time</Text>
              <Text style={styles.detailValue}>
                {Math.floor(gameStats.totalTime / 60)}m{" "}
                {Math.floor(gameStats.totalTime % 60)}s
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Difficulty</Text>
              <Text style={styles.detailValue}>
                {gameStats.difficulty} Mode
              </Text>
            </View>
          </View>

          {gameStats.experienceGained && (
            <View style={styles.detailRow}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Experience Gained</Text>
                <Text style={[styles.detailValue, { color: "#FFD700" }]}>
                  +{gameStats.experienceGained} XP
                </Text>
              </View>
            </View>
          )}

          {gameStats.coinsEarned && (
            <View style={styles.detailRow}>
              <Ionicons name="logo-bitcoin" size={24} color="#FF9800" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Coins Earned</Text>
                <Text style={[styles.detailValue, { color: "#FF9800" }]}>
                  +{gameStats.coinsEarned}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Achievements */}
        {gameStats.newAchievements && gameStats.newAchievements.length > 0 && (
          <View style={styles.achievementsContainer}>
            <Text style={styles.achievementsTitle}>🏆 New Achievements!</Text>
            {gameStats.newAchievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                </View>
                <Text style={styles.achievementPoints}>
                  +{achievement.points}pts
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Round by Round Details */}
        {showDetailedResults && (
          <View style={styles.roundDetailsContainer}>
            <TouchableOpacity
              style={styles.toggleDetailsButton}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Text style={styles.toggleDetailsText}>
                {showDetails ? "Hide" : "Show"} Round Details
              </Text>
              <Ionicons
                name={showDetails ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>

            {showDetails && (
              <View style={styles.roundsList}>
                {roundResults.map((round) => (
                  <View key={round.round_number} style={styles.roundItem}>
                    <View style={styles.roundNumber}>
                      <Text style={styles.roundNumberText}>
                        {round.round_number}
                      </Text>
                    </View>

                    <View style={styles.roundContent}>
                      <Text style={styles.roundQuestion}>
                        {round.first_number} {round.user_symbol || "?"}{" "}
                        {round.second_number}
                      </Text>
                      <Text style={styles.roundCorrect}>
                        Correct: {round.first_number} {round.correct_symbol}{" "}
                        {round.second_number}
                      </Text>
                      <Text style={styles.roundTime}>
                        {round.response_time.toFixed(1)}s
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        round.is_correct ? "checkmark-circle" : "close-circle"
                      }
                      size={24}
                      color={round.is_correct ? "#4CAF50" : "#F44336"}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={onPlayAgain}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Play Again</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={shareResults}
            >
              <Ionicons name="share-social" size={18} color="#2196F3" />
              <Text style={styles.secondaryButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onViewLeaderboard}
            >
              <Ionicons name="trophy" size={18} color="#2196F3" />
              <Text style={styles.secondaryButtonText}>Leaderboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onBackToMenu}
            >
              <Ionicons name="home" size={18} color="#2196F3" />
              <Text style={styles.secondaryButtonText}>Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    paddingVertical: 20,
  },
  performanceText: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  gameCompleteText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "500",
  },
  mainStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    minWidth: 90,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailedStatsContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailInfo: {
    flex: 1,
    marginLeft: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  detailNumber: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  achievementsContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    color: "#666",
  },
  achievementPoints: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  roundDetailsContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  toggleDetailsText: {
    fontSize: 16,
    color: "#666",
    marginRight: 5,
  },
  roundsList: {
    marginTop: 15,
  },
  roundItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  roundNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  roundNumberText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  roundContent: {
    flex: 1,
  },
  roundQuestion: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  roundCorrect: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  roundTime: {
    fontSize: 12,
    color: "#999",
  },
  buttonsContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2196F3",
    flex: 1,
    marginHorizontal: 5,
  },
  secondaryButtonText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});
