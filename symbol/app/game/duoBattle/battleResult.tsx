import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { battleAPI } from "../../../services/api";

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
  winner_id?: number;
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

export default function BattleResultScreen() {
  const params = useLocalSearchParams();
  const battleId = params.battleId as string;
  const currentUserId = parseInt(params.currentUserId as string) || 0;

  const [battleSession, setBattleSession] = useState<BattleSession | null>(
    null
  );
  const [creator, setCreator] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [rounds, setRounds] = useState<BattleRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualCurrentUserId, setActualCurrentUserId] = useState<number | null>(
    null
  );
  const [userIdInitialized, setUserIdInitialized] = useState(false);

  useEffect(() => {
    if (battleId) {
      initializeUserAndLoadResults();
    }
  }, [battleId]);

  const initializeUserAndLoadResults = async () => {
    try {
      // First, ensure we have a valid user ID
      let validUserId = currentUserId;

      if (!validUserId || validUserId === 0) {
        console.log(
          "⚠️ Invalid currentUserId from params, fetching from storage"
        );
        try {
          const { userAPI } = await import("../../../services/api");
          const userData = await userAPI.getStoredUserData();
          if (userData && userData.id) {
            validUserId = userData.id;
            console.log("✅ Retrieved user ID from storage:", validUserId);
          }
        } catch (error) {
          console.log("❌ Could not determine current user ID:", error);
        }
      }

      setActualCurrentUserId(validUserId);
      setUserIdInitialized(true);

      // Now load battle results
      await loadBattleResults();
    } catch (error) {
      console.error("❌ Error initializing user and loading results:", error);
      setLoading(false);
      setUserIdInitialized(true);
    }
  };

  const loadBattleResults = async () => {
    try {
      setLoading(true);
      console.log("🔄 Loading battle results for battle ID:", battleId);
      console.log(
        "🎯 Current User ID (from params):",
        currentUserId,
        typeof currentUserId
      );

      const response = await battleAPI.getBattleSession(battleId);
      console.log("✅ Battle results loaded:", response);

      if (response && response.battle_session) {
        const session = response.battle_session;
        setBattleSession(session);
        setCreator(response.creator);
        setOpponent(response.opponent);
        setRounds(response.rounds || []);

        console.log(
          "🏆 Winner determination - session.winner_id:",
          session.winner_id,
          typeof session.winner_id
        );
        console.log(
          "👑 Creator ID:",
          response.creator?.id,
          typeof response.creator?.id
        );
        console.log(
          "⚔️ Opponent ID:",
          response.opponent?.id,
          typeof response.opponent?.id
        );

        // First try to use the winner from response if it exists
        if (response.winner) {
          console.log("🎖️ Using winner from response:", response.winner);
          setWinner(response.winner);
        }
        // Then check winner_id from session
        else if (session.winner_id) {
          console.log(
            "🔍 Determining winner from session.winner_id:",
            session.winner_id
          );
          if (session.winner_id === response.creator?.id) {
            console.log("✅ Winner is creator:", response.creator);
            setWinner(response.creator);
          } else if (session.winner_id === response.opponent?.id) {
            console.log("✅ Winner is opponent:", response.opponent);
            setWinner(response.opponent);
          } else {
            console.log("❌ Winner ID doesn't match any player");
            setWinner(null);
          }
        } else {
          console.log("🤔 No winner_id, using score-based determination");
          // Fallback: determine winner based on scores
          const creatorScore = session.creator_score || 0;
          const opponentScore = session.opponent_score || 0;

          console.log(
            "📊 Scores - Creator:",
            creatorScore,
            "Opponent:",
            opponentScore
          );

          if (creatorScore > opponentScore) {
            console.log("🏆 Creator wins by score");
            setWinner(response.creator);
          } else if (opponentScore > creatorScore) {
            console.log("🏆 Opponent wins by score");
            setWinner(response.opponent);
          } else {
            console.log("🤝 It's a tie");
            setWinner(null);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error loading battle results:", error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>
          {!userIdInitialized
            ? "Initializing user..."
            : "Loading battle results..."}
        </Text>
      </View>
    );
  }

  const renderResultScreen = () => {
    const effectiveUserId = actualCurrentUserId || currentUserId;
    const userWon = winner?.id === effectiveUserId;
    const isTie = !winner;

    // Enhanced Debug logging
    console.log("🏆 Battle Result Debug:", {
      currentUserId,
      actualCurrentUserId,
      effectiveUserId,
      currentUserIdType: typeof currentUserId,
      actualUserIdType: typeof actualCurrentUserId,
      winner: winner
        ? { id: winner.id, username: winner.username, idType: typeof winner.id }
        : null,
      userWon,
      isTie,
      comparison: winner
        ? `${winner.id} === ${effectiveUserId} = ${
            winner.id === effectiveUserId
          }`
        : "No winner",
      battleSession: battleSession
        ? {
            creator_score: battleSession.creator_score,
            opponent_score: battleSession.opponent_score,
            winner_id: battleSession.winner_id,
          }
        : null,
      creator: creator ? { id: creator.id, username: creator.username } : null,
      opponent: opponent
        ? { id: opponent.id, username: opponent.username }
        : null,
    });

    // Additional validation check
    if (!effectiveUserId || effectiveUserId === 0) {
      console.error(
        "❌ No valid user ID available - this will cause comparison issues"
      );
      return (
        <View style={styles.completedContainer}>
          <Text style={styles.resultTitle}>Error loading results</Text>
          <Text style={styles.resultSubtitle}>
            Unable to determine current user. Please log in again.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(auth)/Auth")}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      );
    }

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
              ✅ {battleSession?.creator_correct_answers || 0}/{rounds.length}{" "}
              correct
            </Text>
            <Text style={styles.finalPlayerDetails}>
              ❌{" "}
              {battleSession?.creator_error_count ||
                rounds.length -
                  (battleSession?.creator_correct_answers || 0)}{" "}
              errors
            </Text>
            <Text style={styles.finalPlayerTime}>
              ⏱️ {formatTime(battleSession?.creator_total_time || 0)}
            </Text>
          </View>

          <View style={styles.finalPlayerScore}>
            <Text style={styles.finalPlayerName}>{opponent?.username}</Text>
            <Text style={styles.finalPlayerPoints}>
              {battleSession?.opponent_score || 0}
            </Text>
            <Text style={styles.finalPlayerDetails}>
              ✅ {battleSession?.opponent_correct_answers || 0}/{rounds.length}{" "}
              correct
            </Text>
            <Text style={styles.finalPlayerDetails}>
              ❌{" "}
              {battleSession?.opponent_error_count ||
                rounds.length -
                  (battleSession?.opponent_correct_answers || 0)}{" "}
              errors
            </Text>
            <Text style={styles.finalPlayerTime}>
              ⏱️ {formatTime(battleSession?.opponent_total_time || 0)}
            </Text>
          </View>
        </View>

        {/* Time Comparison */}
        <View style={styles.timeComparisonContainer}>
          <Text style={styles.timeComparisonTitle}>⏱️ Speed Analysis</Text>
          <View style={styles.timeComparisonStats}>
            <View style={styles.timeStatItem}>
              <Text style={styles.timeStatLabel}>Fastest Completion</Text>
              <Text style={styles.timeStatValue}>
                {(battleSession?.creator_total_time || 0) <
                (battleSession?.opponent_total_time || 0)
                  ? creator?.username
                  : opponent?.username}{" "}
                -{" "}
                {formatTime(
                  Math.min(
                    battleSession?.creator_total_time || 0,
                    battleSession?.opponent_total_time || 0
                  )
                )}
              </Text>
            </View>
            <View style={styles.timeStatItem}>
              <Text style={styles.timeStatLabel}>Time Difference</Text>
              <Text style={styles.timeStatValue}>
                {formatTime(
                  Math.abs(
                    (battleSession?.creator_total_time || 0) -
                      (battleSession?.opponent_total_time || 0)
                  )
                )}
              </Text>
            </View>
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      {renderResultScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
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
  finalPlayerTime: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 4,
    fontWeight: "500",
  },
  // Time Comparison Styles
  timeComparisonContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    width: "100%",
  },
  timeComparisonTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  timeComparisonStats: {
    gap: 12,
  },
  timeStatItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  timeStatLabel: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  timeStatValue: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
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
  backButton: {
    backgroundColor: "#E91E63",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
