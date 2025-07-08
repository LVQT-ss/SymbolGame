import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  Modal,
} from "react-native";
import { gameAPI, userAPI } from "../../services/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isLargeScreen = screenWidth >= 1024;

const getResponsiveDimensions = () => {
  const width = Dimensions.get("window").width;
  const height = Dimensions.get("window").height;

  return {
    isPortrait: height > width,
    isTablet: width >= 768,
    isLargeScreen: width >= 1024,
    screenWidth: width,
    screenHeight: height,
  };
};

const getResponsivePadding = () => {
  const { isTablet, isLargeScreen } = getResponsiveDimensions();
  if (isLargeScreen) return 32;
  if (isTablet) return 24;
  return 20;
};

const getResponsiveFontSize = (baseSize: number) => {
  const { isTablet, isLargeScreen } = getResponsiveDimensions();
  if (isLargeScreen) return baseSize * 1.4;
  if (isTablet) return baseSize * 1.2;
  return baseSize;
};

interface GameSession {
  id: number;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  maxPlayers: number;
  currentPlayers: number;
  timeLimit: number;
  reward: {
    coins: number;
    experience: number;
  };
  isJoined: boolean;
  createdBy: {
    id: string;
    username: string;
    avatar: string;
  };
  startTime: string;
  status: "waiting" | "active" | "completed";
  category: string;
}

interface GameStats {
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number; // in minutes
  favoriteCategory: string;
}

interface GameHistoryDetails {
  id: number;
  user_id: number;
  difficulty_level: number;
  number_of_rounds: number;
  total_time: number;
  correct_answers: number;
  score: number;
  completed: boolean;
  completed_at: string;
  created_at: string;
  rounds: Array<{
    round_number: number;
    first_number: number;
    second_number: number;
    correct_symbol: string;
    user_symbol: string;
    response_time: number;
    is_correct: boolean;
  }>;
  accuracy: number;
}

