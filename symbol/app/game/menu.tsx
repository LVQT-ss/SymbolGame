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
  id: string;
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

interface GameHistory {
  id: string;
  title: string;
  score: number;
  duration: number;
  result: "won" | "lost" | "draw";
  coinsEarned: number;
  experienceGained: number;
  completedAt: string;
  rank: number;
  totalPlayers: number;
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

export default function GameMenuScreen() {
  const [dimensions, setDimensions] = useState(getResponsiveDimensions());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "history" | "stats">(
    "available"
  );

  // Data states
  const [availableGames, setAvailableGames] = useState<GameSession[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
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
        loadGameHistory(),
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
        console.log("Using real API data");

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

            return {
              id: game.id.toString(),
              title: `Math Challenge Session ${game.id}`,
              description:
                game.admin_instructions ||
                "Complete mathematical symbol comparison challenges",
              difficulty,
              maxPlayers: 1, // Based on API structure, seems like individual sessions
              currentPlayers: game.status === "available_to_join" ? 0 : 1,
              timeLimit: timeLimitSeconds,
              reward: {
                coins: baseCoins,
                experience: baseExperience,
              },
              isJoined: false, // We'd need to check this from user data
              createdBy: {
                id: game.created_by.id.toString(),
                username: game.created_by.username,
                avatar: `https://i.pravatar.cc/100?img=${game.created_by.id}`,
              },
              startTime: game.created_at,
              status:
                game.status === "available_to_join" ? "waiting" : "active",
              category: "Symbol Match",
            };
          }
        );

