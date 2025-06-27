import { Ionicons } from "@expo/vector-icons";
import { Link, router, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Animated,
  Easing,
  StatusBar,
  Vibration,
} from "react-native";
import { apiUtils, authAPI, userAPI, battleAPI } from "../../services/api";
import { getLevelDisplayInfo } from "../../utils/levelUtils";
import Profile from "../../components/Profile";

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

interface UserProfile {
  id?: number;
  username: string;
  usertype?: string;
  email?: string;
  full_name: string;
  avatar: string;
  age?: string;
  coins: number;
  followers_count?: number;
  following_count?: number;
  experience_points: number;
  current_level: number;
  level_progress?: number;
  is_active?: boolean;
  createdAt?: string;
  statistics?: {
    user_id: number;
    games_played: number;
    best_score: number;
    total_score: number;
    createdAt: string;
    updatedAt: string;
  };
  // Legacy fields for compatibility
  gems?: number;
  level?: number;
  experience?: number;
  maxExperience?: number;
  joinDate?: string;
  totalWins?: number;
  totalLosses?: number;
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

  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: "Guest",
    full_name: "Guest User",
    coins: 0,
    experience_points: 0,
    current_level: 1,
    avatar: "https://i.pravatar.cc/100?img=1",
    // Legacy compatibility
    gems: 0,
    level: 1,
    experience: 0,
    maxExperience: 100,
    joinDate: "Recently",
    totalWins: 0,
    totalLosses: 0,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🎨 Interactive Animation States
  const [dailyBonus, setDailyBonus] = useState({
    available: true,
    claimed: false,
  });
  const [streak, setStreak] = useState(3);
  const [showCelebration, setShowCelebration] = useState(false);

  // 🎯 Animation References
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Add at the top, after useState for dailyBonus:
  const [dailyBonusTimer, setDailyBonusTimer] = useState(0);

  // Helper function to calculate real statistics from user data
  const calculateQuickStats = (profileData: any) => {
    if (!profileData?.statistics || !Array.isArray(profileData.statistics)) {
      return {
        todayGames: 0,
        todayScore: 0,
        weeklyGoal: 5000,
        weeklyProgress: 0,
      };
    }

    // Aggregate statistics from all difficulty levels
    const totalGames = profileData.statistics.reduce(
      (sum: number, stat: any) => sum + (stat.games_played || 0),
      0
    );
    const totalScore = profileData.statistics.reduce(
      (sum: number, stat: any) => sum + (stat.total_score || 0),
      0
    );

    // For today's games, we'll use a simplified calculation (could be enhanced with date filtering if needed)
    const todayGames = Math.min(totalGames, 10); // Limit display for better UX
    const todayScore = Math.min(totalScore, 50000); // Limit display for better UX

    return {
      todayGames,
      todayScore,
      weeklyGoal: 5000,
      weeklyProgress: Math.min(totalScore, 5000), // Use total score as weekly progress
    };
  };

  const [quickStats, setQuickStats] = useState({
    todayGames: 0,
    todayScore: 0,
    weeklyGoal: 5000,
    weeklyProgress: 0,
  });

