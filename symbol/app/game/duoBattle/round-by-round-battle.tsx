import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { battleAPI } from "../../../services/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface BattleRound {
  round_number: number;
  symbols: string[];
  correct_answer: string;
  creator_answer?: string;
  opponent_answer?: string;
  creator_time?: number;
  opponent_time?: number;
  creator_correct?: boolean;
  opponent_correct?: boolean;
  creator_points?: number;
  opponent_points?: number;
}

interface BattleSession {
  id: number;
  battle_code: string;
  number_of_rounds: number;
  time_limit: number;
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
  rounds: BattleRound[];
  current_round: number;
  is_completed: boolean;
  created_at: string;
  completed_at?: string;
  progress?: {
    total_rounds: number;
    completed_rounds: number;
    progress_percentage: number;
  };
}

export default function RoundByRoundBattleScreen() {
  const params = useLocalSearchParams();
  const battleId = params.battleId as string;

  const [battleSession, setBattleSession] = useState<BattleSession | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  useEffect(() => {
    if (battleId) {
      loadBattleSession();
    }
  }, [battleId]);

  const loadBattleSession = async () => {
    try {
      setLoading(true);
      const response = await battleAPI.getBattleSession(battleId);

      if (response && response.battle_session) {
        setBattleSession(response.battle_session);
      }
    } catch (error) {
      console.error("Error loading battle session:", error);
      Alert.alert("Error", "Failed to load battle details. Returning to menu.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBattleSession();
    setRefreshing(false);
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const getPerformanceColor = (isCorrect?: boolean, time?: number) => {
    if (isCorrect === undefined) return "#666";
    if (!isCorrect) return "#F44336";

    if (!time) return "#4CAF50";
    if (time <= 5) return "#4CAF50"; // Excellent
    if (time <= 10) return "#FF9800"; // Good
    return "#FFC107"; // Average
  };

  const getPerformanceText = (isCorrect?: boolean, time?: number) => {
    if (isCorrect === undefined) return "Not answered";
    if (!isCorrect) return "Wrong";

    if (!time) return "Correct";
    if (time <= 5) return "Excellent!";
    if (time <= 10) return "Good";
    return "Correct";
  };

  const renderRoundItem = ({
    item,
    index,
  }: {
    item: BattleRound;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.roundCard,
        selectedRound === item.round_number && styles.selectedRoundCard,
      ]}
      onPress={() =>
        setSelectedRound(
          selectedRound === item.round_number ? null : item.round_number
        )
      }
    >
      <View style={styles.roundHeader}>
        <Text style={styles.roundNumber}>Round {item.round_number}</Text>
        <TouchableOpacity style={styles.expandButton}>
          <Ionicons
            name={
              selectedRound === item.round_number
                ? "chevron-up"
                : "chevron-down"
            }
            size={20}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.roundResults}>
        <View style={styles.playerResult}>
          <Image
            source={{
              uri:
                battleSession?.creator?.avatar ||
                "https://i.pravatar.cc/100?img=1",
            }}
            style={styles.roundAvatar}
          />
          <View style={styles.resultInfo}>
            <Text style={styles.playerName}>
              {battleSession?.creator?.username || "Unknown"}
            </Text>
            <View style={styles.performanceContainer}>
              <View
                style={[
                  styles.performanceDot,
                  {
                    backgroundColor: getPerformanceColor(
                      item.creator_correct,
                      item.creator_time
                    ),
                  },
                ]}
              />
              <Text style={styles.performanceText}>
                {getPerformanceText(item.creator_correct, item.creator_time)}
              </Text>
            </View>
            <Text style={styles.timeText}>{formatTime(item.creator_time)}</Text>
          </View>
        </View>

        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>
              {item.creator_points || 0} - {item.opponent_points || 0}
            </Text>
          </View>
        </View>

        <View style={styles.playerResult}>
          <View style={styles.resultInfo}>
            <Text style={styles.playerName}>
              {battleSession?.opponent?.username}
            </Text>
            <View style={styles.performanceContainer}>
              <View
                style={[
                  styles.performanceDot,
                  {
                    backgroundColor: getPerformanceColor(
                      item.opponent_correct,
                      item.opponent_time
                    ),
                  },
                ]}
              />
              <Text style={styles.performanceText}>
                {getPerformanceText(item.opponent_correct, item.opponent_time)}
              </Text>
            </View>
            <Text style={styles.timeText}>
              {formatTime(item.opponent_time)}
            </Text>
          </View>
          <Image
            source={{ uri: battleSession?.opponent?.avatar }}
            style={styles.roundAvatar}
          />
        </View>
      </View>

      {selectedRound === item.round_number && (
        <View style={styles.roundDetails}>
          <Text style={styles.detailsTitle}>Round Details</Text>

          <View style={styles.symbolsContainer}>
            <Text style={styles.symbolsTitle}>Symbols:</Text>
            <View style={styles.symbolsGrid}>
              {item.symbols?.map((symbol, idx) => (
                <View key={idx} style={styles.symbolCard}>
                  <Text style={styles.symbolText}>{symbol}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.answersContainer}>
            <Text style={styles.answersTitle}>Answers:</Text>
            <View style={styles.answersRow}>
              <View style={styles.answerItem}>
                <Text style={styles.answerLabel}>Correct:</Text>
                <View
                  style={[styles.answerBadge, { backgroundColor: "#4CAF50" }]}
                >
                  <Text style={styles.answerText}>{item.correct_answer}</Text>
                </View>
              </View>

              <View style={styles.answerItem}>
                <Text style={styles.answerLabel}>
                  {battleSession?.creator?.username || "Unknown"}:
                </Text>
                <View
                  style={[
                    styles.answerBadge,
                    {
                      backgroundColor: item.creator_correct
                        ? "#4CAF50"
                        : "#F44336",
                    },
                  ]}
                >
                  <Text style={styles.answerText}>
                    {item.creator_answer || "No answer"}
                  </Text>
                </View>
              </View>

              <View style={styles.answerItem}>
                <Text style={styles.answerLabel}>
                  {battleSession?.opponent?.username}:
                </Text>
                <View
                  style={[
                    styles.answerBadge,
                    {
                      backgroundColor: item.opponent_correct
                        ? "#4CAF50"
                        : "#F44336",
                    },
                  ]}
                >
                  <Text style={styles.answerText}>
                    {item.opponent_answer || "No answer"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderBattleHeader = () => (
    <View style={styles.battleHeader}>
      <View style={styles.battleInfo}>
        <Text style={styles.battleCode}>{battleSession?.battle_code}</Text>
        <Text style={styles.battleStatus}>
          {battleSession?.is_completed ? "Completed" : "In Progress"}
        </Text>
      </View>

      <View style={styles.battleProgress}>
        <Text style={styles.progressText}>
          {battleSession?.progress?.completed_rounds || 0} /{" "}
          {battleSession?.number_of_rounds} rounds
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${battleSession?.progress?.progress_percentage || 0}%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.playersHeader}>
        <View style={styles.playerHeaderInfo}>
          <Image
            source={{
              uri:
                battleSession?.creator?.avatar ||
                "https://i.pravatar.cc/100?img=1",
            }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerPlayerName}>
              {battleSession?.creator?.username || "Unknown"}
            </Text>
            <Text style={styles.headerPlayerLevel}>
              Level {battleSession?.creator?.current_level || 1}
            </Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            {battleSession?.creator_score} - {battleSession?.opponent_score}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(battleSession?.creator_total_time)} -{" "}
            {formatTime(battleSession?.opponent_total_time)}
          </Text>
        </View>

        <View style={styles.playerHeaderInfo}>
          <View style={styles.rightAligned}>
            <Text style={styles.headerPlayerName}>
              {battleSession?.opponent?.username || "Waiting..."}
            </Text>
            <Text style={styles.headerPlayerLevel}>
              Level {battleSession?.opponent?.current_level || "--"}
            </Text>
          </View>
          <Image
            source={{
              uri:
                battleSession?.opponent?.avatar ||
                "https://i.pravatar.cc/100?img=1",
            }}
            style={styles.headerAvatar}
          />
        </View>
      </View>

      {battleSession?.is_completed && battleSession?.winner && (
        <View style={styles.winnerContainer}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <Text style={styles.winnerText}>
            {battleSession.winner.username} wins!
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>Loading battle details...</Text>
      </View>
    );
  }

  if (!battleSession) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorTitle}>Battle Not Found</Text>
        <Text style={styles.errorDescription}>
          The battle session could not be loaded.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Battle Analysis</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Ionicons
            name="refresh"
            size={24}
            color={refreshing ? "#666" : "#E91E63"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderBattleHeader()}

        <View style={styles.roundsSection}>
          <Text style={styles.sectionTitle}>Round by Round</Text>

          {battleSession.rounds && battleSession.rounds.length > 0 ? (
            <FlatList
              data={battleSession.rounds}
              renderItem={renderRoundItem}
              keyExtractor={(item) => item.round_number.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.roundsList}
            />
          ) : (
            <View style={styles.emptyRounds}>
              <Ionicons name="time" size={48} color="#666" />
              <Text style={styles.emptyTitle}>No Rounds Yet</Text>
              <Text style={styles.emptyDescription}>
                Rounds will appear here as the battle progresses.
              </Text>
            </View>
          )}
        </View>

        {battleSession.is_completed && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.newBattleButton}
              onPress={() => router.push("/game/duoBattle/battleMenu")}
            >
              <Text style={styles.buttonText}>New Battle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => router.push("/(tabs)/home")}
            >
              <Text style={[styles.buttonText, styles.homeButtonText]}>
                Home
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  headerBackButton: {
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
  content: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  errorDescription: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#E91E63",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Battle Header Styles
  battleHeader: {
    backgroundColor: "#1a1a1a",
    margin: 20,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  battleInfo: {
    alignItems: "center",
    gap: 4,
  },
  battleCode: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E91E63",
    fontFamily: "monospace",
  },
  battleStatus: {
    fontSize: 14,
    color: "#888",
  },
  battleProgress: {
    gap: 8,
  },
  progressText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E91E63",
  },
  playersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rightAligned: {
    alignItems: "flex-end",
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  headerPlayerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  headerPlayerLevel: {
    fontSize: 12,
    color: "#888",
  },
  scoreContainer: {
    alignItems: "center",
    gap: 4,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E91E63",
  },
  timeText: {
    fontSize: 12,
    color: "#888",
  },
  winnerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  winnerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
  },
  // Rounds Section Styles
  roundsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  roundsList: {
    gap: 12,
  },
  roundCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedRoundCard: {
    borderColor: "#E91E63",
  },
  roundHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  roundNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E91E63",
  },
  expandButton: {
    padding: 4,
  },
  roundResults: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  roundAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  resultInfo: {
    gap: 2,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  performanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  performanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  performanceText: {
    fontSize: 12,
    color: "#888",
  },
  vsContainer: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
  },
  pointsContainer: {
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pointsText: {
    fontSize: 12,
    color: "#E91E63",
    fontWeight: "bold",
  },
  // Round Details Styles
  roundDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
    gap: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  symbolsContainer: {
    gap: 8,
  },
  symbolsTitle: {
    fontSize: 14,
    color: "#888",
  },
  symbolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  symbolCard: {
    width: 40,
    height: 40,
    backgroundColor: "#333",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolText: {
    fontSize: 16,
    color: "#fff",
  },
  answersContainer: {
    gap: 8,
  },
  answersTitle: {
    fontSize: 14,
    color: "#888",
  },
  answersRow: {
    gap: 8,
  },
  answerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  answerLabel: {
    fontSize: 14,
    color: "#ccc",
    flex: 1,
  },
  answerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  answerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  emptyRounds: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ccc",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    maxWidth: 240,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  newBattleButton: {
    flex: 1,
    backgroundColor: "#E91E63",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  homeButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#E91E63",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  homeButtonText: {
    color: "#E91E63",
  },
});
