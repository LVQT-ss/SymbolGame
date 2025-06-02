import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiUtils, authAPI } from "../../services/api";

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

const getGameCardWidth = () => {
  const { screenWidth, isTablet, isLargeScreen } = getResponsiveDimensions();
  const padding = getResponsivePadding();
  const gap = 12;

  if (isLargeScreen) {
    // 4 columns on large screens
    return (screenWidth - padding * 2 - gap * 3) / 4;
  } else if (isTablet) {
    // 3 columns on tablets
    return (screenWidth - padding * 2 - gap * 2) / 3;
  } else {
    // 2 columns on phones
    return (screenWidth - padding * 2 - gap) / 2;
  }
};

const getStatsCardLayout = () => {
  const { isTablet, isLargeScreen, isPortrait } = getResponsiveDimensions();

  if (isLargeScreen) {
    return { columns: isPortrait ? 3 : 5, showAllStats: true };
  } else if (isTablet) {
    return { columns: isPortrait ? 2 : 4, showAllStats: true };
  } else {
    return { columns: 3, showAllStats: false };
  }
};

interface UserStats {
  totalScore: number;
  gamesPlayed: number;
  winRate: number;
  currentLevel: number;
  currentRank: number;
  totalUsers: number;
}

interface UserProfile {
  username: string;
  coins: number;
  gems: number;
  level: number;
  experience: number;
  maxExperience: number;
  joinDate: string;
  totalWins: number;
  totalLosses: number;
  avatar: string;
}

interface GameCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  isLocked?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
}

