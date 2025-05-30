import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive dimensions
const isSmallScreen = screenWidth < 360;
const isMediumScreen = screenWidth >= 360 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

// Dynamic sizing functions
const responsiveSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

const responsiveSpacing = (base: number) => {
  return base * (screenWidth / 375); // 375 is iPhone 6/7/8 width as baseline
};

interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  score: number;
  avatar: string;
  level: number;
  isCurrentUser?: boolean;
}

export default function LeaderboardScreen() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "weekly" | "allTime"
  >("allTime");

  // Sample data - replace with actual API call
  const generateMockData = (): LeaderboardEntry[] => {
    const usernames = [
      "SymbolMaster",
      "GameChampion",
      "TopPlayer",
      "ProGamer",
      "SkillfulOne",
      "ElitePlayer",
      "Champion2024",
      "StarPlayer",
      "GameLegend",
      "UltimateWin",
      "PowerUser",
      "HighScorer",
      "VictoryKing",
      "MasterGamer",
      "TopTalent",
      "GameHero",
      "ScoreQueen",
      "WinStreak",
      "PlayMaster",
      "GameStar",
    ];

    return usernames
      .map((username, index) => ({
        id: `user_${index + 1}`,
        rank: index + 1,
        username,
        score: Math.floor(Math.random() * 50000) + 10000 - index * 1000,
        avatar: `https://i.pravatar.cc/150?img=${index + 1}`,
        level: Math.floor(Math.random() * 50) + 10,
        isCurrentUser: index === 4, // Mark 5th user as current user for demo
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  };

  useEffect(() => {
    loadLeaderboard();
  }, [selectedPeriod]);

  const loadLeaderboard = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const data = generateMockData();
      setLeaderboardData(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load leaderboard");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "trophy";
      case 2:
        return "medal";
      case 3:
        return "medal-outline";
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "#FFD700"; // Gold
      case 2:
        return "#C0C0C0"; // Silver
      case 3:
        return "#CD7F32"; // Bronze
      default:
        return "#ffd33d";
    }
  };

  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  const truncateUsername = (username: string, maxLength: number) => {
    if (username.length <= maxLength) return username;
    return username.substring(0, maxLength - 3) + "...";
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => (
    <TouchableOpacity
      style={[
        styles.leaderboardItem,
        item.isCurrentUser && styles.currentUserItem,
      ]}
      onPress={() =>
        Alert.alert("Player Info", `View ${item.username}'s profile`)
      }
    >
      <View style={styles.rankContainer}>
        {item.rank <= 3 && getRankIcon(item.rank) ? (
          <Ionicons
            name={getRankIcon(item.rank) as any}
            size={responsiveSize(18, 20, 24)}
            color={getRankColor(item.rank)}
          />
        ) : (
          <Text style={[styles.rankText, { color: getRankColor(item.rank) }]}>
            #{item.rank}
          </Text>
        )}
      </View>

      <Image source={{ uri: item.avatar }} style={styles.avatar} />

      <View style={styles.userInfo}>
        <Text
          style={[
            styles.username,
            item.isCurrentUser && styles.currentUserText,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {truncateUsername(
            item.username + (item.isCurrentUser ? " (You)" : ""),
            isSmallScreen ? 12 : 20
          )}
        </Text>
        <Text style={styles.level}>Level {item.level}</Text>
      </View>

      <View style={styles.scoreContainer}>
        <Text
          style={[styles.score, item.isCurrentUser && styles.currentUserText]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatScore(item.score)}
        </Text>
        <Text style={styles.scoreLabel}>points</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPeriodButton = (period: typeof selectedPeriod, label: string) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.selectedPeriodButton,
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text
        style={[
          styles.periodButtonText,
          selectedPeriod === period && styles.selectedPeriodButtonText,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons
            name="refresh"
            size={responsiveSize(20, 22, 24)}
            color="#ffd33d"
          />
        </TouchableOpacity>
      </View>

      {/* Period Selection */}
      <View style={styles.periodContainer}>
        {renderPeriodButton("daily", "Daily")}
        {renderPeriodButton("weekly", "Weekly")}
        {renderPeriodButton("allTime", "All Time")}
      </View>

      {/* Top 3 Podium */}
      {leaderboardData.length >= 3 && (
        <View style={styles.podiumContainer}>
          {/* 2nd Place */}
          <View style={styles.podiumItem}>
            <Image
              source={{ uri: leaderboardData[1].avatar }}
              style={styles.podiumAvatar}
            />
            <View style={[styles.podiumRank, styles.silverRank]}>
              <Text style={styles.podiumRankText}>2</Text>
            </View>
            <Text
              style={styles.podiumName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {leaderboardData[1].username}
            </Text>
            <Text style={styles.podiumScore}>
              {formatScore(leaderboardData[1].score)}
            </Text>
          </View>

          {/* 1st Place */}
          <View style={[styles.podiumItem, styles.goldPodium]}>
            <Image
              source={{ uri: leaderboardData[0].avatar }}
              style={styles.podiumAvatar}
            />
            <View style={[styles.podiumRank, styles.goldRank]}>
              <Ionicons
                name="trophy"
                size={responsiveSize(16, 18, 20)}
                color="#FFD700"
              />
            </View>
            <Text
              style={styles.podiumName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {leaderboardData[0].username}
            </Text>
            <Text style={styles.podiumScore}>
              {formatScore(leaderboardData[0].score)}
            </Text>
          </View>

          {/* 3rd Place */}
          <View style={styles.podiumItem}>
            <Image
              source={{ uri: leaderboardData[2].avatar }}
              style={styles.podiumAvatar}
            />
            <View style={[styles.podiumRank, styles.bronzeRank]}>
              <Text style={styles.podiumRankText}>3</Text>
            </View>
            <Text
              style={styles.podiumName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {leaderboardData[2].username}
            </Text>
            <Text style={styles.podiumScore}>
              {formatScore(leaderboardData[2].score)}
            </Text>
          </View>
        </View>
      )}

      {/* Full Leaderboard List */}
      <FlatList
        data={leaderboardData}
        renderItem={renderLeaderboardItem}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveSpacing(20),
    paddingTop: responsiveSpacing(20),
    paddingBottom: responsiveSpacing(10),
  },
  title: {
    fontSize: responsiveSize(22, 26, 28),
    fontWeight: "bold",
    color: "#fff",
  },
  refreshButton: {
    padding: responsiveSpacing(8),
  },
  periodContainer: {
    flexDirection: "row",
    paddingHorizontal: responsiveSpacing(20),
    marginBottom: responsiveSpacing(20),
  },
  periodButton: {
    flex: 1,
    paddingVertical: responsiveSpacing(10),
    alignItems: "center",
    marginHorizontal: responsiveSpacing(4),
    borderRadius: 8,
    backgroundColor: "#333",
    minHeight: 40,
    justifyContent: "center",
  },
  selectedPeriodButton: {
    backgroundColor: "#ffd33d",
  },
  periodButtonText: {
    color: "#ccc",
    fontWeight: "600",
    fontSize: responsiveSize(12, 14, 16),
  },
  selectedPeriodButtonText: {
    color: "#25292e",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: responsiveSpacing(20),
    marginBottom: responsiveSpacing(30),
    height: responsiveSize(140, 160, 180),
  },
  podiumItem: {
    alignItems: "center",
    marginHorizontal: responsiveSpacing(5),
    flex: 1,
    maxWidth: screenWidth / 3.5,
  },
  goldPodium: {
    marginBottom: responsiveSpacing(20),
  },
  podiumAvatar: {
    width: responsiveSize(45, 55, 60),
    height: responsiveSize(45, 55, 60),
    borderRadius: responsiveSize(22.5, 27.5, 30),
    marginBottom: responsiveSpacing(8),
    borderWidth: 2,
    borderColor: "#ffd33d",
  },
  podiumRank: {
    width: responsiveSize(24, 28, 30),
    height: responsiveSize(24, 28, 30),
    borderRadius: responsiveSize(12, 14, 15),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveSpacing(8),
  },
  goldRank: {
    backgroundColor: "#FFD700",
  },
  silverRank: {
    backgroundColor: "#C0C0C0",
  },
  bronzeRank: {
    backgroundColor: "#CD7F32",
  },
  podiumRankText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: responsiveSize(12, 14, 16),
  },
  podiumName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: responsiveSize(11, 13, 14),
    textAlign: "center",
    marginBottom: responsiveSpacing(4),
    minHeight: responsiveSize(30, 35, 40),
  },
  podiumScore: {
    color: "#ffd33d",
    fontSize: responsiveSize(10, 11, 12),
    fontWeight: "600",
  },
  list: {
    flex: 1,
    paddingHorizontal: responsiveSpacing(20),
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 12,
    padding: responsiveSpacing(12),
    marginBottom: responsiveSpacing(12),
    borderWidth: 1,
    borderColor: "#444",
    minHeight: responsiveSize(65, 75, 80),
  },
  currentUserItem: {
    backgroundColor: "#3a4a3a",
    borderColor: "#ffd33d",
    borderWidth: 2,
  },
  rankContainer: {
    width: responsiveSize(30, 35, 40),
    alignItems: "center",
  },
  rankText: {
    fontSize: responsiveSize(12, 14, 16),
    fontWeight: "bold",
  },
  avatar: {
    width: responsiveSize(40, 45, 50),
    height: responsiveSize(40, 45, 50),
    borderRadius: responsiveSize(20, 22.5, 25),
    marginLeft: responsiveSpacing(8),
    marginRight: responsiveSpacing(12),
  },
  userInfo: {
    flex: 1,
    paddingRight: responsiveSpacing(8),
  },
  username: {
    color: "#fff",
    fontSize: responsiveSize(14, 15, 16),
    fontWeight: "bold",
    marginBottom: responsiveSpacing(4),
  },
  currentUserText: {
    color: "#ffd33d",
  },
  level: {
    color: "#888",
    fontSize: responsiveSize(12, 13, 14),
  },
  scoreContainer: {
    alignItems: "flex-end",
    minWidth: responsiveSize(70, 80, 90),
  },
  score: {
    color: "#fff",
    fontSize: responsiveSize(14, 16, 18),
    fontWeight: "bold",
  },
  scoreLabel: {
    color: "#888",
    fontSize: responsiveSize(10, 11, 12),
  },
});