        setAvailableGames(mappedGames);
        console.log("Mapped games:", mappedGames);
      } else {
        console.log(
          "API response doesn't have expected format, using mock data"
        );
        // Fallback to mock data
        const mockGames: GameSession[] = [
          {
            id: "session_1",
            title: "Symbol Match Challenge",
            description: "Match mathematical symbols in this fast-paced game",
            difficulty: "Easy",
            maxPlayers: 4,
            currentPlayers: 2,
            timeLimit: 300, // 5 minutes
            reward: { coins: 100, experience: 50 },
            isJoined: false,
            createdBy: {
              id: "admin_1",
              username: "GameMaster",
              avatar: "https://i.pravatar.cc/100?img=10",
            },
            startTime: new Date(Date.now() + 300000).toISOString(), // Starts in 5 minutes
            status: "waiting",
            category: "Symbol Match",
          },
          {
            id: "session_2",
            title: "Memory Speed Run",
            description: "Test your memory in this intense challenge",
            difficulty: "Medium",
            maxPlayers: 6,
            currentPlayers: 4,
            timeLimit: 180, // 3 minutes
            reward: { coins: 150, experience: 75 },
            isJoined: true,
            createdBy: {
              id: "admin_2",
              username: "MemoryKing",
              avatar: "https://i.pravatar.cc/100?img=15",
            },
            startTime: new Date(Date.now() + 600000).toISOString(), // Starts in 10 minutes
            status: "waiting",
            category: "Memory Game",
          },
          {
            id: "session_3",
            title: "Ultimate Speed Challenge",
            description: "Lightning fast symbol recognition",
            difficulty: "Hard",
            maxPlayers: 8,
            currentPlayers: 7,
            timeLimit: 120, // 2 minutes
            reward: { coins: 250, experience: 125 },
            isJoined: false,
            createdBy: {
              id: "admin_3",
              username: "SpeedDemon",
              avatar: "https://i.pravatar.cc/100?img=20",
            },
            startTime: new Date(Date.now() + 900000).toISOString(), // Starts in 15 minutes
            status: "active",
            category: "Speed Challenge",
          },
          {
            id: "session_4",
            title: "Puzzle Master Tournament",
            description: "Solve complex puzzles to win big",
            difficulty: "Expert",
            maxPlayers: 12,
            currentPlayers: 8,
            timeLimit: 600, // 10 minutes
            reward: { coins: 500, experience: 250 },
            isJoined: false,
            createdBy: {
              id: "admin_4",
              username: "PuzzleGuru",
              avatar: "https://i.pravatar.cc/100?img=25",
            },
            startTime: new Date(Date.now() + 1800000).toISOString(), // Starts in 30 minutes
            status: "waiting",
            category: "Puzzle Master",
          },
        ];
        setAvailableGames(mockGames);
      }
    } catch (error) {
      console.error("Error loading available games:", error);

      // Create fallback mock data on error
      const errorFallbackGames: GameSession[] = [
        {
          id: "error_session_1",
          title: "Offline Practice Session",
          description: "Practice mode while connecting to server",
          difficulty: "Easy",
          maxPlayers: 1,
          currentPlayers: 0,
          timeLimit: 300,
          reward: { coins: 50, experience: 25 },
          isJoined: false,
          createdBy: {
            id: "system",
            username: "System",
            avatar: "https://i.pravatar.cc/100?img=1",
          },
          startTime: new Date().toISOString(),
          status: "waiting",
          category: "Symbol Match",
        },
      ];
      setAvailableGames(errorFallbackGames);
    }
  };

  const loadGameHistory = async () => {
    try {
      const response = await gameAPI.getGameHistory(1, 20);

      // If API doesn't return expected format, create mock data
      if (!response || !response.history) {
        const mockHistory: GameHistory[] = [
          {
            id: "history_1",
            title: "Symbol Match Challenge",
            score: 2450,
            duration: 240, // 4 minutes
            result: "won",
            coinsEarned: 100,
            experienceGained: 50,
            completedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            rank: 1,
            totalPlayers: 4,
          },
          {
            id: "history_2",
            title: "Memory Speed Run",
            score: 1890,
            duration: 180,
            result: "lost",
            coinsEarned: 25,
            experienceGained: 20,
            completedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            rank: 3,
            totalPlayers: 6,
          },
          {
            id: "history_3",
            title: "Speed Challenge",
            score: 3120,
            duration: 120,
            result: "won",
            coinsEarned: 200,
            experienceGained: 100,
            completedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            rank: 1,
            totalPlayers: 8,
          },
          {
            id: "history_4",
            title: "Memory Game",
            score: 1650,
            duration: 300,
            result: "draw",
            coinsEarned: 50,
            experienceGained: 30,
            completedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            rank: 2,
            totalPlayers: 4,
          },
        ];
        setGameHistory(mockHistory);
      } else {
        setGameHistory(response.history);
      }
    } catch (error) {
      console.error("Error loading game history:", error);
      setGameHistory([]);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleJoinGame = async (session: GameSession) => {
    try {
      if (session.isJoined) {
        Alert.alert(
          "Already Joined",
          "You have already joined this game session."
        );
        return;
      }

      if (session.currentPlayers >= session.maxPlayers) {
        Alert.alert("Game Full", "This game session is already full.");
        return;
      }

      Alert.alert(
        "Join Game",
        `Join "${session.title}"?\n\nDifficulty: ${session.difficulty}\nReward: ${session.reward.coins} coins + ${session.reward.experience} XP`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Join",
            onPress: async () => {
              try {
                await gameAPI.joinGame(session.id);
                Alert.alert("Success", "Successfully joined the game!");
                await loadAvailableGames(); // Refresh the list
              } catch (error: any) {
                Alert.alert("Error", error.message || "Failed to join game");
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to join game");
    }
  };

  const handleStartGame = (session: GameSession) => {
    // Navigate to the actual game screen
    router.push({
      pathname: "/game/game",
      params: {
        sessionId: session.id,
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

  const getResultIcon = (result: string) => {
    switch (result) {
      case "won":
        return "trophy";
      case "lost":
        return "close-circle";
      case "draw":
        return "remove-circle";
      default:
        return "help-circle";
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "won":
        return "#4CAF50";
      case "lost":
        return "#F44336";
      case "draw":
        return "#FF9800";
      default:
        return "#9E9E9E";
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
        {item.status === "active" ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStartGame(item)}
          >
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.joinButton,
              item.isJoined && styles.joinedButton,
              item.currentPlayers >= item.maxPlayers && styles.disabledButton,
            ]}
            onPress={() => handleJoinGame(item)}
            disabled={item.isJoined || item.currentPlayers >= item.maxPlayers}
          >
            <Text
              style={[
                styles.joinButtonText,
                item.isJoined && styles.joinedButtonText,
              ]}
            >
              {item.isJoined
                ? "Joined"
                : item.currentPlayers >= item.maxPlayers
                ? "Full"
                : "Join Game"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: GameHistory }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.historyResult}>
          <Ionicons
            name={getResultIcon(item.result) as any}
            size={20}
            color={getResultColor(item.result)}
          />
        </View>
      </View>

      <View style={styles.historyStats}>
        <View style={styles.historyStatItem}>
          <Text style={styles.historyStatLabel}>Score</Text>
          <Text style={styles.historyStatValue}>
            {item.score.toLocaleString()}
          </Text>
        </View>
        <View style={styles.historyStatItem}>
          <Text style={styles.historyStatLabel}>Rank</Text>
          <Text style={styles.historyStatValue}>
            {item.rank}/{item.totalPlayers}
          </Text>
        </View>
        <View style={styles.historyStatItem}>
          <Text style={styles.historyStatLabel}>Duration</Text>
          <Text style={styles.historyStatValue}>
            {formatTime(item.duration)}
          </Text>
        </View>
      </View>

      <View style={styles.historyRewards}>
        <View style={styles.rewardItem}>
          <Ionicons name="diamond" size={14} color="#ffd33d" />
          <Text style={styles.historyRewardText}>+{item.coinsEarned}</Text>
        </View>
        <View style={styles.rewardItem}>
          <Ionicons name="star" size={14} color="#4CAF50" />
          <Text style={styles.historyRewardText}>+{item.experienceGained}</Text>
        </View>
        <Text style={styles.historyDate}>{formatDate(item.completedAt)}</Text>
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
    tab: "available" | "history" | "stats",
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
            <TouchableOpacity
              style={styles.createRoundButton}
              onPress={() => router.push("/game/round")}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.createRoundButtonText}>
                Create Game Round
              </Text>
            </TouchableOpacity>
            <FlatList
              data={availableGames}
              renderItem={renderGameSession}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.gameList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          </View>
        );
      case "history":
        return (
          <FlatList
            data={gameHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#ffd33d"
                colors={["#ffd33d"]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={64} color="#666" />
                <Text style={styles.emptyStateText}>No game history</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start playing to see your game history
                </Text>
              </View>
            }
          />
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {renderTabButton("available", "Available", "play")}
        {renderTabButton("history", "History", "time")}
        {renderTabButton("stats", "Stats", "analytics")}
      </View>

      {/* Content */}
      {renderContent()}
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
    gameList: {
      padding: getResponsivePadding(),
    },
  });
