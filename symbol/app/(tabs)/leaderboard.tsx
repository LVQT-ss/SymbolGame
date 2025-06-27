import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Animated,
} from "react-native";
import { fetchLeaderboard, userAPI, socialAPI } from "../../services/api";

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
  return base * (screenWidth / 375);
};

interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
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
  userStatistics?: any;
  rank_position?: number;
  time?: number;
  created_at?: string;
}

type DifficultyLevel = 1 | 2 | 3;
type TimeFilter = "monthly" | "allTime";
type RegionFilter = "global" | "asia" | "america" | "europe" | "others";

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
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

export default function LeaderboardScreen() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyLevel>(1);
  const [selectedTime, setSelectedTime] = useState<TimeFilter>("allTime");
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>("global");
  const [loading, setLoading] = useState(false);

  // Dropdown states
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [showRegionMenu, setShowRegionMenu] = useState(false);

  // Profile modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [lastProfileRequest, setLastProfileRequest] = useState("");

  // Filter options
  const difficultyOptions: FilterOption[] = [
    { value: "1", label: "Easy", icon: "happy-outline" },
    { value: "2", label: "Medium", icon: "trending-up-outline" },
    { value: "3", label: "Hard", icon: "flame-outline" },
  ];

  const timeOptions: FilterOption[] = [
    { value: "monthly", label: "This Month", icon: "calendar-outline" },
    { value: "allTime", label: "All Time", icon: "infinite-outline" },
  ];

  const regionOptions: FilterOption[] = [
    { value: "global", label: "Global", icon: "earth-outline" },
    { value: "asia", label: "Asia", icon: "location-outline" },
    { value: "america", label: "America", icon: "location-outline" },
    { value: "europe", label: "Europe", icon: "location-outline" },
    { value: "others", label: "Others", icon: "location-outline" },
  ];

  // Mock data for fallback when API fails
  const generateMockData = (): LeaderboardEntry[] => {
    console.log("🎮 Generating mock leaderboard data...");

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

    const regions = ["asia", "america", "europe", "others"];
    const countries = [
      "US",
      "VN",
      "JP",
      "KR",
      "CN",
      "DE",
      "FR",
      "UK",
      "BR",
      "CA",
    ];
    const flags = ["🇺🇸", "🇻🇳", "🇯🇵", "🇰🇷", "🇨🇳", "🇩🇪", "🇫🇷", "🇬🇧", "🇧🇷", "🇨🇦"];

    const mockData = usernames
      .map((username, index) => ({
        id: `mock_user_${index + 1}`,
        rank: index + 1,
        username,
        score: Math.max(
          1000,
          50000 - index * 2000 + Math.floor(Math.random() * 5000)
        ),
        avatar: `https://i.pravatar.cc/150?img=${index + 1}`,
        level: Math.max(1, Math.floor(Math.random() * 50) + 10),
        region: regions[Math.floor(Math.random() * regions.length)],
        country: countries[index % countries.length],
        countryFlag: flags[index % flags.length],
        total_time: Math.floor(Math.random() * 300) + 60,
        total_games: Math.floor(Math.random() * 50) + 5,
        medal:
          index === 0
            ? "🥇"
            : index === 1
            ? "🥈"
            : index === 2
            ? "🥉"
            : undefined,
        isTopThree: index < 3,
        isCurrentUser: index === 4, // Make 5th player the current user for demo
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        medal:
          index === 0
            ? "🥇"
            : index === 1
            ? "🥈"
            : index === 2
            ? "🥉"
            : undefined,
        isTopThree: index < 3,
      }));

    console.log(`✅ Generated ${mockData.length} mock players`);
    return mockData;
  };

  useEffect(() => {
    loadLeaderboard();
    getCurrentUser();
  }, [selectedDifficulty, selectedTime, selectedRegion]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      // Get current user info to identify them in the leaderboard
      let currentUser = null;
      try {
        const userResponse = await userAPI.getCurrentUserProfile();
        currentUser = userResponse.user || userResponse;
        console.log("Current user:", currentUser);
      } catch (userError) {
        console.log("Could not get current user info:", userError);
      }

      // Call the actual API with current filter settings
      console.log("🔍 Calling fetchLeaderboard with filters:", {
        difficulty_level: selectedDifficulty,
        region: selectedRegion,
        time_period: selectedTime,
      });

      const response = await fetchLeaderboard({
        difficulty_level: selectedDifficulty,
        region: selectedRegion,
        time_period: selectedTime,
        limit: 100,
      });

      console.log("📊 API Response:", response);

      if (
        !response.success ||
        !response.data ||
        !Array.isArray(response.data)
      ) {
        throw new Error(response.message || "Invalid API response format");
      }

      // Transform API response to match our LeaderboardEntry interface
      const transformedData: LeaderboardEntry[] = response.data.map(
        (player: any, index: number) => ({
          id: `api_user_${
            player.user_statistics_id || player.id || index
          }_${index}`, // Use user_statistics_id + index for guaranteed uniqueness
          rank: player.rank_position || index + 1,
          username: player.full_name || "Unknown Player",
          score: player.score || 0,
          avatar:
            player.avatar ||
            `https://i.pravatar.cc/150?img=${(index % 50) + 1}`,
          level: player.current_level || 1,
          region: player.region || "others",
          country: player.country || "",
          countryFlag:
            player.countryFlag || getCountryFlag(player.country || ""),
          total_time: player.total_time || 0,
          total_games: player.total_games || 0,
          medal: player.medal || undefined,
          isTopThree: player.isTopThree || player.rank_position <= 3,
          isCurrentUser: currentUser
            ? player.full_name === currentUser.username ||
              player.full_name === currentUser.full_name ||
              player.full_name === currentUser.name
            : false,
          user_statistics_id: player.user_statistics_id,
          userStatistics: player.userStatistics,
          rank_position: player.rank_position,
          time: player.time,
          created_at: player.created_at,
        })
      );

      // Additional safeguard: Remove any duplicates by username + score combination
      const deduplicatedData = transformedData.filter((player, index, arr) => {
        const duplicateIndex = arr.findIndex(
          (p) => p.username === player.username && p.score === player.score
        );
        return duplicateIndex === index; // Keep only the first occurrence
      });

      setLeaderboardData(deduplicatedData);
      setLoading(false);

      console.log(
        `✅ Loaded ${deduplicatedData.length} players (${transformedData.length} before deduplication) for difficulty ${selectedDifficulty}, region ${selectedRegion}, time ${selectedTime}`
      );
    } catch (error) {
      setLoading(false);
      console.error("❌ Leaderboard loading error:", error);

      // Fallback to mock data if API fails
      console.log("🔄 API failed, using mock data as fallback");
      const mockData = generateMockData();
      setLeaderboardData(mockData);

      // Only show alert if there's no data at all
      if (mockData.length === 0) {
        Alert.alert(
          "Connection Issue",
          "Could not load leaderboard from server and no sample data available.",
          [{ text: "OK" }]
        );
      } else {
        console.log("✅ Using mock data with", mockData.length, "players");
      }
    }
  };

  // Get current user info
  const getCurrentUser = async () => {
    try {
      // Try getting from API first
      const storedUser = await userAPI.getCurrentUserProfile();
      console.log("📱 API user response:", JSON.stringify(storedUser, null, 2));

      // Extract user data ensuring we have an ID
      const user = {
        ...(storedUser?.user || storedUser),
        id: storedUser?.user?.id || storedUser?.id,
      };

      console.log("👤 Setting current user from API:", user);
      setCurrentUser(user);
    } catch (error) {
      console.log("⚠️ API call failed, trying stored data...");
      try {
        // Fallback to stored data
        const storedData = await userAPI.getStoredUserData();
        if (storedData) {
          console.log("📦 Found stored user data:", storedData);
          setCurrentUser(storedData);
        } else {
          console.error("❌ No stored user data found");
        }
      } catch (storageError) {
        console.error("❌ Error getting stored user data:", storageError);
      }
    }
  };

  // Check if current user is following the profile user
  const checkFollowStatus = async (userId: number) => {
    try {
      console.log(
        "🔍 Checking follow status - Current user:",
        currentUser?.id,
        "Target user:",
        userId
      );
      if (!currentUser?.id) {
        console.log("⚠️ No current user ID available");
        return;
      }

      // Get both following and followers lists to check status
      const followingResponse = await socialAPI.getFollowing(currentUser.id);
      console.log(
        "👥 Following list:",
        followingResponse?.following?.length || 0,
        "users"
      );

      // Check if current user is following the target user
      const isUserFollowed = followingResponse.following?.some(
        (follow: any) => follow.following_id === userId || follow.id === userId
      );

      console.log("✅ Is following:", isUserFollowed);
      setIsFollowing(isUserFollowed || false);
    } catch (error) {
      console.error("❌ Error checking follow status:", error);
      setIsFollowing(false);
    }
  };

  // Enhanced handleViewUserProfile - Show modal first, then load data
  const handleViewUserProfile = async (player: LeaderboardEntry) => {
    // Prevent duplicate requests
    if (
      profileLoading ||
      lastProfileRequest === player.user_statistics_id?.toString()
    ) {
      console.log("🚫 Profile request blocked - already loading or duplicate");
      return;
    }

    if (player.isCurrentUser) {
      Alert.alert(
        "Info",
        "This is your own profile! You can view it from the home screen."
      );
      return;
    }

    // Show modal immediately
    setShowProfileModal(true);
    setSelectedUserProfile(null);
    setIsFollowing(false);
    setLastProfileRequest(player.user_statistics_id?.toString() || "");

    // Then fetch data inside modal
    try {
      setProfileLoading(true);

      // Extract user ID - try all possible sources
      let userId = null;
      if (player.userStatistics?.user?.id) {
        userId = player.userStatistics.user.id;
      } else if (player.userStatistics?.user_id) {
        userId = player.userStatistics.user_id;
      } else if (player.id) {
        // If it's a string ID, convert to number
        userId =
          typeof player.id === "string" ? parseInt(player.id) : player.id;
      } else if (player.user_statistics_id) {
        userId = player.user_statistics_id;
      }

      console.log("🔍 Player data:", {
        id: player.id,
        user_statistics_id: player.user_statistics_id,
        userStatistics: player.userStatistics,
        extractedUserId: userId,
      });

      if (!userId) {
        throw new Error("Unable to find user ID for this player");
      }

      console.log(`🔍 Fetching profile for user ID: ${userId}`);

      const profileResponse = await socialAPI.getUserStats(userId);
      console.log("📊 Profile response:", {
        id: profileResponse.user?.id,
        username: profileResponse.user?.username,
      });

      // Ensure we have an ID in the profile data
      const userData = {
        ...profileResponse.user,
        id: profileResponse.user?.id || userId,
      };

      setSelectedUserProfile(userData);
      await checkFollowStatus(userId);
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      // Keep modal open but show error state
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
      console.log(
        `${isFollowing ? "🔄 Unfollowing" : "🔄 Following"} user ${
          selectedUserProfile.username
        }`
      );

      if (isFollowing) {
        await socialAPI.unfollowUser(selectedUserProfile.id);
        setIsFollowing(false);
        // Update followers count in profile
        setSelectedUserProfile((prev) => {
          if (!prev || prev.error) return prev;
          return {
            ...prev,
            followers_count: Math.max(0, (prev.followers_count || 0) - 1),
          };
        });
        console.log(`✅ Unfollowed user ${selectedUserProfile.username}`);
      } else {
        try {
          await socialAPI.followUser(selectedUserProfile.id);
          setIsFollowing(true);
          // Update followers count in profile
          setSelectedUserProfile((prev) => {
            if (!prev || prev.error) return prev;
            return {
              ...prev,
              followers_count: (prev.followers_count || 0) + 1,
            };
          });
          console.log(`✅ Following user ${selectedUserProfile.username}`);
        } catch (followError: any) {
          // Handle "Already following" error gracefully
          if (followError.message?.includes("Already following")) {
            console.log("⚠️ Already following this user, updating UI state");
            setIsFollowing(true);
            // Refresh follow status to ensure counts are correct
            await checkFollowStatus(selectedUserProfile.id);
            return;
          }
          throw followError; // Re-throw other errors to be caught by outer catch
        }
      }
    } catch (error) {
      console.error("❌ Error toggling follow:", error);
      // Only revert the follow status if it wasn't an "Already following" error
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

  // Helper function to aggregate statistics from all difficulty levels
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
      {
        games_played: 0,
        best_score: 0,
        total_score: 0,
        best_score_time: null,
      }
    );
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
        return "#FFD700";
      case 2:
        return "#C0C0C0";
      case 3:
        return "#CD7F32";
      default:
        return "#ffd33d";
    }
  };

  const formatScore = (score: number) => {
    return score.toLocaleString();
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

  const getCurrentFilterLabel = (type: string) => {
    switch (type) {
      case "difficulty":
        return (
          difficultyOptions.find(
            (opt) => opt.value === selectedDifficulty.toString()
          )?.label || "Easy"
        );
      case "time":
        return (
          timeOptions.find((opt) => opt.value === selectedTime)?.label ||
          "All Time"
        );
      case "region":
        return (
          regionOptions.find((opt) => opt.value === selectedRegion)?.label ||
          "Global"
        );
      default:
        return "";
    }
  };

  const renderFilterDropdown = (
    type: string,
    options: FilterOption[],
    selectedValue: string,
    onSelect: (value: any) => void,
    showMenu: boolean,
    setShowMenu: (show: boolean) => void
  ) => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => {
          // Close other dropdowns first
          if (type === "difficulty") {
            setShowRegionMenu(false);
            setShowTimeMenu(false);
          } else if (type === "region") {
            setShowDifficultyMenu(false);
            setShowTimeMenu(false);
          } else if (type === "time") {
            setShowDifficultyMenu(false);
            setShowRegionMenu(false);
          }
          setShowMenu(!showMenu);
        }}
      >
        <Text style={styles.dropdownButtonText}>
          {getCurrentFilterLabel(type)}
        </Text>
        <Ionicons
          name={showMenu ? "chevron-up" : "chevron-down"}
          size={16}
          color="#ffffff"
        />
      </TouchableOpacity>

      {showMenu && (
        <View style={styles.dropdownMenu}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dropdownItem,
                selectedValue === option.value && styles.selectedDropdownItem,
                index === options.length - 1 && styles.lastDropdownItem,
              ]}
              onPress={() => {
                onSelect(option.value);
                setShowMenu(false);
              }}
            >
              {option.icon && (
                <Ionicons
                  name={option.icon as any}
                  size={18}
                  color={selectedValue === option.value ? "#000000" : "#ffffff"}
                  style={styles.dropdownItemIcon}
                />
              )}
              <Text
                style={[
                  styles.dropdownItemText,
                  selectedValue === option.value &&
                    styles.selectedDropdownItemText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderTopThree = () => {
    if (leaderboardData.length === 0) return null;

    const topPlayers = leaderboardData.slice(
      0,
      Math.min(3, leaderboardData.length)
    );

    // Handle different numbers of players
    if (leaderboardData.length === 1) {
      const first = topPlayers[0];
      return (
        <View style={styles.podiumContainer}>
          <View style={[styles.podiumItem, styles.firstPlace]}>
            <View style={styles.crownContainer}>
              <Ionicons name="star" size={24} color="#FFD700" />
            </View>
            <Image source={{ uri: first.avatar }} style={styles.podiumAvatar} />
            <View style={[styles.podiumRank, styles.goldRank]}>
              <Ionicons name="trophy" size={18} color="#FFD700" />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {first.username}
            </Text>
            <Text style={styles.podiumScore}>{formatScore(first.score)}</Text>
          </View>
        </View>
      );
    }

    if (leaderboardData.length === 2) {
      const [first, second] = topPlayers;
      return (
        <View style={styles.podiumContainer}>
          {/* Second Place */}
          <View style={[styles.podiumItem, styles.secondPlace]}>
            <Image
              source={{ uri: second.avatar }}
              style={styles.podiumAvatar}
            />
            <View style={[styles.podiumRank, styles.silverRank]}>
              <Text style={styles.podiumRankText}>2</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {second.username}
            </Text>
            <Text style={styles.podiumScore}>{formatScore(second.score)}</Text>
          </View>

          {/* First Place */}
          <View style={[styles.podiumItem, styles.firstPlace]}>
            <View style={styles.crownContainer}>
              <Ionicons name="star" size={24} color="#FFD700" />
            </View>
            <Image source={{ uri: first.avatar }} style={styles.podiumAvatar} />
            <View style={[styles.podiumRank, styles.goldRank]}>
              <Ionicons name="trophy" size={18} color="#FFD700" />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {first.username}
            </Text>
            <Text style={styles.podiumScore}>{formatScore(first.score)}</Text>
          </View>
        </View>
      );
    }

    // Original 3+ players logic
    const [second, first, third] = [
      topPlayers[1],
      topPlayers[0],
      topPlayers[2],
    ];

    return (
      <View style={styles.podiumContainer}>
        {/* Second Place */}
        <View style={[styles.podiumItem, styles.secondPlace]}>
          <Image source={{ uri: second.avatar }} style={styles.podiumAvatar} />
          <View style={[styles.podiumRank, styles.silverRank]}>
            <Text style={styles.podiumRankText}>2</Text>
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>
            {second.username}
          </Text>
          <Text style={styles.podiumScore}>{formatScore(second.score)}</Text>
        </View>

        {/* First Place */}
        <View style={[styles.podiumItem, styles.firstPlace]}>
          <View style={styles.crownContainer}>
            <Ionicons name="star" size={24} color="#FFD700" />
          </View>
          <Image source={{ uri: first.avatar }} style={styles.podiumAvatar} />
          <View style={[styles.podiumRank, styles.goldRank]}>
            <Ionicons name="trophy" size={18} color="#FFD700" />
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>
            {first.username}
          </Text>
          <Text style={styles.podiumScore}>{formatScore(first.score)}</Text>
        </View>

        {/* Third Place */}
        <View style={[styles.podiumItem, styles.thirdPlace]}>
          <Image source={{ uri: third.avatar }} style={styles.podiumAvatar} />
          <View style={[styles.podiumRank, styles.bronzeRank]}>
            <Text style={styles.podiumRankText}>3</Text>
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>
            {third.username}
          </Text>
          <Text style={styles.podiumScore}>{formatScore(third.score)}</Text>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = ({
    item,
    index,
  }: {
    item: LeaderboardEntry;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.leaderboardItem,
        item.isCurrentUser && styles.currentUserItem,
        index < 3 && styles.topThreeItem,
      ]}
      onPress={() => handleViewUserProfile(item)}
    >
      <View style={styles.rankContainer}>
        {item.rank <= 3 && getRankIcon(item.rank) ? (
          <Ionicons
            name={getRankIcon(item.rank) as any}
            size={responsiveSize(20, 22, 24)}
            color={getRankColor(item.rank)}
          />
        ) : (
          <Text style={[styles.rankText, { color: getRankColor(item.rank) }]}>
            #{item.rank}
          </Text>
        )}
      </View>

      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.countryFlag && (
          <View style={styles.flagBadge}>
            <Text style={styles.flagText}>{item.countryFlag}</Text>
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <Text
          style={[
            styles.username,
            item.isCurrentUser && styles.currentUserText,
          ]}
          numberOfLines={1}
        >
          {item.username}
          {item.isCurrentUser ? " (You)" : ""}
        </Text>

        {/* Only show total time */}
        {item.total_time && item.total_time > 0 && (
          <Text style={styles.totalTime}>⏱️ {item.total_time}s</Text>
        )}
      </View>

      <View style={styles.scoreContainer}>
        <Text
          style={[styles.score, item.isCurrentUser && styles.currentUserText]}
        >
          {formatScore(item.score)}
        </Text>
        <Text style={styles.scoreLabel}>points</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🏆 Leaderboard</Text>
          <Text style={styles.subtitle}>Compete with players worldwide</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons
            name="refresh"
            size={responsiveSize(20, 22, 24)}
            color="#ffd33d"
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View
        style={[
          styles.filtersContainer,
          (showDifficultyMenu || showRegionMenu || showTimeMenu) &&
            styles.filtersContainerExpanded,
        ]}
      >
        <View style={styles.filtersRow}>
          {renderFilterDropdown(
            "difficulty",
            difficultyOptions,
            selectedDifficulty.toString(),
            (value) =>
              setSelectedDifficulty(parseInt(value) as DifficultyLevel),
            showDifficultyMenu,
            setShowDifficultyMenu
          )}
          {renderFilterDropdown(
            "region",
            regionOptions,
            selectedRegion,
            setSelectedRegion,
            showRegionMenu,
            setShowRegionMenu
          )}
          {renderFilterDropdown(
            "time",
            timeOptions,
            selectedTime,
            setSelectedTime,
            showTimeMenu,
            setShowTimeMenu
          )}
        </View>
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={loading ? [] : leaderboardData}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="hourglass-outline" size={32} color="#888" />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={64} color="#444" />
              <Text style={styles.emptyTitle}>No Players Found</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to play and set a record for difficulty{" "}
                {selectedDifficulty}!
              </Text>
            </View>
          ) : null
        }
      />

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowProfileModal(false);
          setSelectedUserProfile(null);
          setLastProfileRequest("");
        }}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowProfileModal(false);
                setSelectedUserProfile(null);
                setLastProfileRequest("");
              }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Player Profile</Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView style={styles.modalContent}>
            {profileLoading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="hourglass-outline" size={48} color="#ffd33d" />
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
                    Failed to load {selectedUserProfile.username}'s profile
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
                <View>
                  {/* Profile Header */}
                  <View style={styles.profileHeader}>
                    <Image
                      source={{
                        uri:
                          selectedUserProfile.avatar ||
                          "https://i.pravatar.cc/150?img=1",
                      }}
                      style={styles.profileAvatar}
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
                  </View>

                  {/* Social Stats & Follow Button */}
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

                    {/* Follow Button */}
                    {(() => {
                      console.log("🔘 Follow button check:", {
                        currentUserId: currentUser?.id,
                        profileId: selectedUserProfile?.id,
                        shouldShow: Boolean(
                          currentUser?.id &&
                            selectedUserProfile?.id !== currentUser?.id
                        ),
                      });
                      return (
                        currentUser?.id &&
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
                                {isFollowing
                                  ? "Unfollowing..."
                                  : "Following..."}
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
                        )
                      );
                    })()}
                  </View>

                  {/* Game Statistics */}
                  <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>Game Statistics</Text>
                    {(() => {
                      const stats = getAggregatedStats(
                        selectedUserProfile.statistics || []
                      );
                      return (
                        <>
                          <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                              <Text style={styles.statValue}>
                                {stats.best_score}
                              </Text>
                              <Text style={styles.statLabel}>Best Score</Text>
                            </View>

                            <View style={styles.statItem}>
                              <Text style={styles.statValue}>
                                {stats.games_played}
                              </Text>
                              <Text style={styles.statLabel}>Games Played</Text>
                            </View>

                            <View style={styles.statItem}>
                              <Text style={styles.statValue}>
                                {stats.total_score}
                              </Text>
                              <Text style={styles.statLabel}>Total Score</Text>
                            </View>

                            <View style={styles.statItem}>
                              <Text style={styles.statValue}>
                                {selectedUserProfile.experience_points || 0}
                              </Text>
                              <Text style={styles.statLabel}>Experience</Text>
                            </View>
                          </View>

                          {/* Additional Stats */}
                          <View style={styles.additionalStats}>
                            <View style={styles.additionalStatRow}>
                              <Text style={styles.additionalStatLabel}>
                                Average Score:
                              </Text>
                              <Text style={styles.additionalStatValue}>
                                {stats.games_played > 0
                                  ? Math.round(
                                      stats.total_score / stats.games_played
                                    )
                                  : 0}
                              </Text>
                            </View>

                            {stats.best_score_time && (
                              <View style={styles.additionalStatRow}>
                                <Text style={styles.additionalStatLabel}>
                                  Best Time:
                                </Text>
                                <Text style={styles.additionalStatValue}>
                                  {stats.best_score_time.toFixed(2)}s
                                </Text>
                              </View>
                            )}

                            <View style={styles.additionalStatRow}>
                              <Text style={styles.additionalStatLabel}>
                                Member Since:
                              </Text>
                              <Text style={styles.additionalStatValue}>
                                {selectedUserProfile.created_at
                                  ? new Date(
                                      selectedUserProfile.created_at
                                    ).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "N/A"}
                              </Text>
                            </View>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                </View>
              )
            ) : null}
          </ScrollView>
        </View>
      </Modal>
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
    paddingHorizontal: responsiveSpacing(20),
    paddingTop: responsiveSpacing(20),
    paddingBottom: responsiveSpacing(16),
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    fontSize: responsiveSize(26, 30, 34),
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: responsiveSize(12, 14, 16),
    color: "#888",
    marginTop: 4,
  },
  refreshButton: {
    padding: responsiveSpacing(12),
    backgroundColor: "#333",
    borderRadius: 25,
  },
  filtersContainer: {
    backgroundColor: "#1a1a1a",
    paddingVertical: responsiveSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    zIndex: 1000,
    overflow: "visible",
  },
  filtersContainerExpanded: {
    paddingBottom: responsiveSpacing(160), // Space for dropdown when open
  },
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: responsiveSpacing(20),
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "visible",
  },
  dropdownContainer: {
    position: "relative",
    flex: 1,
    marginHorizontal: responsiveSpacing(4),
    zIndex: 1001,
    overflow: "visible",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#333",
    paddingHorizontal: responsiveSpacing(12),
    paddingVertical: responsiveSpacing(12),
    borderRadius: 22,
    minHeight: 44,
  },
  dropdownButtonText: {
    color: "#ffffff",
    fontSize: responsiveSize(13, 14, 15),
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    marginTop: 6,
    zIndex: 2000,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#444",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveSpacing(16),
    paddingVertical: responsiveSpacing(14),
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    minHeight: 48,
  },
  selectedDropdownItem: {
    backgroundColor: "#ffd33d",
  },
  lastDropdownItem: {
    borderBottomWidth: 0,
  },
  dropdownItemIcon: {
    marginRight: responsiveSpacing(8),
  },
  dropdownItemText: {
    color: "#ffffff",
    fontSize: responsiveSize(14, 15, 16),
    fontWeight: "500",
  },
  selectedDropdownItemText: {
    color: "#000000",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: responsiveSpacing(20),
    paddingVertical: responsiveSpacing(20),
    backgroundColor: "#1a1a1a",
    marginBottom: responsiveSpacing(8),
  },
  podiumItem: {
    alignItems: "center",
    marginHorizontal: responsiveSpacing(8),
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: responsiveSpacing(12),
    minWidth: responsiveSpacing(100),
  },
  firstPlace: {
    backgroundColor: "#3a3a2a",
    borderWidth: 2,
    borderColor: "#FFD700",
    transform: [{ scale: 1.1 }],
  },
  secondPlace: {
    backgroundColor: "#2a2a3a",
    borderWidth: 1,
    borderColor: "#C0C0C0",
  },
  thirdPlace: {
    backgroundColor: "#3a2a2a",
    borderWidth: 1,
    borderColor: "#CD7F32",
  },
  crownContainer: {
    position: "absolute",
    top: -12,
    zIndex: 1,
  },
  podiumAvatar: {
    width: responsiveSize(50, 55, 60),
    height: responsiveSize(50, 55, 60),
    borderRadius: responsiveSize(25, 27.5, 30),
    marginBottom: responsiveSpacing(8),
  },
  podiumRank: {
    width: responsiveSize(30, 32, 35),
    height: responsiveSize(30, 32, 35),
    borderRadius: responsiveSize(15, 16, 17.5),
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
    color: "#000",
    fontWeight: "bold",
    fontSize: responsiveSize(14, 15, 16),
  },
  podiumName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: responsiveSize(12, 13, 14),
    textAlign: "center",
    marginBottom: responsiveSpacing(4),
  },
  podiumScore: {
    color: "#ffd33d",
    fontSize: responsiveSize(11, 12, 13),
    fontWeight: "600",
  },
  podiumTime: {
    color: "#888",
    fontSize: responsiveSize(10, 11, 12),
    fontWeight: "500",
    marginTop: responsiveSpacing(2),
  },
  listContainer: {
    paddingHorizontal: responsiveSpacing(20),
    paddingBottom: responsiveSpacing(20),
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: responsiveSpacing(12),
    marginBottom: responsiveSpacing(6),
    borderWidth: 1,
    borderColor: "#333",
    minHeight: responsiveSize(60, 65, 70),
  },
  currentUserItem: {
    backgroundColor: "#2a2a1a",
    borderColor: "#ffd33d",
    borderWidth: 2,
  },
  topThreeItem: {
    backgroundColor: "#2a2a2a",
  },
  rankContainer: {
    width: responsiveSize(40, 45, 50),
    alignItems: "center",
  },
  rankText: {
    fontSize: responsiveSize(14, 16, 18),
    fontWeight: "bold",
  },
  avatarContainer: {
    position: "relative",
    marginRight: responsiveSpacing(12),
  },
  avatar: {
    width: responsiveSize(40, 42, 45),
    height: responsiveSize(40, 42, 45),
    borderRadius: responsiveSize(20, 21, 22.5),
  },
  flagBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "#444",
  },
  flagText: {
    fontSize: responsiveSize(10, 11, 12),
  },
  userInfo: {
    flex: 1,
    paddingRight: responsiveSpacing(12),
  },
  username: {
    color: "#fff",
    fontSize: responsiveSize(15, 16, 17),
    fontWeight: "bold",
    marginBottom: responsiveSpacing(2),
  },
  currentUserText: {
    color: "#ffd33d",
  },

  totalTime: {
    color: "#888",
    fontSize: responsiveSize(11, 12, 13),
    fontWeight: "500",
  },

  scoreContainer: {
    alignItems: "flex-end",
  },
  score: {
    color: "#fff",
    fontSize: responsiveSize(16, 18, 20),
    fontWeight: "bold",
  },
  scoreLabel: {
    color: "#888",
    fontSize: responsiveSize(11, 12, 13),
  },
  loadingContainer: {
    padding: responsiveSpacing(40),
    alignItems: "center",
  },
  loadingText: {
    color: "#888",
    fontSize: responsiveSize(16, 17, 18),
    marginTop: responsiveSpacing(12),
  },
  listHeaderContainer: {
    padding: responsiveSpacing(20),
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    marginBottom: responsiveSpacing(8),
  },
  listHeaderText: {
    color: "#ffd33d",
    fontSize: responsiveSize(18, 20, 22),
    fontWeight: "bold",
    textAlign: "center",
  },
  listHeaderSubtext: {
    color: "#888",
    fontSize: responsiveSize(13, 14, 15),
    textAlign: "center",
    marginTop: responsiveSpacing(4),
  },
  emptyContainer: {
    padding: responsiveSpacing(60),
    alignItems: "center",
  },
  emptyTitle: {
    color: "#888",
    fontSize: responsiveSize(18, 20, 22),
    fontWeight: "bold",
    marginTop: responsiveSpacing(16),
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#666",
    fontSize: responsiveSize(14, 15, 16),
    textAlign: "center",
    marginTop: responsiveSpacing(8),
    lineHeight: responsiveSize(20, 22, 24),
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveSpacing(16),
    paddingTop: responsiveSpacing(20),
    paddingBottom: responsiveSpacing(16),
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: responsiveSize(18, 20, 22),
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  closeButton: {
    padding: responsiveSpacing(8),
    borderRadius: 20,
  },
  modalContent: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: responsiveSpacing(40),
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: responsiveSize(16, 18, 20),
    marginTop: responsiveSpacing(16),
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#ffd33d",
    paddingHorizontal: responsiveSpacing(24),
    paddingVertical: responsiveSpacing(12),
    borderRadius: 22,
    marginTop: responsiveSpacing(16),
  },
  retryButtonText: {
    color: "#25292e",
    fontSize: responsiveSize(14, 15, 16),
    fontWeight: "600",
  },

  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingVertical: responsiveSpacing(24),
    paddingHorizontal: responsiveSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  profileAvatar: {
    width: responsiveSize(100, 120, 140),
    height: responsiveSize(100, 120, 140),
    borderRadius: responsiveSize(50, 60, 70),
    marginBottom: responsiveSpacing(16),
    borderWidth: 3,
    borderColor: "#ffd33d",
  },
  profileUsername: {
    fontSize: responsiveSize(22, 24, 26),
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: responsiveSpacing(8),
  },
  profileLevel: {
    fontSize: responsiveSize(16, 18, 20),
    color: "#ffd33d",
    marginBottom: responsiveSpacing(8),
  },
  profileCountry: {
    fontSize: responsiveSize(14, 15, 16),
    color: "#888",
  },

  // Social Section
  socialSection: {
    paddingVertical: responsiveSpacing(20),
    paddingHorizontal: responsiveSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  socialStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: responsiveSpacing(20),
  },
  socialStatContainer: {
    alignItems: "center",
  },
  socialStatNumber: {
    fontSize: responsiveSize(20, 22, 24),
    fontWeight: "bold",
    color: "#ffffff",
  },
  socialStatLabel: {
    fontSize: responsiveSize(12, 13, 14),
    color: "#888",
    marginTop: responsiveSpacing(4),
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffd33d",
    paddingHorizontal: responsiveSpacing(24),
    paddingVertical: responsiveSpacing(12),
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
    fontSize: responsiveSize(14, 15, 16),
    fontWeight: "600",
  },
  followingButtonText: {
    color: "#888",
  },

  // Stats Section
  statsSection: {
    paddingVertical: responsiveSpacing(20),
    paddingHorizontal: responsiveSpacing(16),
  },
  sectionTitle: {
    fontSize: responsiveSize(18, 20, 22),
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: responsiveSpacing(16),
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: responsiveSpacing(20),
  },
  statItem: {
    width: "48%",
    backgroundColor: "#1a1a1a",
    padding: responsiveSpacing(16),
    borderRadius: 12,
    marginBottom: responsiveSpacing(12),
    alignItems: "center",
  },
  statValue: {
    fontSize: responsiveSize(20, 22, 24),
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: responsiveSpacing(4),
  },
  statLabel: {
    fontSize: responsiveSize(12, 13, 14),
    color: "#888",
  },
  additionalStats: {
    backgroundColor: "#1a1a1a",
    padding: responsiveSpacing(16),
    borderRadius: 12,
  },
  additionalStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: responsiveSpacing(8),
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  additionalStatLabel: {
    fontSize: responsiveSize(14, 15, 16),
    color: "#888",
  },
  additionalStatValue: {
    fontSize: responsiveSize(14, 15, 16),
    color: "#ffffff",
    fontWeight: "500",
  },
});