export default function GameMenuScreen() {
  const [dimensions, setDimensions] = useState(getResponsiveDimensions());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "stats">(
    "available"
  );

  // Data states
  const [availableGames, setAvailableGames] = useState<GameSession[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalGamesPlayed: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    totalScore: 0,
    averageScore: 0,
    bestScore: 0,
    totalTimeSpent: 0,
    favoriteCategory: "Symbol Match",
  });

  const [userProfile, setUserProfile] = useState({
    username: "Player",
    avatar: "https://i.pravatar.cc/100?img=1",
    level: 1,
    coins: 0,
    experience: 0,
  });

  // Game History Modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedGameHistory, setSelectedGameHistory] = useState<
    GameHistoryDetails[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  useEffect(() => {
    loadAllData();

    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(getResponsiveDimensions());
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAvailableGames(),
        loadGameStats(),
        loadUserProfile(),
      ]);
    } catch (error) {
      console.error("Error loading game menu data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await userAPI.getStoredUserData();
      if (profile) {
        setUserProfile({
          username: profile.username || "Player",
          avatar: profile.avatar || "https://i.pravatar.cc/100?img=1",
          level: profile.current_level || profile.level || 1,
          coins: profile.coins || 0,
          experience: profile.experience_points || profile.experience || 0,
        });
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadAvailableGames = async () => {
    try {
      const response = await gameAPI.getAvailableGames(1, 20);

      console.log("=== API RESPONSE FOR AVAILABLE GAMES ===");
      console.log("Response:", JSON.stringify(response, null, 2));

      // Check if API returned data in the expected format
      if (
        response &&
        response.available_games &&
        Array.isArray(response.available_games)
      ) {
        console.log("✅ Using real API data");

        if (response.available_games.length === 0) {
          console.log("⚠️ No available games found from API");
          Alert.alert(
            "No Games Available",
            "There are currently no available games to join. Please check back later or contact an administrator to create new games.",
            [{ text: "OK" }]
          );
          setAvailableGames([]); // Set empty array when no games
          return;
        }

        // Map API response to frontend interface
        const mappedGames: GameSession[] = response.available_games.map(
          (game: any) => {
            // Extract time limit in seconds (convert from "10 minutes" to 600 seconds)
            const timeLimitText = game.time_limit || "10 minutes per session";
            const timeLimitMinutes = parseInt(
              timeLimitText.match(/\d+/)?.[0] || "10"
            );
            const timeLimitSeconds = timeLimitMinutes * 60;

            // Map difficulty based on number of rounds
            let difficulty: "Easy" | "Medium" | "Hard" | "Expert" = "Easy";
            if (game.number_of_rounds >= 20) difficulty = "Expert";
            else if (game.number_of_rounds >= 15) difficulty = "Hard";
            else if (game.number_of_rounds >= 10) difficulty = "Medium";

            // Calculate rewards based on rounds and difficulty
            const baseCoins = game.number_of_rounds * 10;
            const baseExperience = game.number_of_rounds * 5;

            // Check if user is already assigned to this game
            const isUserAssigned =
              game.progress?.is_user_assigned || game.status === "joined";
            const isAssignedToSomeone =
              game.progress?.is_assigned_to_someone || false;

            return {
              id: parseInt(game.id) || 1,
              title: `Math Challenge Session ${game.id}`,
              description:
                game.admin_instructions ||
                "Complete mathematical symbol comparison challenges",
              difficulty,
              maxPlayers: 1, // Each game session is for one player
              currentPlayers: isAssignedToSomeone ? 1 : 0,
              timeLimit: timeLimitSeconds,
              reward: {
                coins: baseCoins,
                experience: baseExperience,
              },
              isJoined: isUserAssigned,
              createdBy: {
                id: game.created_by.id.toString(),
                username: game.created_by.username,
                avatar: `https://i.pravatar.cc/100?img=${game.created_by.id}`,
              },
              startTime: game.created_at,
              status: isUserAssigned ? "active" : "waiting",
              category: "Symbol Match",
            };
          }
        );

        setAvailableGames(mappedGames);
        console.log("Mapped games:", mappedGames);
      } else {
        console.error(
          "❌ API response doesn't have expected format:",
          response
        );
        Alert.alert(
          "Data Error",
          "Server returned unexpected data format. Please try again or contact support.",
          [{ text: "OK" }]
        );
        setAvailableGames([]); // Set empty array on format error
      }
    } catch (error: any) {
      console.error("❌ Error loading available games:", error);

      Alert.alert(
        "Connection Error",
        `Failed to load games: ${
          error.message || "Network error"
        }. Please check your connection and try again.`,
        [{ text: "Retry", onPress: () => loadAvailableGames() }, { text: "OK" }]
      );

      setAvailableGames([]); // Set empty array on error
    }
  };

  const loadGameStats = async () => {
    try {
      const response = await gameAPI.getGameStats();

      // If API doesn't return expected format, create mock data
      if (!response) {
        const mockStats: GameStats = {
          totalGamesPlayed: 156,
          totalWins: 98,
          totalLosses: 45,
          winRate: 62.8,
          totalScore: 245680,
          averageScore: 1575,
          bestScore: 4250,
          totalTimeSpent: 1420, // in minutes
          favoriteCategory: "Symbol Match",
        };
        setGameStats(mockStats);
      } else {
        setGameStats(response);
      }
    } catch (error) {
      console.error("Error loading game stats:", error);
    }
  };

  const loadGameHistory = async (gameId: number) => {
    setLoadingHistory(true);
    try {
      console.log(`Loading play history for game session ${gameId}...`);

      // Use the new API to get user's play history for this specific game session
      const historyResponse = await gameAPI.getGameSessionHistory(
        gameId,
        1,
        50
      );

      if (historyResponse && historyResponse.plays) {
        console.log(
          `Found ${historyResponse.plays.length} plays for session ${gameId}`
        );

        // Map the API response to our interface
        const detailedHistory: GameHistoryDetails[] = historyResponse.plays.map(
          (play: any) => ({
            id: play.id,
            user_id: play.user_id || 0,
            difficulty_level:
              historyResponse.game_session?.difficulty_level || 1,
            number_of_rounds:
              historyResponse.game_session?.number_of_rounds || 0,
            total_time: play.total_time || 0,
            correct_answers: play.correct_answers || 0,
            score: play.score || 0,
            completed: play.completed || false,
            completed_at: play.completed_at || play.created_at,
            created_at: play.created_at,
            rounds: play.rounds_details || [],
            accuracy: play.accuracy || 0,
          })
        );

        setSelectedGameHistory(detailedHistory);

        // Log statistics for debugging
        if (historyResponse.statistics) {
          console.log(`Session statistics:`, historyResponse.statistics);
        }
      } else {
        // No history found for this game session
        console.log(`No play history found for session ${gameId}`);
        setSelectedGameHistory([]);
      }
    } catch (error: any) {
      console.error("Error loading game session history:", error);

      // Check if it's a 404 (game session not found) vs other errors
      if (error.message?.includes("not found")) {
        Alert.alert("Game Not Found", "This game session could not be found.");
      } else {
        Alert.alert("Error", "Failed to load game history. Please try again.");
      }

      setSelectedGameHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleShowGameHistory = async (gameId: number, gameTitle: string) => {
    setSelectedGameId(gameId);
    setShowHistoryModal(true);
    await loadGameHistory(gameId);
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedGameId(null);
    setSelectedGameHistory([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleJoinGame = async (session: GameSession) => {
    try {
      // Join game directly without confirmation dialog
      setLoading(true);
      console.log(`🎮 Joining game session: ${session.id}`);

      // Fetch complete game session details using api/game/{id}
      console.log(`🔄 Fetching game session details for ${session.id}`);

      let gameSessionData;
      let roundsCount = 0;

      try {
        // Fetch game session details directly using api/game/{id}
        gameSessionData = await gameAPI.getGameSession(session.id);
        console.log("✅ Fetched game session details:", gameSessionData);

        roundsCount = gameSessionData.rounds?.length || 0;
      } catch (fetchError: any) {
        console.error("❌ Failed to fetch game session details:", fetchError);
        throw new Error(
          "Failed to load game session details: " +
            (fetchError.message || fetchError)
        );
      }

      // Validate that we have rounds data
      if (roundsCount === 0) {
        console.error(
          "❌ No rounds data found in game session after all attempts"
        );
        Alert.alert(
          "Game Data Error",
          "Unable to load game rounds. This might be a configuration issue with the game.\n\nOptions:",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Try Practice Mode",
              onPress: () => {
                router.push({
                  pathname: "/game/play",
                  params: {
                    sessionId: "practice",
                    gameType: "Symbol Match",
                    title: "Practice Game",
                  },
                });
              },
            },
            {
              text: "Refresh & Retry",
              onPress: () => {
                loadAvailableGames();
              },
            },
          ]
        );
        return;
      }

      console.log(`✅ Game has ${roundsCount} rounds available`);

      // Navigate directly to game lobby with details
      console.log(`🎮 Navigating to game lobby with session ID: ${session.id}`);

      router.push({
        pathname: "/game/play",
        params: {
          sessionId: session.id.toString(),
          gameType: session.category,
          title: session.title,
          difficulty: session.difficulty,
          rounds: roundsCount.toString(),
          timeLimit: session.timeLimit.toString(),
          adminInstructions:
            gameSessionData.game_session?.admin_instructions || "",
          createdBy:
            gameSessionData.game_session?.admin_creator?.full_name ||
            gameSessionData.game_session?.admin_creator?.username ||
            "Admin",
          rewards: `${session.reward.coins} coins + ${session.reward.experience} XP`,
        },
      });

      // Update the local state to reflect joined status
      setAvailableGames((prevGames) =>
        prevGames.map((game) =>
          game.id === session.id
            ? {
                ...game,
                isJoined: true,
                status: "active",
                currentPlayers: Math.min(
                  game.currentPlayers + 1,
                  game.maxPlayers
                ),
              }
            : game
        )
      );
    } catch (error: any) {
      console.error("❌ Error joining game:", error);

      // Provide specific error messages
      let errorMessage = error.message || "Failed to join game";
      if (errorMessage.includes("already been completed")) {
        errorMessage =
          "This game session has already been completed. Please choose a different game.";
      } else if (errorMessage.includes("already assigned")) {
        errorMessage = "This game is already being played by another user.";
      } else if (errorMessage.includes("not found")) {
        errorMessage = "Game session not found. It may have been deleted.";
      } else if (errorMessage.includes("Game session not found")) {
        errorMessage =
          "Unable to load game details. The game may have been removed.";
      }

      Alert.alert("Cannot Join Game", errorMessage, [
        { text: "OK" },
        {
          text: "Refresh Games",
          onPress: () => {
            loadAvailableGames();
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = (session: GameSession) => {
    // Validate session ID before navigation
    if (!session.id || typeof session.id !== "number") {
      Alert.alert(
        "Invalid Game Session",
        "Cannot start game: Invalid session ID. Please try joining the game first."
      );
      return;
    }

    console.log(`🎮 Starting game with session ID: ${session.id}`);

    // Navigate to the actual game screen
    router.push({
      pathname: "/game/game",
      params: {
        sessionId: session.id.toString(), // Ensure it's a string for navigation
        gameType: session.category,
        title: session.title,
      },
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "#4CAF50";
      case "Medium":
        return "#FF9800";
      case "Hard":
        return "#F44336";
      case "Expert":
        return "#9C27B0";
      default:
        return "#2196F3";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "#FF9800";
      case "active":
        return "#4CAF50";
      case "completed":
        return "#9E9E9E";
      default:
        return "#2196F3";
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const styles = getResponsiveStyles(dimensions);

  const renderGameSession = ({ item }: { item: GameSession }) => (
    <View style={styles.gameCard}>
      <View style={styles.gameCardHeader}>
        <View style={styles.gameTitle}>
          <Text style={styles.gameTitleText} numberOfLines={1}>
            {item.title}
          </Text>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(item.difficulty) },
            ]}
          >
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.gameDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.gameInfo}>
        <View style={styles.playersInfo}>
          <Ionicons name="people" size={16} color="#888" />
          <Text style={styles.playersText}>
            {item.currentPlayers}/{item.maxPlayers} players
          </Text>
        </View>
        <View style={styles.timeInfo}>
          <Ionicons name="time" size={16} color="#888" />
          <Text style={styles.timeText}>{formatTime(item.timeLimit)}</Text>
        </View>
      </View>

      <View style={styles.creatorInfo}>
        <Image
          source={{ uri: item.createdBy.avatar }}
          style={styles.creatorAvatar}
        />
        <Text style={styles.creatorName}>{item.createdBy.username}</Text>
        <Text style={styles.startTime}>
          Starts {formatDate(item.startTime)}
        </Text>
      </View>

      <View style={styles.rewardInfo}>
        <View style={styles.rewardItem}>
          <Ionicons name="diamond" size={16} color="#ffd33d" />
          <Text style={styles.rewardText}>{item.reward.coins} coins</Text>
        </View>
        <View style={styles.rewardItem}>
          <Ionicons name="star" size={16} color="#4CAF50" />
          <Text style={styles.rewardText}>{item.reward.experience} XP</Text>
        </View>
      </View>

      <View style={styles.gameActions}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => handleShowGameHistory(item.id, item.title)}
        >
          <Ionicons name="time-outline" size={16} color="#ffd33d" />
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => handleJoinGame(item)}
        >
          <Text style={styles.joinButtonText}>Join Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStats = () => (
    <ScrollView
      style={styles.statsContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="game-controller" size={24} color="#ffd33d" />
          <Text style={styles.statValue}>{gameStats.totalGamesPlayed}</Text>
          <Text style={styles.statLabel}>Games Played</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{gameStats.totalWins}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="close-circle" size={24} color="#F44336" />
          <Text style={styles.statValue}>{gameStats.totalLosses}</Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color="#2196F3" />
          <Text style={styles.statValue}>{gameStats.winRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#9C27B0" />
          <Text style={styles.statValue}>
            {gameStats.totalScore.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Score</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="analytics" size={24} color="#FF9800" />
          <Text style={styles.statValue}>
            {gameStats.averageScore.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Average Score</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="medal" size={24} color="#FFD700" />
          <Text style={styles.statValue}>
            {gameStats.bestScore.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Best Score</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#607D8B" />
          <Text style={styles.statValue}>
            {Math.floor(gameStats.totalTimeSpent / 60)}h
          </Text>
          <Text style={styles.statLabel}>Time Played</Text>
        </View>
      </View>

      <View style={styles.favoriteCategory}>
        <Text style={styles.favoriteCategoryTitle}>Favorite Category</Text>
        <View style={styles.favoriteCategoryCard}>
          <Ionicons name="heart" size={24} color="#E91E63" />
          <Text style={styles.favoriteCategoryText}>
            {gameStats.favoriteCategory}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderTabButton = (
    tab: "available" | "stats",
    title: string,
    icon: string
  ) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={activeTab === tab ? "#25292e" : "#888"}
      />
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tab && styles.activeTabButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "available":
        return (
          <View style={styles.tabContent}>
            <FlatList
              data={availableGames}
              renderItem={renderGameSession}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                availableGames.length === 0
                  ? styles.emptyContainer
                  : styles.gamesList
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#ffd33d"]}
                  tintColor="#ffd33d"
                />
              }
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="game-controller-outline"
                    size={64}
                    color="#666"
                  />
                  <Text style={styles.emptyStateText}>No Games Available</Text>
                  <Text style={styles.emptyStateSubtext}>
                    No games are currently available to join.{"\n"}
                    Pull down to refresh or check back later.
                  </Text>
                </View>
              )}
            />
          </View>
        );

      case "stats":
        return renderStats();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="game-controller" size={64} color="#ffd33d" />
        <Text style={styles.loadingText}>Loading Game Menu...</Text>
      </View>
    );
  }

  const renderGameHistoryModal = () => (
    <Modal
      visible={showHistoryModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCloseHistoryModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Game History</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={handleCloseHistoryModal}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {loadingHistory ? (
          <View style={styles.modalLoadingContainer}>
            <Ionicons name="time" size={48} color="#ffd33d" />
            <Text style={styles.modalLoadingText}>
              Loading your game history...
            </Text>
          </View>
        ) : selectedGameHistory.length === 0 ? (
          <View style={styles.modalEmptyContainer}>
            <Ionicons name="document-outline" size={48} color="#666" />
            <Text style={styles.modalEmptyText}>No History Found</Text>
            <Text style={styles.modalEmptySubtext}>
              You haven&apos;t played this game session yet.{"\n"}
              Join the game to start creating your history!
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.historyCount}>
              {selectedGameHistory.length} game
              {selectedGameHistory.length !== 1 ? "s" : ""} played
            </Text>
            {selectedGameHistory.map((historyItem, index) => (
              <View key={historyItem.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>
                    Game #{historyItem.id}
                  </Text>
                  <View style={styles.historyResult}>
                    <Text
                      style={[
                        styles.historyStatValue,
                        {
                          color: historyItem.completed ? "#4CAF50" : "#FF9800",
                        },
                      ]}
                    >
                      {historyItem.completed ? "COMPLETED" : "INCOMPLETE"}
                    </Text>
                  </View>
                </View>

                <View style={styles.historyStats}>
                  <View style={styles.historyStatItem}>
                    <Text style={styles.historyStatLabel}>Score</Text>
                    <Text style={styles.historyStatValue}>
                      {historyItem.score}
                    </Text>
                  </View>
                  <View style={styles.historyStatItem}>
                    <Text style={styles.historyStatLabel}>Accuracy</Text>
                    <Text style={styles.historyStatValue}>
                      {historyItem.accuracy}%
                    </Text>
                  </View>
                  <View style={styles.historyStatItem}>
                    <Text style={styles.historyStatLabel}>Rounds</Text>
                    <Text style={styles.historyStatValue}>
                      {historyItem.correct_answers}/
                      {historyItem.number_of_rounds}
                    </Text>
                  </View>
                  <View style={styles.historyStatItem}>
                    <Text style={styles.historyStatLabel}>Time</Text>
                    <Text style={styles.historyStatValue}>
                      {Math.floor(historyItem.total_time / 60)}:
                      {(historyItem.total_time % 60)
                        .toString()
                        .padStart(2, "0")}
                    </Text>
                  </View>
                </View>

                <View style={styles.historyFooter}>
                  <Text style={styles.historyDate}>
                    {formatDate(
                      historyItem.completed_at || historyItem.created_at
                    )}
                  </Text>
                  <View style={styles.historyRewards}>
                    <Ionicons name="diamond" size={14} color="#ffd33d" />
                    <Text style={styles.historyRewardText}>
                      +{Math.floor(historyItem.score / 10)} coins
                    </Text>
                    <Ionicons
                      name="star"
                      size={14}
                      color="#4CAF50"
                      style={{ marginLeft: 8 }}
                    />
                    <Text style={styles.historyRewardText}>
                      +{Math.floor(historyItem.score / 20)} XP
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Game Menu</Text>
          <Text style={styles.headerSubtitle}>Choose your challenge</Text>
        </View>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: userProfile.avatar }}
            style={styles.userAvatar}
          />
          <View style={styles.userStats}>
            <Text style={styles.userLevel}>Lv.{userProfile.level}</Text>
            <Text style={styles.userCoins}>
              {userProfile.coins.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Game History Modal */}
      {renderGameHistoryModal()}
    </View>
  );
}

const getResponsiveStyles = (dimensions: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#25292e",
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: "#25292e",
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: "#fff",
      fontSize: getResponsiveFontSize(18),
      marginTop: 16,
      fontWeight: "600",
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
    headerInfo: {
      flex: 1,
    },
    headerTitle: {
      fontSize: getResponsiveFontSize(24),
      fontWeight: "bold",
      color: "#fff",
    },
    headerSubtitle: {
      fontSize: getResponsiveFontSize(14),
      color: "#888",
      marginTop: 2,
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 8,
    },
    userStats: {
      alignItems: "flex-end",
    },
    userLevel: {
      fontSize: getResponsiveFontSize(12),
      color: "#ffd33d",
      fontWeight: "bold",
    },
    userCoins: {
      fontSize: getResponsiveFontSize(12),
      color: "#4CAF50",
      fontWeight: "600",
    },
    tabContainer: {
      flexDirection: "row",
      paddingHorizontal: getResponsivePadding(),
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#333",
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      marginHorizontal: 4,
      borderRadius: 8,
      backgroundColor: "#333",
    },
    activeTabButton: {
      backgroundColor: "#ffd33d",
    },
    tabButtonText: {
      fontSize: getResponsiveFontSize(14),
      fontWeight: "600",
      color: "#888",
      marginLeft: 6,
    },
    activeTabButtonText: {
      color: "#25292e",
    },
    list: {
      flex: 1,
      paddingHorizontal: getResponsivePadding(),
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
    },
    emptyStateText: {
      fontSize: getResponsiveFontSize(18),
      fontWeight: "600",
      color: "#666",
      marginTop: 16,
    },
    emptyStateSubtext: {
      fontSize: getResponsiveFontSize(14),
      color: "#888",
      marginTop: 8,
      textAlign: "center",
      paddingHorizontal: 32,
      lineHeight: 20,
    },
    // Game Card Styles
    gameCard: {
      backgroundColor: "#333",
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: "#444",
    },
    gameCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    gameTitle: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    gameTitleText: {
      fontSize: getResponsiveFontSize(16),
      fontWeight: "bold",
      color: "#fff",
      flex: 1,
      marginRight: 8,
    },
    difficultyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    difficultyText: {
      fontSize: getResponsiveFontSize(10),
      fontWeight: "bold",
      color: "#fff",
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: getResponsiveFontSize(10),
      fontWeight: "bold",
      color: "#fff",
    },
    gameDescription: {
      fontSize: getResponsiveFontSize(14),
      color: "#ccc",
      marginBottom: 12,
      lineHeight: 20,
    },
    gameInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    playersInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    playersText: {
      fontSize: getResponsiveFontSize(12),
      color: "#888",
      marginLeft: 4,
    },
    timeInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    timeText: {
      fontSize: getResponsiveFontSize(12),
      color: "#888",
      marginLeft: 4,
    },
    creatorInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    creatorAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 8,
    },
    creatorName: {
      fontSize: getResponsiveFontSize(12),
      color: "#ffd33d",
      fontWeight: "600",
      flex: 1,
    },
    startTime: {
      fontSize: getResponsiveFontSize(12),
      color: "#888",
    },
    rewardInfo: {
      flexDirection: "row",
      marginBottom: 16,
    },
    rewardItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 16,
    },
    rewardText: {
      fontSize: getResponsiveFontSize(12),
      color: "#ccc",
      marginLeft: 4,
    },
    gameActions: {
      flexDirection: "row",
      gap: 8,
    },
    joinButton: {
      flex: 1,
      backgroundColor: "#ffd33d",
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    joinedButton: {
      backgroundColor: "#4CAF50",
    },
    disabledButton: {
      backgroundColor: "#666",
    },
    joinButtonText: {
      fontSize: getResponsiveFontSize(14),
      fontWeight: "bold",
      color: "#25292e",
    },
    joinedButtonText: {
      color: "#fff",
    },
    historyButton: {
      backgroundColor: "#333",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#ffd33d",
    },
    historyButtonText: {
      color: "#ffd33d",
      fontSize: getResponsiveFontSize(12),
      fontWeight: "600",
      marginLeft: 4,
    },
    startButton: {
      flex: 1,
      backgroundColor: "#4CAF50",
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    startButtonText: {
      fontSize: getResponsiveFontSize(14),
      fontWeight: "bold",
      color: "#fff",
    },
    // History Card Styles
    historyCard: {
      backgroundColor: "#333",
      borderRadius: 12,
      padding: 16,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: "#444",
    },
    historyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    historyTitle: {
      fontSize: getResponsiveFontSize(16),
      fontWeight: "bold",
      color: "#fff",
      flex: 1,
    },
    historyResult: {
      marginLeft: 8,
    },
    historyStats: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    historyStatItem: {
      alignItems: "center",
    },
    historyStatLabel: {
      fontSize: getResponsiveFontSize(10),
      color: "#888",
      marginBottom: 2,
    },
    historyStatValue: {
      fontSize: getResponsiveFontSize(14),
      fontWeight: "bold",
      color: "#fff",
    },
    historyRewards: {
      flexDirection: "row",
      alignItems: "center",
    },
    historyRewardText: {
      fontSize: getResponsiveFontSize(12),
      color: "#ccc",
      marginLeft: 4,
    },
    historyDate: {
      fontSize: getResponsiveFontSize(12),
      color: "#888",
      marginLeft: "auto",
    },
    // Stats Styles
    statsContainer: {
      flex: 1,
      paddingHorizontal: getResponsivePadding(),
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginVertical: 16,
    },
    statCard: {
      backgroundColor: "#333",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      width: (screenWidth - getResponsivePadding() * 2 - 12) / 2,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#444",
    },
    statValue: {
      fontSize: getResponsiveFontSize(20),
      fontWeight: "bold",
      color: "#fff",
      marginTop: 8,
    },
    statLabel: {
      fontSize: getResponsiveFontSize(12),
      color: "#888",
      marginTop: 4,
      textAlign: "center",
    },
    favoriteCategory: {
      marginVertical: 16,
    },
    favoriteCategoryTitle: {
      fontSize: getResponsiveFontSize(18),
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 12,
    },
    favoriteCategoryCard: {
      backgroundColor: "#333",
      borderRadius: 12,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#444",
    },
    favoriteCategoryText: {
      fontSize: getResponsiveFontSize(16),
      fontWeight: "bold",
      color: "#fff",
      marginLeft: 12,
    },
    tabContent: {
      flex: 1,
    },
    createRoundButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#ffd33d",
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    createRoundButtonText: {
      color: "#000",
      fontSize: getResponsiveFontSize(16),
      fontWeight: "bold",
      marginLeft: 8,
    },
    gamesList: {
      padding: getResponsivePadding(),
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
    },
    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: "#25292e",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#333",
    },
    modalTitle: {
      fontSize: getResponsiveFontSize(20),
      fontWeight: "bold",
      color: "#fff",
    },
    modalCloseButton: {
      padding: 8,
    },
    modalLoadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    modalLoadingText: {
      color: "#fff",
      fontSize: getResponsiveFontSize(16),
      marginTop: 16,
      textAlign: "center",
    },
    modalEmptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    modalEmptyText: {
      fontSize: getResponsiveFontSize(18),
      fontWeight: "bold",
      color: "#fff",
      marginTop: 16,
      textAlign: "center",
    },
    modalEmptySubtext: {
      fontSize: getResponsiveFontSize(14),
      color: "#888",
      marginTop: 8,
      textAlign: "center",
      lineHeight: 20,
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: 20,
    },
    historyCount: {
      fontSize: getResponsiveFontSize(16),
      color: "#ffd33d",
      fontWeight: "600",
      marginVertical: 16,
      textAlign: "center",
    },
    historyFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 12,
    },
  });