  useEffect(() => {
    checkAuthStatus();
    startAnimations();

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

  // 🎨 Start continuous animations
  const startAnimations = () => {
    // Pulse animation for notifications
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Float animation for game cards
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slide in animation for content
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Progress bar animation
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  // 🆕 Refresh user profile when screen comes into focus (e.g., after completing a game)
  useFocusEffect(
    useCallback(() => {
      const refreshUserProfile = async () => {
        if (isAuthenticated && !checkingAuth) {
          try {
            // Check if there's updated user data from game completion
            const storedData = await userAPI.getStoredUserData();
            if (storedData) {
              console.log("🔄 Refreshing user profile from stored data");

              // Update user profile
              const updatedProfile = {
                ...userProfile,
                current_level:
                  storedData.current_level || userProfile.current_level,
                experience_points:
                  storedData.experience_points || userProfile.experience_points,
                level_progress:
                  storedData.level_progress || userProfile.level_progress,
                coins: storedData.coins || userProfile.coins,
                statistics: storedData.statistics || userProfile.statistics,
              };

              setUserProfile(updatedProfile);

              // Update quick stats with fresh data
              const realStats = calculateQuickStats(storedData);
              setQuickStats(realStats);
              console.log("🔄 Quick stats refreshed:", realStats);
            }
          } catch (error) {
            console.error("Error refreshing user profile:", error);
          }
        }
      };

      refreshUserProfile();
    }, [isAuthenticated, checkingAuth, userProfile.experience_points]) // Add dependency to trigger on XP changes
  );

  const checkAuthStatus = async () => {
    try {
      const authenticated = await apiUtils.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        await fetchUserProfile();
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      console.log("=== FETCHING USER PROFILE ===");

      let profileData = null;

      // First, try to get stored user data from login response
      try {
        profileData = await userAPI.getStoredUserData();
        if (profileData) {
          console.log("Using stored user data from login response");
          console.log("Stored data:", JSON.stringify(profileData, null, 2));
        }
      } catch (error: any) {
        console.log("No stored user data found");
      }

      // If no stored data, try API calls
      if (!profileData) {
        console.log("Attempting to fetch from API...");

        // Try multiple endpoints
        const apiAttempts = [
          () => userAPI.getCurrentUserProfile(),
          () => userAPI.getCurrentUserProfileAlt(),
          // If we have user ID from token, we could try getProfile(userId)
        ];

        for (const attempt of apiAttempts) {
          try {
            profileData = await attempt();
            console.log("Successfully fetched from API");
            break;
          } catch (error: any) {
            console.log("API attempt failed:", error.message);
          }
        }
      }

      if (!profileData) {
        throw new Error("No user data available from any source");
      }

      console.log(
        "Profile data received:",
        JSON.stringify(profileData, null, 2)
      );

      // Map backend response to our interface
      const mappedProfile: UserProfile = {
        id: profileData.id,
        username: profileData.username,
        usertype: profileData.usertype,
        email: profileData.email,
        full_name: profileData.full_name,
        avatar: profileData.avatar || "https://i.pravatar.cc/100?img=1",
        age: profileData.age,
        coins: profileData.coins || 0,
        followers_count: profileData.followers_count || 0,
        following_count: profileData.following_count || 0,
        experience_points: profileData.experience_points || 0,
        current_level: profileData.current_level || 1,
        level_progress: profileData.level_progress || 0,
        is_active: profileData.is_active,
        createdAt: profileData.createdAt,
        statistics: profileData.statistics,

        // Legacy compatibility fields
        gems: Math.floor((profileData.coins || 0) / 100), // Convert coins to gems
        level: profileData.current_level || 1,
        experience: profileData.experience_points || 0,
        maxExperience: (profileData.current_level || 1) * 100, // Simple calculation
        joinDate: profileData.createdAt
          ? new Date(profileData.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "Recently",
        totalWins: 0, // Will be calculated from statistics if needed
        totalLosses: 0, // Will be calculated from statistics if needed
      };

      setUserProfile(mappedProfile);

      // Update quick stats with real data
      const realStats = calculateQuickStats(profileData);
      setQuickStats(realStats);

      console.log("Profile successfully mapped and set");
      console.log("Quick stats calculated:", realStats);

      // --- Daily Bonus Logic ---
      const lastBonus = profileData.last_daily_bonus
        ? new Date(profileData.last_daily_bonus)
        : null;
      const now = new Date();
      let canClaim = false;
      let timer = 0;
      if (!lastBonus) {
        canClaim = true;
      } else {
        const diffMs = now.getTime() - lastBonus.getTime();
        if (diffMs >= 24 * 60 * 60 * 1000) {
          canClaim = true;
        } else {
          timer = 24 * 60 * 60 * 1000 - diffMs;
        }
      }
      setDailyBonus({ available: canClaim, claimed: !canClaim });
      setDailyBonusTimer(timer);
      // --- End Daily Bonus Logic ---
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      Alert.alert(
        "Profile Load Error",
        `Failed to load profile data: ${error.message}\n\nUsing default values for now.`
      );
    }
  };

  const gameCategories: GameCategory[] = [
    {
      id: "practice-mode",
      title: "Practice Mode",
      icon: "school",
      color: "#4CAF50", // Vibrant green like menu
      description: "Practice offline without pressure",
    },
    {
      id: "symbol-match",
      title: "Symbol Match",
      icon: "shapes",
      color: "#FF4757", // Vibrant red like menu
      description: "Match symbols to score points",
    },
    {
      id: "battle-mode",
      title: "Battle Mode",
      icon: "flash",
      color: "#E91E63", // Vibrant pink/magenta
      description: "Challenge other players in real-time",
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
      icon: "library",
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

    try {
      // Check auth status on refresh
      await checkAuthStatus();

      // If authenticated, fetch fresh profile data
      if (isAuthenticated) {
        await fetchUserProfile();
      }
    } catch (error) {
      console.error("Error during refresh:", error);
    } finally {
      // Simulate loading time
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }
  };

  const handleGamePress = (game: GameCategory) => {
    if (game.isLocked) {
      Alert.alert("Game Locked", `Reach level 30 to unlock ${game.title}!`, [
        { text: "OK" },
      ]);
    } else if (game.id === "symbol-match") {
      // Navigate to game menu for Symbol Match
      router.push("/game/menu");
    } else if (game.id === "battle-mode") {
      handleBattleMode();
    } else if (game.id === "practice-mode") {
      handlePracticeMode();
    } else {
      Alert.alert("Start Game", `Ready to play ${game.title}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Play", onPress: () => console.log(`Starting ${game.title}`) },
      ]);
    }
  };

  const handlePracticeMode = () => {
    console.log(`🎮 Starting practice mode from home`);

    router.push({
      pathname: "/game/play",
      params: {
        sessionId: "practice",
        gameType: "Practice Mode",
        title: "Practice Game",
      },
    });
  };

  const handleBattleMode = () => {
    console.log(`⚔️ Opening battle mode from home`);

    // Check if user is authenticated
    if (!isAuthenticated) {
      Alert.alert(
        "Login Required",
        "You need to be logged in to play battle mode.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/(auth)/Auth") },
        ]
      );
      return;
    }

    // Navigate to battle menu
    router.push("/game/duoBattle/battleMenu");
  };

  const handleProfilePress = () => {
    setShowProfileModal(true);
  };

  const handleUpdateProfile = (updatedProfile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updatedProfile }));
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const styles = getResponsiveStyles(dimensions);
  const cardWidth = getGameCardWidth();

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
            await userAPI.clearStoredUserData(); // Clear stored user data
            setIsAuthenticated(false);
            setShowProfileModal(false);
            // Reset user profile to default values
            setUserProfile({
              username: "Guest",
              full_name: "Guest User",
              coins: 0,
              experience_points: 0,
              current_level: 1,
              avatar: "https://i.pravatar.cc/100?img=1",
              gems: 0,
              level: 1,
              experience: 0,
              maxExperience: 100,
              joinDate: "Recently",
              totalWins: 0,
              totalLosses: 0,
            });
            Alert.alert("Success", "You have been logged out successfully.");
          } catch (error: any) {
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

  // 🎉 Interactive Features
  const handleDailyBonus = async () => {
    if (!dailyBonus.available || dailyBonus.claimed) return;
    setLoading(true);
    try {
      const result = await userAPI.claimDailyBonus();
      if (result.success) {
        Vibration.vibrate(100);
        setDailyBonus({ available: false, claimed: true });
        setShowCelebration(true);
        setUserProfile((prev) => ({ ...prev, coins: result.coins }));
        setDailyBonusTimer(24 * 60 * 60 * 1000); // 24h until next claim
        // Celebration animation
        Animated.sequence([
          Animated.timing(celebrationScale, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(celebrationScale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => setShowCelebration(false));
      } else {
        // Already claimed, show timer
        if (result.time_left_ms) {
          setDailyBonus({ available: false, claimed: true });
          setDailyBonusTimer(result.time_left_ms);
          Alert.alert("Daily Bonus", result.message || "Already claimed.");
        } else {
          Alert.alert(
            "Daily Bonus",
            result.message || "Could not claim bonus."
          );
        }
      }
    } catch (err) {
      Alert.alert("Daily Bonus", "Could not claim bonus.");
    } finally {
      setLoading(false);
    }
  };

  // Add a useEffect to update the timer countdown every second
  useEffect(() => {
    if (!dailyBonus.claimed || dailyBonusTimer <= 0) return;
    const interval = setInterval(() => {
      setDailyBonusTimer((prev) => {
        if (prev <= 1000) {
          setDailyBonus({ available: true, claimed: false });
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [dailyBonus.claimed, dailyBonusTimer]);

  const handleQuickStart = (mode: string) => {
    Vibration.vibrate(50);

    // Quick start animation
    const button = mode === "practice" ? pulseAnimation : floatAnimation;
    Animated.sequence([
      Animated.timing(button, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(button, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (mode === "practice") {
      handlePracticeMode();
    } else if (mode === "battle") {
      handleBattleMode();
    }
  };

  const handleNotificationPress = () => {
    Vibration.vibrate(50);
    Alert.alert(
      "🔔 Notifications",
      "• Daily bonus available!\n• Your friend challenged you\n• New achievement unlocked",
      [{ text: "Close" }]
    );
  };

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
      <Animated.View
        style={[
          styles.header,
          {
            transform: [
              {
                translateY: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
            opacity: slideAnimation,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}!</Text>
          <Text style={styles.username}>
            {isAuthenticated ? userProfile.username : "Guest"}
          </Text>
          {isAuthenticated && (
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={16} color="#FF6B35" />
              <Text style={styles.streakText}>{streak} day streak!</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationPress}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
              <Ionicons
                name="notifications"
                size={getResponsiveFontSize(24)}
                color="#ffd33d"
              />
            </Animated.View>
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
      </Animated.View>

      {/* Show profile modal only for authenticated users */}
      {isAuthenticated && (
        <Profile
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
          onLogout={handleLogout}
        />
      )}

      {/* 🎁 Daily Bonus Section */}
      {isAuthenticated && (
        <Animated.View
          style={[
            styles.dailyBonusSection,
            {
              transform: [
                {
                  translateX: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
              opacity: slideAnimation,
            },
          ]}
        >
          <View style={styles.dailyBonusHeader}>
            <View style={styles.dailyBonusInfo}>
              <Text style={styles.dailyBonusTitle}>🎁 Daily Bonus</Text>
              <Text style={styles.dailyBonusSubtitle}>Claim your reward!</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dailyBonusButton,
                dailyBonus.claimed && styles.dailyBonusButtonClaimed,
              ]}
              onPress={handleDailyBonus}
              disabled={dailyBonus.claimed || loading}
            >
              <Text style={styles.dailyBonusButtonText}>
                {dailyBonus.claimed
                  ? dailyBonusTimer > 0
                    ? `⏳ ${Math.ceil(dailyBonusTimer / 1000 / 60)} min`
                    : "✅ Claimed"
                  : "50 💰"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickStatsRow}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>
                {quickStats.todayGames}
              </Text>
              <Text style={styles.quickStatLabel}>Today Games</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>
                {formatNumber(quickStats.todayScore)}
              </Text>
              <Text style={styles.quickStatLabel}>Today Score</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>
                {Math.round(
                  (quickStats.weeklyProgress / quickStats.weeklyGoal) * 100
                )}
                %
              </Text>
              <Text style={styles.quickStatLabel}>Weekly Goal</Text>
            </View>
          </View>
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.progressSection,
          {
            transform: [
              {
                translateX: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
            opacity: slideAnimation,
          },
        ]}
      >
        <View style={styles.progressHeader}>
          <Text style={styles.sectionTitle}>Level Progress</Text>
          <Text style={styles.levelText}>
            Level{" "}
            {(() => {
              const levelInfo = getLevelDisplayInfo(userProfile);
              return levelInfo.currentLevel;
            })()}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(() => {
                  const levelInfo = getLevelDisplayInfo(userProfile);
                  return levelInfo.isMaxLevel ? 100 : levelInfo.progressPercent;
                })()}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {(() => {
            const levelInfo = getLevelDisplayInfo(userProfile);
            if (levelInfo.isMaxLevel) {
              return `🏆 Max Level Reached! ${levelInfo.formattedCurrentXP} XP`;
            }
            return `${levelInfo.formattedCurrentXP} / ${levelInfo.formattedNextLevelXP} XP to next level`;
          })()}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.gamesSection,
          {
            transform: [
              {
                scale: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
            opacity: slideAnimation,
          },
        ]}
      >
        <Text style={styles.sectionTitle}>🎮 Game Modes</Text>
        <View style={styles.gameModeContainer}>
          {/* Practice Mode */}
          <Animated.View
            style={{
              transform: [
                {
                  translateY: floatAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.practiceButton}
              onPress={() => handleQuickStart("practice")}
              activeOpacity={0.8}
            >
              <Ionicons name="school" size={24} color="#fff" />
              <Text style={styles.practiceButtonText}>🎯 Practice Mode</Text>
              <Text style={styles.practiceButtonSubtext}>
                Offline • No progress saved
              </Text>
              <View style={styles.quickStartBadge}>
                <Text style={styles.quickStartText}>QUICK START</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Symbol Match - Browse Games */}
          <Animated.View
            style={{
              transform: [
                {
                  translateY: floatAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 5],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.symbolMatchButton}
              onPress={() => handleGamePress(gameCategories[1])}
              activeOpacity={0.8}
            >
              <Ionicons name="shapes" size={24} color="#fff" />
              <Text style={styles.symbolMatchButtonText}>🎯 Symbol Match</Text>
              <Text style={styles.symbolMatchButtonSubtext}>
                Browse available games
              </Text>
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Battle Mode */}
          <Animated.View
            style={{
              transform: [
                {
                  translateY: floatAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -3],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.battleModeButton}
              onPress={() => handleQuickStart("battle")}
              activeOpacity={0.8}
            >
              <Ionicons name="flash" size={24} color="#fff" />
              <Text style={styles.battleModeButtonText}>⚔️ Battle Mode</Text>
              <Text style={styles.battleModeButtonSubtext}>
                Challenge other players
              </Text>
              <View style={styles.newBadge}>
                <Text style={styles.newText}>NEW</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        {/* 🎉 Celebration Overlay */}
        {showCelebration && (
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.8)",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              },
              {
                transform: [{ scale: celebrationScale }],
                opacity: celebrationScale,
              },
            ]}
          >
            <View
              style={{
                backgroundColor: "#4CAF50",
                borderRadius: 20,
                padding: 30,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 40, marginBottom: 10 }}>🎉</Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: getResponsiveFontSize(24),
                  fontWeight: "bold",
                  marginBottom: 10,
                }}
              >
                Daily Bonus Claimed!
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: getResponsiveFontSize(18),
                }}
              >
                +50 Coins Added!
              </Text>
            </View>
          </Animated.View>
        )}

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
    streakContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    streakText: {
      fontSize: getResponsiveFontSize(12),
      color: "#FF6B35",
      fontWeight: "600",
      marginLeft: 4,
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

    dailyBonusSection: {
      margin: getResponsivePadding(),
      backgroundColor: "#2A2D35",
      borderRadius: dimensions.isTablet ? 16 : 12,
      padding: getResponsivePadding(),
      borderWidth: 1,
      borderColor: "#4CAF50",
      marginBottom: getResponsivePadding() / 2,
    },
    dailyBonusHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    dailyBonusInfo: {
      flex: 1,
    },
    dailyBonusTitle: {
      fontSize: getResponsiveFontSize(18),
      fontWeight: "bold",
      color: "#4CAF50",
      marginBottom: 2,
    },
    dailyBonusSubtitle: {
      fontSize: getResponsiveFontSize(14),
      color: "#ccc",
    },
    dailyBonusButton: {
      backgroundColor: "#4CAF50",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    dailyBonusButtonClaimed: {
      backgroundColor: "#666",
    },
    dailyBonusButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: getResponsiveFontSize(14),
    },
    quickStatsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    quickStat: {
      alignItems: "center",
      flex: 1,
    },
    quickStatNumber: {
      fontSize: getResponsiveFontSize(20),
      fontWeight: "bold",
      color: "#4CAF50",
      marginBottom: 4,
    },
    quickStatLabel: {
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
    gameModeContainer: {
      paddingHorizontal: getResponsivePadding(),
      marginTop: 12,
    },
    symbolMatchButton: {
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: "#FF4757",
      padding: 20,
      borderRadius: 15,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
    symbolMatchButtonText: {
      color: "#fff",
      fontSize: getResponsiveFontSize(18),
      fontWeight: "bold",
      marginLeft: 8,
      textAlign: "center",
    },
    symbolMatchButtonSubtext: {
      color: "#FFE8E8",
      fontSize: getResponsiveFontSize(12),
      marginTop: 5,
      textAlign: "center",
      fontStyle: "italic",
    },
    practiceButton: {
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: "#4CAF50",
      padding: 20,
      borderRadius: 15,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
    practiceButtonText: {
      color: "#fff",
      fontSize: getResponsiveFontSize(18),
      fontWeight: "bold",
      marginLeft: 8,
      textAlign: "center",
    },
    practiceButtonSubtext: {
      color: "#E8F5E8",
      fontSize: getResponsiveFontSize(12),
      marginTop: 5,
      textAlign: "center",
      fontStyle: "italic",
    },
    battleModeButton: {
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: "#E91E63",
      padding: 20,
      borderRadius: 15,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
    battleModeButtonText: {
      color: "#fff",
      fontSize: getResponsiveFontSize(18),
      fontWeight: "bold",
      marginLeft: 8,
      textAlign: "center",
    },
    battleModeButtonSubtext: {
      color: "#FCE4EC",
      fontSize: getResponsiveFontSize(12),
      marginTop: 5,
      textAlign: "center",
      fontStyle: "italic",
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
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: "center",
      flexDirection: "row",
    },
    loginButtonText: {
      color: "#25292e",
      fontWeight: "bold",
      fontSize: getResponsiveFontSize(12),
      marginLeft: 4,
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
    socialSection: {
      padding: getResponsivePadding(),
      borderBottomWidth: 1,
      borderBottomColor: "#444",
    },
    socialStatsContainer: {
      flexDirection: dimensions.isTablet ? "row" : "column",
      gap: dimensions.isTablet ? 32 : 16,
    },
    socialStatItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#333",
      borderRadius: 12,
      padding: 16,
      flex: dimensions.isTablet ? 1 : undefined,
    },
    socialIcon: {
      width: dimensions.isTablet ? 48 : 40,
      height: dimensions.isTablet ? 48 : 40,
      borderRadius: dimensions.isTablet ? 24 : 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    socialInfo: {
      flex: 1,
    },
    socialStatLabel: {
      fontSize: getResponsiveFontSize(14),
      color: "#888",
      marginBottom: 4,
    },
    socialStatValue: {
      fontSize: getResponsiveFontSize(20),
      fontWeight: "bold",
      color: "#fff",
    },
    // 🆕 Level Detail Styles
    levelDetailsContainer: {
      marginTop: 16,
      backgroundColor: "#2a2a2a",
      borderRadius: 8,
      padding: 12,
    },
    levelDetailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
    },
    levelDetailLabel: {
      fontSize: getResponsiveFontSize(14),
      color: "#888",
    },
    levelDetailValue: {
      fontSize: getResponsiveFontSize(14),
      fontWeight: "600",
      color: "#ffd33d",
    },
    // 🎯 Badge Styles for Game Cards
    quickStartBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: "#4CAF50",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    quickStartText: {
      color: "#fff",
      fontSize: getResponsiveFontSize(10),
      fontWeight: "bold",
    },
    popularBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: "#FF9800",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    popularText: {
      color: "#fff",
      fontSize: getResponsiveFontSize(10),
      fontWeight: "bold",
    },
    newBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: "#E91E63",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    newText: {
      color: "#fff",
      fontSize: getResponsiveFontSize(10),
      fontWeight: "bold",
    },
  });
