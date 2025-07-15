import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchLeaderboard,
  fetchAvailableMonths,
  userAPI,
  socialAPI,
  leaderboardAPI,
} from "../../services/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  full_name?: string;
  score: number;
  avatar: string;
  level: number;
  region?: string;
  country?: string;
  countryFlag?: string;
  total_time?: number;
  total_games?: number;
  medal?: string;
  isTopThree?: boolean;
  isCurrentUser?: boolean;
  user_statistics_id?: number;
  user_id?: number;
  userStatistics?: any;
  rank_position?: number;
  time?: number;
  created_at?: string;
}

type DifficultyLevel = 1 | 2 | 3;
type RegionFilter = "global" | "asia" | "america" | "europe" | "others";

interface MonthOption {
  month_year: string;
  display_name: string;
}

interface UserProfile {
  id: number;
  username: string;
  full_name?: string;
  avatar?: string;
  current_level?: number;
  experience_points?: number;
  country?: string;
  followers_count?: number;
  following_count?: number;
  coins?: number;
  statistics?: any[];
  created_at?: string;
  error?: boolean;
}

const MobileLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyLevel>(1);
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>("global");
  const [showFilters, setShowFilters] = useState(false);

  // Month selection
  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthsLoading, setMonthsLoading] = useState(false);

  // Profile modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [lastProfileRequest, setLastProfileRequest] = useState("");

  const [metadata, setMetadata] = useState({
    total_players: 0,
    difficulty_level: 1,
    region: "global",
    source: "",
  });

  useEffect(() => {
    loadAvailableMonths();
  }, [selectedDifficulty, selectedRegion]);

  useEffect(() => {
    if (selectedMonth !== null) {
      loadLeaderboard();
    }
  }, [selectedMonth, selectedDifficulty, selectedRegion]);

  useEffect(() => {
    getCurrentUser();
  }, []);

  // Load available months for historical data
  const loadAvailableMonths = async () => {
    setMonthsLoading(true);
    try {
      // Always start with Live Data option
      const months: MonthOption[] = [
        {
          month_year: "live",
          display_name: "🔴 Live Data",
        },
      ];

      try {
        // Fetch available months from API
        const response = await fetchAvailableMonths({
          difficulty_level: selectedDifficulty,
          region: selectedRegion !== "global" ? selectedRegion : null,
        });

        if (
          response?.success &&
          response.data &&
          Array.isArray(response.data)
        ) {
          // Add API months to the list
          const apiMonths = response.data.map((item: any) => ({
            month_year: item.month_year,
            display_name:
              item.display_name ||
              `${item.month_year.split("-")[1]}/${
                item.month_year.split("-")[0]
              }`,
          }));

          // Sort months in descending order (newest first)
          const sortedApiMonths = apiMonths.sort(
            (a: MonthOption, b: MonthOption) =>
              b.month_year.localeCompare(a.month_year)
          );

          // Combine live data with API months
          months.push(...sortedApiMonths);

          console.log("✅ Available months loaded from API:", {
            totalMonths: response.data.length,
            months: months.map((m) => m.display_name),
          });
        } else {
          console.log(
            "⚠️ API response was empty or failed, no historical months available"
          );
        }
      } catch (apiError) {
        console.error("⚠️ API failed to fetch available months:", apiError);
        // If API fails, we still have live data option
      }

      setAvailableMonths(months);

      // Set default selection to live data if no month is selected
      if (!selectedMonth) {
        setSelectedMonth("live");
      }
    } catch (error) {
      console.error("❌ Error loading available months:", error);
      // Fallback to just live data if everything fails
      setAvailableMonths([
        { month_year: "live", display_name: "🔴 Live Data" },
      ]);
      if (!selectedMonth) {
        setSelectedMonth("live");
      }
    } finally {
      setMonthsLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    if (loading) return;

    try {
      setLoading(true);
      console.log("🔄 Loading leaderboard...", {
        difficulty: selectedDifficulty,
        region: selectedRegion,
        selectedMonth,
        isLiveData: selectedMonth === "live",
      });

      let leaderboard: LeaderboardEntry[] = [];

      if (selectedMonth === "live") {
        console.log("🔴 Loading LIVE data from Redis...");
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(
          currentDate.getMonth() + 1
        ).padStart(2, "0")}`;

        const filters = {
          difficulty_level: selectedDifficulty,
          region: selectedRegion,
          limit: 100,
          month_year: currentMonth,
        };

        const response = await leaderboardAPI.getMonthlyLeaderboardFromRedis(
          filters
        );

        if (
          response?.success &&
          response?.data &&
          Array.isArray(response.data)
        ) {
          const mappedData = response.data.map(
            (player: any, index: number) => ({
              id: player.user_id?.toString() || `redis_${index}`,
              rank: player.rank_position || index + 1,
              username:
                player.username || player.full_name || `Player ${index + 1}`,
              full_name: player.full_name,
              score: player.score || 0,
              avatar: player.avatar || "https://i.pravatar.cc/150?img=1",
              level: player.current_level || 1,
              region: player.region || selectedRegion,
              country: player.country,
              countryFlag: player.countryFlag,
              total_time: player.total_time || 0,
              total_games: player.total_games || 0,
              medal: player.medal,
              isTopThree: (player.rank_position || index + 1) <= 3,
              isCurrentUser: false,
              user_id: player.user_id,
              user_statistics_id: player.user_statistics_id,
              userStatistics: player.userStatistics,
              rank_position: player.rank_position,
              time: player.total_time,
              created_at: player.created_at,
            })
          );

          const uniqueMap = new Map();
          mappedData.forEach((player: LeaderboardEntry) => {
            const key = player.user_id || player.id;
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, player);
            }
          });

          leaderboard = Array.from(uniqueMap.values()).sort(
            (a, b) => a.rank - b.rank
          );
          setMetadata({
            total_players: leaderboard.length,
            difficulty_level: selectedDifficulty,
            region: selectedRegion,
            source: "redis_monthly_leaderboard",
          });
        } else {
          console.log("⚠️ Redis response was empty or failed");
          leaderboard = [];
        }
      } else {
        console.log(
          `📅 Loading HISTORICAL data from PostgreSQL for month: ${selectedMonth}`
        );
        const filters = {
          difficulty_level: selectedDifficulty,
          region: selectedRegion,
          month_year: selectedMonth,
        };

        const response = await fetchLeaderboard(filters);

        if (response?.success && response.data) {
          leaderboard = response.data.map((player: any, index: number) => ({
            id:
              player.user_statistics_id?.toString() ||
              player.id?.toString() ||
              `pg_${index}`,
            rank: player.rank_position || index + 1,
            username:
              player.full_name || player.username || `Player ${index + 1}`,
            full_name: player.full_name,
            score: player.score || 0,
            avatar: player.avatar || "https://i.pravatar.cc/150?img=1",
            level: player.current_level || 1,
            region: player.region || selectedRegion,
            country: player.country,
            countryFlag: player.countryFlag,
            total_time: player.total_time || 0,
            total_games: player.total_games || 0,
            medal: player.medal,
            isTopThree: (player.rank_position || index + 1) <= 3,
            isCurrentUser: false,
            user_statistics_id: player.user_statistics_id,
            rank_position: player.rank_position || index + 1,
            time: player.time || player.total_time,
            created_at: player.created_at,
          }));

          setMetadata({
            total_players: leaderboard.length,
            difficulty_level: selectedDifficulty,
            region: selectedRegion,
            source: "postgresql_historical",
          });
        } else {
          console.log("⚠️ PostgreSQL response was empty or failed");
          leaderboard = [];
        }
      }

      setLeaderboardData(leaderboard);
    } catch (error) {
      console.error("❌ Failed to load leaderboard:", error);
      setLeaderboardData([]);
      Alert.alert(
        "Connection Error",
        "Failed to load leaderboard. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Get current user info
  const getCurrentUser = async () => {
    try {
      const storedUser = await userAPI.getCurrentUserProfile();
      const user = {
        ...(storedUser?.user || storedUser),
        id: storedUser?.user?.id || storedUser?.id,
      };
      setCurrentUser(user);
    } catch (error) {
      try {
        const storedData = await userAPI.getStoredUserData();
        if (storedData) {
          setCurrentUser(storedData);
        }
      } catch (storageError) {
        console.error("❌ Error getting stored user data:", storageError);
      }
    }
  };

  // Check if current user is following the profile user
  const checkFollowStatus = async (userId: number) => {
    try {
      if (!currentUser?.id) return;
      const followingResponse = await socialAPI.getFollowing(currentUser.id);
      const isUserFollowed = followingResponse.following?.some(
        (follow: any) => follow.following_id === userId || follow.id === userId
      );
      setIsFollowing(isUserFollowed || false);
    } catch (error) {
      console.error("❌ Error checking follow status:", error);
      setIsFollowing(false);
    }
  };

  // Handle view user profile
  const handleViewUserProfile = async (player: LeaderboardEntry) => {
    const playerId = player.user_statistics_id || player.user_id;
    if (profileLoading || lastProfileRequest === playerId?.toString()) return;

    if (player.isCurrentUser) {
      Alert.alert(
        "Info",
        "This is your own profile! You can view it from the home screen."
      );
      return;
    }

    setShowProfileModal(true);
    setSelectedUserProfile(null);
    setIsFollowing(false);
    setLastProfileRequest(playerId?.toString() || "");

    try {
      setProfileLoading(true);
      let userId = null;
      if (player.userStatistics?.user?.id) {
        userId = player.userStatistics.user.id;
      } else if (player.userStatistics?.user_id) {
        userId = player.userStatistics.user_id;
      } else if (player.user_statistics_id) {
        userId = player.user_statistics_id;
      } else if (player.user_id) {
        userId = player.user_id;
      } else if (player.id) {
        userId =
          typeof player.id === "string" ? parseInt(player.id) : player.id;
      }

      if (!userId) {
        throw new Error("Unable to find user ID for this player");
      }

      const profileResponse = await socialAPI.getUserStats(userId);
      const userData = {
        ...profileResponse.user,
        id: profileResponse.user?.id || userId,
      };
      setSelectedUserProfile(userData);
      await checkFollowStatus(userId);
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      setSelectedUserProfile({
        error: true,
        username: player.username,
        id:
          typeof player.id === "string" ? parseInt(player.id) : player.id || 0,
      });
    } finally {
      setProfileLoading(false);
      setTimeout(() => setLastProfileRequest(""), 1000);
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!currentUser?.id || !selectedUserProfile?.id) {
      Alert.alert("Error", "Unable to follow at this time");
      return;
    }

    if (currentUser.id === selectedUserProfile.id) {
      Alert.alert("Info", "You cannot follow yourself!");
      return;
    }

    try {
      setFollowLoading(true);
      if (isFollowing) {
        await socialAPI.unfollowUser(selectedUserProfile.id);
        setIsFollowing(false);
        setSelectedUserProfile((prev) => {
          if (!prev || prev.error) return prev;
          return {
            ...prev,
            followers_count: Math.max(0, (prev.followers_count || 0) - 1),
          };
        });
      } else {
        try {
          await socialAPI.followUser(selectedUserProfile.id);
          setIsFollowing(true);
          setSelectedUserProfile((prev) => {
            if (!prev || prev.error) return prev;
            return {
              ...prev,
              followers_count: (prev.followers_count || 0) + 1,
            };
          });
        } catch (followError: any) {
          if (followError.message?.includes("Already following")) {
            setIsFollowing(true);
            await checkFollowStatus(selectedUserProfile.id);
            return;
          }
          throw followError;
        }
      }
    } catch (error) {
      console.error("❌ Error toggling follow:", error);
      if (!String(error).includes("Already following")) {
        setIsFollowing(!isFollowing);
        Alert.alert(
          "Error",
          isFollowing
            ? "Failed to unfollow user. Please try again."
            : "Failed to follow user. Please try again."
        );
      }
    } finally {
      setFollowLoading(false);
    }
  };

  // Helper function to aggregate statistics
  const getAggregatedStats = (statisticsArray: any[]) => {
    if (!statisticsArray || !Array.isArray(statisticsArray)) {
      return {
        games_played: 0,
        best_score: 0,
        total_score: 0,
        best_score_time: null,
      };
    }

    return statisticsArray.reduce(
      (acc, stat) => {
        return {
          games_played: acc.games_played + (stat.games_played || 0),
          best_score: Math.max(acc.best_score, stat.best_score || 0),
          total_score: acc.total_score + (stat.total_score || 0),
          best_score_time: stat.best_score_time || acc.best_score_time,
        };
      },
      { games_played: 0, best_score: 0, total_score: 0, best_score_time: null }
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1:
        return "Easy";
      case 2:
        return "Medium";
      case 3:
        return "Hard";
      default:
        return "Easy";
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1:
        return "#10B981";
      case 2:
        return "#F59E0B";
      case 3:
        return "#EF4444";
      default:
        return "#10B981";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCountryFlag = (countryCode: string): string => {
    if (!countryCode) return "";
    const flagMap: { [key: string]: string } = {
      US: "🇺🇸",
      VN: "🇻🇳",
      JP: "🇯🇵",
      KR: "🇰🇷",
      CN: "🇨🇳",
      DE: "🇩🇪",
      FR: "🇫🇷",
      GB: "🇬🇧",
      UK: "🇬🇧",
      BR: "🇧🇷",
      CA: "🇨🇦",
      AU: "🇦🇺",
      IN: "🇮🇳",
      IT: "🇮🇹",
      ES: "🇪🇸",
      MX: "🇲🇽",
      RU: "🇷🇺",
      TH: "🇹🇭",
      SG: "🇸🇬",
      MY: "🇲🇾",
    };
    return flagMap[countryCode.toUpperCase()] || "🌍";
  };

  const renderPlayerItem = (player: LeaderboardEntry) => (
    <TouchableOpacity
      key={player.rank}
      style={[styles.playerItem, player.isTopThree && styles.topThreeItem]}
      onPress={() => handleViewUserProfile(player)}
    >
      <View
        style={[
          styles.rankBadge,
          { backgroundColor: player.isTopThree ? "#F59E0B" : "#7C3AED" },
        ]}
      >
        <Text
          style={[styles.rankText, player.isTopThree && styles.topThreeRank]}
        >
          {player.rank}
        </Text>
      </View>

      <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />

      <View style={styles.playerInfo}>
        <View style={styles.playerNameRow}>
          <Text style={styles.playerName} numberOfLines={1}>
            {player.username}
          </Text>
          <Text style={styles.countryFlag}>
            {getCountryFlag(player.country || "")}
          </Text>
          {player.isTopThree && (
            <Text style={styles.medal}>
              {player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : "🥉"}
            </Text>
          )}
        </View>

        <View style={styles.playerStats}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={12} color="#A855F7" />
            <Text style={styles.statText}>Lv.{player.level}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={12} color="#A855F7" />
            <Text style={styles.statText}>
              {formatTime(player.total_time || 0)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="game-controller" size={12} color="#A855F7" />
            <Text style={styles.statText}>{player.total_games || 0} games</Text>
          </View>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={styles.playerScore}>{player.score.toLocaleString()}</Text>
        <Text style={styles.playerRegion}>{player.region}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Leaderboard</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Difficulty Level</Text>
            <View style={styles.filterOptions}>
              {[1, 2, 3].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.filterOption,
                    selectedDifficulty === level && styles.selectedFilterOption,
                  ]}
                  onPress={() =>
                    setSelectedDifficulty(level as DifficultyLevel)
                  }
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedDifficulty === level &&
                        styles.selectedFilterOptionText,
                    ]}
                  >
                    {getDifficultyLabel(level)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Region</Text>
            <View style={styles.filterOptions}>
              {[
                { value: "global", label: "Global" },
                { value: "asia", label: "Asia" },
                { value: "america", label: "America" },
                { value: "europe", label: "Europe" },
                { value: "others", label: "Others" },
              ].map((region) => (
                <TouchableOpacity
                  key={region.value}
                  style={[
                    styles.filterOption,
                    selectedRegion === region.value &&
                      styles.selectedFilterOption,
                  ]}
                  onPress={() =>
                    setSelectedRegion(region.value as RegionFilter)
                  }
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedRegion === region.value &&
                        styles.selectedFilterOptionText,
                    ]}
                  >
                    {region.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Time Period</Text>
            <View style={styles.filterOptions}>
              {availableMonths.slice(0, 6).map((month) => (
                <TouchableOpacity
                  key={month.month_year}
                  style={[
                    styles.filterOption,
                    selectedMonth === month.month_year &&
                      styles.selectedFilterOption,
                  ]}
                  onPress={() => setSelectedMonth(month.month_year)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedMonth === month.month_year &&
                        styles.selectedFilterOptionText,
                    ]}
                  >
                    {month.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderProfileModal = () => (
    <Modal
      visible={showProfileModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowProfileModal(false);
        setSelectedUserProfile(null);
        setLastProfileRequest("");
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Player Profile</Text>
            <TouchableOpacity
              onPress={() => {
                setShowProfileModal(false);
                setSelectedUserProfile(null);
                setLastProfileRequest("");
              }}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {profileLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loadingText}>Loading profile...</Text>
              </View>
            ) : selectedUserProfile ? (
              selectedUserProfile.error ? (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color="#FF6B6B"
                  />
                  <Text style={styles.errorText}>
                    Failed to load {selectedUserProfile.username}&apos;s profile
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                      setSelectedUserProfile(null);
                      setProfileLoading(true);
                    }}
                  >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.profileContainer}>
                  <Image
                    source={{
                      uri:
                        selectedUserProfile.avatar ||
                        "https://i.pravatar.cc/150?img=1",
                    }}
                    style={styles.profileImage}
                  />
                  <Text style={styles.profileUsername}>
                    {selectedUserProfile.full_name ||
                      selectedUserProfile.username}
                  </Text>
                  <Text style={styles.profileLevel}>
                    Level {selectedUserProfile.current_level || 1}
                  </Text>
                  {selectedUserProfile.country && (
                    <Text style={styles.profileCountry}>
                      {getCountryFlag(selectedUserProfile.country)}{" "}
                      {selectedUserProfile.country}
                    </Text>
                  )}

                  <View style={styles.socialSection}>
                    <View style={styles.socialStatsRow}>
                      <View style={styles.socialStatContainer}>
                        <Text style={styles.socialStatNumber}>
                          {selectedUserProfile.followers_count || 0}
                        </Text>
                        <Text style={styles.socialStatLabel}>Followers</Text>
                      </View>
                      <View style={styles.socialStatContainer}>
                        <Text style={styles.socialStatNumber}>
                          {selectedUserProfile.following_count || 0}
                        </Text>
                        <Text style={styles.socialStatLabel}>Following</Text>
                      </View>
                      <View style={styles.socialStatContainer}>
                        <Text style={styles.socialStatNumber}>
                          {selectedUserProfile.coins || 0}
                        </Text>
                        <Text style={styles.socialStatLabel}>Coins</Text>
                      </View>
                    </View>

                    {currentUser?.id &&
                      selectedUserProfile?.id !== currentUser?.id && (
                        <TouchableOpacity
                          style={[
                            styles.followButton,
                            isFollowing && styles.followingButton,
                          ]}
                          onPress={handleFollowToggle}
                          disabled={followLoading}
                        >
                          {followLoading ? (
                            <Text
                              style={[
                                styles.followButtonText,
                                isFollowing && styles.followingButtonText,
                              ]}
                            >
                              {isFollowing ? "Unfollowing..." : "Following..."}
                            </Text>
                          ) : (
                            <>
                              <Ionicons
                                name={
                                  isFollowing ? "person-remove" : "person-add"
                                }
                                size={16}
                                color={isFollowing ? "#666" : "#25292e"}
                              />
                              <Text
                                style={[
                                  styles.followButtonText,
                                  isFollowing && styles.followingButtonText,
                                ]}
                              >
                                {isFollowing ? "Following" : "Follow"}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                  </View>

                  <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>Game Statistics</Text>
                    {(() => {
                      const stats = getAggregatedStats(
                        selectedUserProfile.statistics || []
                      );
                      return (
                        <View style={styles.statsGrid}>
                          <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                              {stats.best_score}
                            </Text>
                            <Text style={styles.statLabel}>Best Score</Text>
                          </View>
                          <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                              {stats.games_played}
                            </Text>
                            <Text style={styles.statLabel}>Games Played</Text>
                          </View>
                          <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                              {stats.total_score}
                            </Text>
                            <Text style={styles.statLabel}>Total Score</Text>
                          </View>
                          <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                              {selectedUserProfile.experience_points || 0}
                            </Text>
                            <Text style={styles.statLabel}>Experience</Text>
                          </View>
                        </View>
                      );
                    })()}
                  </View>
                </View>
              )
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />

      <View style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="trophy" size={32} color="#F59E0B" />
            <Text style={styles.headerTitle}>Leaderboard</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {selectedMonth === "live"
              ? "⚡ Live monthly rankings"
              : `📅 ${
                  availableMonths.find((m) => m.month_year === selectedMonth)
                    ?.display_name || selectedMonth
                }`}
          </Text>
        </View>

        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={20} color="#FFF" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>

          <View style={styles.currentFilters}>
            <View
              style={[
                styles.filterTag,
                { backgroundColor: getDifficultyColor(selectedDifficulty) },
              ]}
            >
              <Text style={styles.filterTagText}>
                {getDifficultyLabel(selectedDifficulty)}
              </Text>
            </View>
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>{selectedRegion}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : (
            <>
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Ionicons name="people" size={24} color="#A855F7" />
                  <Text style={styles.statLabel}>Total Players</Text>
                  <Text style={styles.statValue}>{metadata.total_players}</Text>
                </View>
              </View>

              <View style={styles.rankingsContainer}>
                <Text style={styles.rankingsTitle}>📊 Full Rankings</Text>
                {leaderboardData.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="trophy-outline" size={64} color="#444" />
                    <Text style={styles.emptyTitle}>No Players Found</Text>
                    <Text style={styles.emptySubtitle}>
                      Be the first to play and set a record!
                    </Text>
                  </View>
                ) : (
                  leaderboardData.map(renderPlayerItem)
                )}
              </View>
            </>
          )}
        </ScrollView>

        {renderFiltersModal()}
        {renderProfileModal()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
  },
  gradient: {
    flex: 1,
    backgroundColor: "#25292e",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    textAlign: "center",
    color: "#ccc",
    fontSize: 14,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#444",
    borderRadius: 8,
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  currentFilters: {
    flexDirection: "row",
    gap: 8,
  },
  filterTag: {
    backgroundColor: "#ffd33d",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterTagText: {
    color: "#25292e",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    color: "#ccc",
    marginTop: 16,
    fontSize: 16,
  },
  statsContainer: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: {
    color: "#ccc",
    fontSize: 14,
  },
  statValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  rankingsContainer: {
    marginBottom: 24,
  },
  rankingsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 16,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ffd33d",
  },
  topThreeItem: {
    borderLeftColor: "#F59E0B",
    backgroundColor: "#3a3a3a",
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#444",
  },
  rankText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  topThreeRank: {
    color: "#ffd33d",
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#ffd33d",
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  playerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  countryFlag: {
    fontSize: 18,
  },
  medal: {
    fontSize: 18,
  },
  playerStats: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#ccc",
    fontSize: 12,
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  playerScore: {
    color: "#ffd33d",
    fontSize: 18,
    fontWeight: "bold",
  },
  playerRegion: {
    color: "#888",
    fontSize: 12,
    textTransform: "capitalize",
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#ccc",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#25292e",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalBody: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileContainer: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#F59E0B",
  },
  profileUsername: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  profileLevel: {
    fontSize: 16,
    color: "#F59E0B",
    marginBottom: 8,
  },
  profileCountry: {
    fontSize: 14,
    color: "#888",
  },
  socialSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  socialStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  socialStatContainer: {
    alignItems: "center",
  },
  socialStatNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  socialStatLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    gap: 8,
  },
  followingButton: {
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#666",
  },
  followButtonText: {
    color: "#25292e",
    fontSize: 14,
    fontWeight: "600",
  },
  followingButtonText: {
    color: "#888",
  },
  statsSection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#ffd33d",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#25292e",
    fontSize: 14,
    fontWeight: "600",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    color: "#ccc",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedFilterOption: {
    backgroundColor: "#ffd33d",
  },
  filterOptionText: {
    color: "#fff",
    fontSize: 14,
  },
  selectedFilterOptionText: {
    color: "#25292e",
    fontWeight: "bold",
  },
  applyButton: {
    backgroundColor: "#ffd33d",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  applyButtonText: {
    color: "#25292e",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MobileLeaderboard;
