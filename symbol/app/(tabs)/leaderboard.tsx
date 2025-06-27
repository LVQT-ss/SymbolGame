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
import { fetchLeaderboard, userAPI } from "../../services/api";

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
}

type DifficultyLevel = 1 | 2 | 3;
type TimeFilter = "monthly" | "allTime";
type RegionFilter = "global" | "asia" | "america" | "europe" | "others";

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
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
          id: `api_user_${player.rank_position || index + 1}`,
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
        })
      );

      setLeaderboardData(transformedData);
      setLoading(false);

      console.log(
        `✅ Loaded ${transformedData.length} players for difficulty ${selectedDifficulty}, region ${selectedRegion}, time ${selectedTime}`
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
      onPress={() =>
        Alert.alert("Player Info", `View ${item.username}'s profile`)
      }
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
});