export default function HomeScreen() {
  const [dimensions, setDimensions] = useState(getResponsiveDimensions());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalScore: 45280,
    gamesPlayed: 127,
    winRate: 78.5,
    currentLevel: 24,
    currentRank: 5,
    totalUsers: 2847,
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: "SymbolPlayer",
    coins: 12450,
    gems: 89,
    level: 24,
    experience: 7200,
    maxExperience: 10000,
    joinDate: "January 2024",
    totalWins: 98,
    totalLosses: 29,
    avatar: "https://i.pravatar.cc/100?img=1",
  });

  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(userProfile.username);

  useEffect(() => {
    checkAuthStatus();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(getResponsiveDimensions());
    });

    return () => {
      clearInterval(timer);
      subscription?.remove();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await apiUtils.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const gameCategories: GameCategory[] = [
    {
      id: "symbol-match",
      title: "Symbol Match",
      icon: "shapes",
      color: "#FF6B6B",
      description: "Match symbols to score points",
    },
    {
      id: "memory-game",
      title: "Memory Game",
      icon: "library",
      color: "#4ECDC4",
      description: "Test your memory skills",
    },
    {
      id: "speed-challenge",
      title: "Speed Challenge",
      icon: "flash",
      color: "#45B7D1",
      description: "Race against time",
    },
    {
      id: "puzzle-master",
      title: "Puzzle Master",
      icon: "extension-puzzle",
      color: "#96CEB4",
      description: "Solve complex puzzles",
      isLocked: true,
    },
  ];

  const recentAchievements: Achievement[] = [
    {
      id: "first-win",
      title: "First Victory",
      description: "Win your first game",
      icon: "trophy",
      earned: true,
    },
    {
      id: "speed-demon",
      title: "Speed Demon",
      description: "Complete 10 games under 30 seconds",
      icon: "flash",
      earned: true,
    },
    {
      id: "memory-master",
      title: "Memory Master",
      description: "Complete memory games",
      icon: "brain",
      earned: false,
      progress: 7,
      maxProgress: 10,
    },
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const onRefresh = async () => {
    setRefreshing(true);

    // Check auth status on refresh
    await checkAuthStatus();

    // Simulate loading time
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleGamePress = (game: GameCategory) => {
    if (game.isLocked) {
      Alert.alert("Game Locked", `Reach level 30 to unlock ${game.title}!`, [
        { text: "OK" },
      ]);
    } else {
      Alert.alert("Start Game", `Ready to play ${game.title}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Play", onPress: () => console.log(`Starting ${game.title}`) },
      ]);
    }
  };

  const handleProfilePress = () => {
    setShowProfileModal(true);
  };

  const handleUsernameEdit = () => {
    setEditingUsername(true);
    setTempUsername(userProfile.username);
  };

  const saveUsername = () => {
    if (tempUsername.trim().length >= 3) {
      setUserProfile((prev) => ({ ...prev, username: tempUsername.trim() }));
      setEditingUsername(false);
      Alert.alert("Success", "Username updated successfully!");
    } else {
      Alert.alert("Error", "Username must be at least 3 characters long");
    }
  };

  const cancelUsernameEdit = () => {
    setEditingUsername(false);
    setTempUsername(userProfile.username);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const styles = getResponsiveStyles(dimensions);
  const cardWidth = getGameCardWidth();
  const statsLayout = getStatsCardLayout();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await authAPI.logout();
            setIsAuthenticated(false);
            setShowProfileModal(false);
            Alert.alert("Success", "You have been logged out successfully.");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const handleLoginPress = () => {
    router.push("/(auth)/Auth");
  };

  const ProfileModal = () => (
    <Modal
      visible={showProfileModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowProfileModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowProfileModal(false)}
          >
            <Ionicons
              name="close"
              size={getResponsiveFontSize(24)}
              color="#fff"
            />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons
              name="settings"
              size={getResponsiveFontSize(24)}
              color="#ffd33d"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            <Image
              source={{ uri: userProfile.avatar }}
              style={styles.profileModalImage}
            />

            <View style={styles.usernameContainer}>
              {editingUsername ? (
                <View style={styles.usernameEditContainer}>
                  <TextInput
                    style={styles.usernameInput}
                    value={tempUsername}
                    onChangeText={setTempUsername}
                    placeholder="Enter username"
                    placeholderTextColor="#888"
                    maxLength={20}
                  />
                  <View style={styles.usernameEditButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={cancelUsernameEdit}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={saveUsername}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.usernameDisplay}
                  onPress={handleUsernameEdit}
                >
                  <Text style={styles.profileUsername}>
                    {userProfile.username}
                  </Text>
                  <Ionicons
                    name="pencil"
                    size={getResponsiveFontSize(16)}
                    color="#ffd33d"
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.profileLevel}>Level {userProfile.level}</Text>
            <Text style={styles.joinDate}>
              Member since {userProfile.joinDate}
            </Text>
          </View>

          <View style={styles.currencySection}>
            <View style={styles.currencyItem}>
              <View style={styles.currencyIcon}>
                <Ionicons
                  name="cash"
                  size={getResponsiveFontSize(24)}
                  color="#FFD700"
                />
              </View>
              <View style={styles.currencyInfo}>
                <Text style={styles.currencyLabel}>Coins</Text>
                <Text style={styles.currencyValue}>
                  {formatNumber(userProfile.coins)}
                </Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons
                  name="add"
                  size={getResponsiveFontSize(20)}
                  color="#ffd33d"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.currencyItem}>
              <View
                style={[styles.currencyIcon, { backgroundColor: "#9C27B0" }]}
              >
                <Ionicons
                  name="diamond"
                  size={getResponsiveFontSize(24)}
                  color="#fff"
                />
              </View>
              <View style={styles.currencyInfo}>
                <Text style={styles.currencyLabel}>Gems</Text>
                <Text style={styles.currencyValue}>{userProfile.gems}</Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons
                  name="add"
                  size={getResponsiveFontSize(20)}
                  color="#ffd33d"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileStatsSection}>
            <Text style={styles.profileSectionTitle}>Game Statistics</Text>

            <View style={styles.modalStatsGrid}>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatValue}>
                  {userProfile.totalWins}
                </Text>
                <Text style={styles.profileStatLabel}>Total Wins</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatValue}>
                  {userProfile.totalLosses}
                </Text>
                <Text style={styles.profileStatLabel}>Total Losses</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatValue}>{userStats.winRate}%</Text>
                <Text style={styles.profileStatLabel}>Win Rate</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatValue}>
                  #{userStats.currentRank}
                </Text>
                <Text style={styles.profileStatLabel}>Global Rank</Text>
              </View>
            </View>
          </View>

          <View style={styles.experienceSection}>
            <Text style={styles.profileSectionTitle}>Experience Progress</Text>
            <View style={styles.expProgressContainer}>
              <View style={styles.expProgressBar}>
                <View
                  style={[
                    styles.expProgressFill,
                    {
                      width: `${
                        (userProfile.experience / userProfile.maxExperience) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.expText}>
                {formatNumber(userProfile.experience)} /{" "}
                {formatNumber(userProfile.maxExperience)} XP
              </Text>
            </View>
          </View>

          <View style={styles.actionButtonsSection}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons
                name="camera"
                size={getResponsiveFontSize(20)}
                color="#fff"
              />
              <Text style={styles.actionButtonText}>Change Avatar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons
                name="share-social"
                size={getResponsiveFontSize(20)}
                color="#fff"
              />
              <Text style={styles.actionButtonText}>Share Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLogout}
            >
              <Ionicons
                name="log-out"
                size={getResponsiveFontSize(20)}
                color="#FF6B6B"
              />
              <Text style={[styles.actionButtonText, { color: "#FF6B6B" }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Show loading indicator while checking auth
  if (checkingAuth) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#ffd33d"
          colors={["#ffd33d"]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}!</Text>
          <Text style={styles.username}>
            {isAuthenticated ? userProfile.username : "Guest"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons
              name="notifications"
              size={getResponsiveFontSize(24)}
              color="#ffd33d"
            />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          {isAuthenticated ? (
            <TouchableOpacity onPress={handleProfilePress}>
              <Image
                source={{ uri: userProfile.avatar }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLoginPress}
            >
              <Ionicons
                name="person"
                size={getResponsiveFontSize(18)}
                color="#25292e"
              />
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Show profile modal only for authenticated users */}
      {isAuthenticated && <ProfileModal />}

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons
            name="trophy"
            size={getResponsiveFontSize(24)}
            color="#FFD700"
          />
          <Text style={styles.statNumber}>
            {formatNumber(userStats.totalScore)}
          </Text>
          <Text style={styles.statLabel}>Total Score</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons
            name="game-controller"
            size={getResponsiveFontSize(24)}
            color="#4ECDC4"
          />
          <Text style={styles.statNumber}>{userStats.gamesPlayed}</Text>
          <Text style={styles.statLabel}>Games Played</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons
            name="trending-up"
            size={getResponsiveFontSize(24)}
            color="#FF6B6B"
          />
          <Text style={styles.statNumber}>{userStats.winRate}%</Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.sectionTitle}>Level Progress</Text>
          <Text style={styles.levelText}>Level {userStats.currentLevel}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "70%" }]} />
        </View>
        <Text style={styles.progressText}>7,200 / 10,000 XP to next level</Text>
      </View>

      <View style={styles.rankSection}>
        <View style={styles.rankCard}>
          <View style={styles.rankInfo}>
            <Ionicons
              name="podium"
              size={getResponsiveFontSize(32)}
              color="#ffd33d"
            />
            <View style={styles.rankDetails}>
              <Text style={styles.rankTitle}>Current Rank</Text>
              <Text style={styles.rankNumber}>#{userStats.currentRank}</Text>
              <Text style={styles.rankSubtext}>
                out of {formatNumber(userStats.totalUsers)} players
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewLeaderboardButton}>
            <Link href="/leaderboard" asChild>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkButtonText}>View Leaderboard</Text>
                <Ionicons
                  name="chevron-forward"
                  size={getResponsiveFontSize(16)}
                  color="#25292e"
                />
              </TouchableOpacity>
            </Link>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.gamesSection}>
        <Text style={styles.sectionTitle}>Game Modes</Text>
        <View style={styles.gamesGrid}>
          {gameCategories.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[
                styles.gameCard,
                { width: cardWidth },
                game.isLocked && styles.lockedCard,
              ]}
              onPress={() => handleGamePress(game)}
            >
              <View style={[styles.gameIcon, { backgroundColor: game.color }]}>
                <Ionicons
                  name={game.icon as any}
                  size={getResponsiveFontSize(28)}
                  color="#fff"
                />
                {game.isLocked && (
                  <View style={styles.lockOverlay}>
                    <Ionicons
                      name="lock-closed"
                      size={getResponsiveFontSize(20)}
                      color="#666"
                    />
                  </View>
                )}
              </View>
              <Text
                style={[styles.gameTitle, game.isLocked && styles.lockedText]}
              >
                {game.title}
              </Text>
              <Text
                style={[
                  styles.gameDescription,
                  game.isLocked && styles.lockedText,
                ]}
              >
                {game.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        {recentAchievements.map((achievement) => (
          <View key={achievement.id} style={styles.achievementItem}>
            <View
              style={[
                styles.achievementIcon,
                { backgroundColor: achievement.earned ? "#4CAF50" : "#666" },
              ]}
            >
              <Ionicons
                name={achievement.icon as any}
                size={getResponsiveFontSize(20)}
                color="#fff"
              />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>
              {achievement.progress && achievement.maxProgress && (
                <View style={styles.achievementProgress}>
                  <View style={styles.achievementProgressBar}>
                    <View
                      style={[
                        styles.achievementProgressFill,
                        {
                          width: `${
                            (achievement.progress / achievement.maxProgress) *
                            100
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.achievementProgressText}>
                    {achievement.progress}/{achievement.maxProgress}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const getResponsiveStyles = (dimensions: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#25292e",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: getResponsivePadding(),
      paddingTop: getResponsivePadding(),
      paddingBottom: getResponsivePadding() / 2,
    },
    headerLeft: {
      flex: 1,
    },
    greeting: {
      fontSize: getResponsiveFontSize(16),
      color: "#ccc",
      marginBottom: 4,
    },
    username: {
      fontSize: getResponsiveFontSize(24),
      fontWeight: "bold",
      color: "#fff",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    notificationButton: {
      marginRight: dimensions.isTablet ? 20 : 16,
      position: "relative",
    },
    notificationBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: "#FF6B6B",
      borderRadius: 10,
      width: dimensions.isTablet ? 20 : 18,
      height: dimensions.isTablet ? 20 : 18,
      justifyContent: "center",
      alignItems: "center",
    },
    badgeText: {
      color: "#fff",
      fontSize: getResponsiveFontSize(10),
      fontWeight: "bold",
    },
    profileImage: {
      width: dimensions.isTablet ? 50 : 44,
      height: dimensions.isTablet ? 50 : 44,
      borderRadius: dimensions.isTablet ? 25 : 22,
      borderWidth: 2,
      borderColor: "#ffd33d",
    },
    statsContainer: {
      flexDirection: "row",
      paddingHorizontal: getResponsivePadding(),
      marginTop: getResponsivePadding(),
      gap: dimensions.isTablet ? 16 : 12,
      flexWrap: dimensions.isLargeScreen ? "wrap" : "nowrap",
    },
    statCard: {
      flex: 1,
      backgroundColor: "#333",
      borderRadius: dimensions.isTablet ? 16 : 12,
      padding: dimensions.isTablet ? 20 : 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#444",
      minWidth: dimensions.isLargeScreen ? 200 : undefined,
    },
    statNumber: {
      fontSize: getResponsiveFontSize(20),
      fontWeight: "bold",
      color: "#fff",
      marginTop: 8,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: getResponsiveFontSize(12),
      color: "#888",
      textAlign: "center",
    },
    progressSection: {
      margin: getResponsivePadding(),
      backgroundColor: "#333",
      borderRadius: dimensions.isTablet ? 16 : 12,
      padding: getResponsivePadding(),
      borderWidth: 1,
      borderColor: "#444",
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: getResponsiveFontSize(18),
      fontWeight: "bold",
      color: "#fff",
    },
    levelText: {
      fontSize: getResponsiveFontSize(16),
      color: "#ffd33d",
      fontWeight: "600",
    },
    progressBar: {
      height: dimensions.isTablet ? 10 : 8,
      backgroundColor: "#555",
      borderRadius: dimensions.isTablet ? 5 : 4,
      marginBottom: 8,
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#ffd33d",
      borderRadius: dimensions.isTablet ? 5 : 4,
    },
    progressText: {
      fontSize: getResponsiveFontSize(14),
      color: "#888",
    },
    rankSection: {
      paddingHorizontal: getResponsivePadding(),
      marginBottom: getResponsivePadding(),
    },
    rankCard: {
      backgroundColor: "#333",
      borderRadius: dimensions.isTablet ? 16 : 12,
      padding: getResponsivePadding(),
      borderWidth: 1,
      borderColor: "#444",
    },
    rankInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    rankDetails: {
      marginLeft: 16,
      flex: 1,
    },
    rankTitle: {
      fontSize: getResponsiveFontSize(16),
      color: "#ccc",
      marginBottom: 4,
    },
    rankNumber: {
      fontSize: getResponsiveFontSize(24),
      fontWeight: "bold",
      color: "#ffd33d",
      marginBottom: 2,
    },
    rankSubtext: {
      fontSize: getResponsiveFontSize(12),
      color: "#888",
    },
    viewLeaderboardButton: {
      alignSelf: "flex-end",
    },
    linkButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#ffd33d",
      paddingHorizontal: 16,
      paddingVertical: dimensions.isTablet ? 12 : 8,
      borderRadius: 8,
    },
    linkButtonText: {
      color: "#25292e",
      fontWeight: "600",
      marginRight: 4,
      fontSize: getResponsiveFontSize(14),
    },
    gamesSection: {
      paddingHorizontal: getResponsivePadding(),
      marginBottom: getResponsivePadding(),
    },
    gamesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 12,
      justifyContent: dimensions.isLargeScreen ? "flex-start" : "space-between",
    },
    gameCard: {
      backgroundColor: "#333",
      borderRadius: dimensions.isTablet ? 16 : 12,
      padding: dimensions.isTablet ? 20 : 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#444",
    },
    lockedCard: {
      opacity: 0.6,
    },
    gameIcon: {
      width: dimensions.isTablet ? 64 : 56,
      height: dimensions.isTablet ? 64 : 56,
      borderRadius: dimensions.isTablet ? 32 : 28,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
      position: "relative",
    },
    lockOverlay: {
      position: "absolute",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.7)",
      borderRadius: dimensions.isTablet ? 32 : 28,
      justifyContent: "center",
      alignItems: "center",
    },
    gameTitle: {
      fontSize: getResponsiveFontSize(14),
      fontWeight: "bold",
      color: "#fff",
      textAlign: "center",
      marginBottom: 4,
    },
    gameDescription: {
      fontSize: getResponsiveFontSize(12),
      color: "#888",
      textAlign: "center",
    },
    lockedText: {
      color: "#666",
    },
    achievementsSection: {
      paddingHorizontal: getResponsivePadding(),
      marginBottom: getResponsivePadding(),
    },
    achievementItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#333",
      borderRadius: dimensions.isTablet ? 16 : 12,
      padding: dimensions.isTablet ? 20 : 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: "#444",
    },
    achievementIcon: {
      width: dimensions.isTablet ? 48 : 40,
      height: dimensions.isTablet ? 48 : 40,
      borderRadius: dimensions.isTablet ? 24 : 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementTitle: {
      fontSize: getResponsiveFontSize(16),
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 4,
    },
    achievementDescription: {
      fontSize: getResponsiveFontSize(14),
      color: "#888",
      marginBottom: 8,
    },
    achievementProgress: {
      flexDirection: "row",
      alignItems: "center",
    },
    achievementProgressBar: {
      flex: 1,
      height: 4,
      backgroundColor: "#555",
      borderRadius: 2,
      marginRight: 8,
    },
    achievementProgressFill: {
      height: "100%",
      backgroundColor: "#ffd33d",
      borderRadius: 2,
    },
    achievementProgressText: {
      fontSize: getResponsiveFontSize(12),
      color: "#ffd33d",
      fontWeight: "600",
    },
    loginButton: {
      backgroundColor: "#ffd33d",
      borderRadius: 20,
      padding: 12,
      alignItems: "center",
    },
    loginButtonText: {
      color: "#25292e",
      fontWeight: "bold",
      fontSize: getResponsiveFontSize(14),
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "#25292e",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: getResponsivePadding(),
      borderBottomWidth: 1,
      borderBottomColor: "#444",
    },
    modalTitle: {
      fontSize: getResponsiveFontSize(20),
      fontWeight: "bold",
      color: "#fff",
    },
    modalContent: {
      flex: 1,
    },
    profileSection: {
      alignItems: "center",
      padding: getResponsivePadding(),
      borderBottomWidth: 1,
      borderBottomColor: "#444",
    },
    profileModalImage: {
      width: dimensions.isTablet ? 120 : 100,
      height: dimensions.isTablet ? 120 : 100,
      borderRadius: dimensions.isTablet ? 60 : 50,
      borderWidth: 3,
      borderColor: "#ffd33d",
      marginBottom: getResponsivePadding(),
    },
    usernameContainer: {
      alignItems: "center",
      marginBottom: 12,
    },
    usernameEditContainer: {
      flexDirection: dimensions.isTablet ? "row" : "column",
      alignItems: "center",
      gap: 12,
    },
    usernameInput: {
      backgroundColor: "#333",
      color: "#fff",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#ffd33d",
      fontSize: getResponsiveFontSize(16),
      minWidth: 200,
      textAlign: "center",
    },
    usernameEditButtons: {
      flexDirection: "row",
      gap: 12,
    },
    cancelButton: {
      backgroundColor: "#ffd33d",
      padding: 8,
      borderRadius: 8,
    },
    cancelButtonText: {
      color: "#25292e",
      fontWeight: "bold",
      fontSize: getResponsiveFontSize(16),
    },
    saveButton: {
      backgroundColor: "#4CAF50",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    saveButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: getResponsiveFontSize(14),
    },
    usernameDisplay: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    profileUsername: {
      fontSize: getResponsiveFontSize(24),
      fontWeight: "bold",
      color: "#fff",
    },
    profileLevel: {
      fontSize: getResponsiveFontSize(18),
      color: "#ffd33d",
      fontWeight: "600",
      marginBottom: 4,
    },
    joinDate: {
      fontSize: getResponsiveFontSize(14),
      color: "#888",
    },
    currencySection: {
      flexDirection: dimensions.isTablet ? "row" : "column",
      padding: getResponsivePadding(),
      gap: dimensions.isTablet ? 32 : 16,
      borderBottomWidth: 1,
      borderBottomColor: "#444",
    },
    currencyItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#333",
      borderRadius: 12,
      padding: 16,
      flex: dimensions.isTablet ? 1 : undefined,
    },
    currencyIcon: {
      width: dimensions.isTablet ? 48 : 40,
      height: dimensions.isTablet ? 48 : 40,
      borderRadius: dimensions.isTablet ? 24 : 20,
      backgroundColor: "#FFD700",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    currencyInfo: {
      flex: 1,
    },
    currencyLabel: {
      fontSize: getResponsiveFontSize(14),
      color: "#888",
      marginBottom: 4,
    },
    currencyValue: {
      fontSize: getResponsiveFontSize(20),
      fontWeight: "bold",
      color: "#fff",
    },
    addButton: {
      backgroundColor: "#ffd33d",
      borderRadius: 20,
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    profileStatsSection: {
      padding: getResponsivePadding(),
      borderBottomWidth: 1,
      borderBottomColor: "#444",
    },
    profileSectionTitle: {
      fontSize: getResponsiveFontSize(18),
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 16,
    },
    modalStatsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      justifyContent: "space-around",
    },
    modalStatItem: {
      alignItems: "center",
      minWidth: dimensions.isTablet ? 120 : 80,
      backgroundColor: "#333",
      borderRadius: 8,
      padding: 12,
    },
    modalStatValue: {
      fontSize: getResponsiveFontSize(20),
      fontWeight: "bold",
      color: "#ffd33d",
      marginBottom: 4,
    },
    profileStatLabel: {
      fontSize: getResponsiveFontSize(12),
      color: "#888",
      textAlign: "center",
    },
    experienceSection: {
      padding: getResponsivePadding(),
      borderBottomWidth: 1,
      borderBottomColor: "#444",
    },
    expProgressContainer: {
      flexDirection: dimensions.isTablet ? "row" : "column",
      alignItems: dimensions.isTablet ? "center" : "stretch",
      gap: 12,
    },
    expProgressBar: {
      flex: 1,
      height: dimensions.isTablet ? 12 : 8,
      backgroundColor: "#555",
      borderRadius: dimensions.isTablet ? 6 : 4,
    },
    expProgressFill: {
      height: "100%",
      backgroundColor: "#ffd33d",
      borderRadius: dimensions.isTablet ? 6 : 4,
    },
    expText: {
      fontSize: getResponsiveFontSize(14),
      color: "#888",
      textAlign: dimensions.isTablet ? "left" : "center",
    },
    actionButtonsSection: {
      padding: getResponsivePadding(),
      gap: 12,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#333",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: "#444",
    },
    actionButtonText: {
      fontSize: getResponsiveFontSize(16),
      color: "#fff",
      fontWeight: "600",
      marginLeft: 12,
    },
    closeButton: {
      padding: 8,
    },
    settingsButton: {
      padding: 8,
    },
    centerContent: {
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: "#fff",
      fontSize: getResponsiveFontSize(16),
    },
  });
