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
import { fetchLeaderboard } from "../../services/api";

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

    return usernames
      .map((username, index) => ({
        id: `user_${index + 1}`,
        rank: index + 1,
        username,
        score: Math.floor(Math.random() * 50000) + 10000 - index * 1000,
        avatar: `https://i.pravatar.cc/150?img=${index + 1}`,
        level: Math.floor(Math.random() * 50) + 10,
        region: regions[Math.floor(Math.random() * regions.length)],
        country: countries[index % countries.length],
        countryFlag: flags[index % flags.length],
        total_time: Math.floor(Math.random() * 300) + 60,
        isCurrentUser: index === 4,
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  };

  useEffect(() => {
    loadLeaderboard();
  }, [selectedDifficulty, selectedTime, selectedRegion]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      // Simulate API call for now - replace with actual API call
      const mockData = generateMockData();
      setLeaderboardData(mockData);
      /*
      const response = await fetchLeaderboard({
        difficulty_level: selectedDifficulty,
        region: selectedRegion,
        time_period: selectedTime,
      });
      setLeaderboardData(response.data);
      */
      setLoading(false);
    } catch (error) {
      setLoading(false);
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
        onPress={() => setShowMenu(!showMenu)}
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
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dropdownItem,
                selectedValue === option.value && styles.selectedDropdownItem,
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
    if (leaderboardData.length < 3) return null;

    const topThree = leaderboardData.slice(0, 3);
    const [second, first, third] = [topThree[1], topThree[0], topThree[2]];

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

      <Image source={{ uri: item.avatar }} style={styles.avatar} />

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
        <View style={styles.userDetails}>
          <Text style={styles.level}>Level {item.level}</Text>
          {item.region && <Text style={styles.region}>• {item.region}</Text>}
          {item.countryFlag && (
            <Text style={styles.countryFlag}>{item.countryFlag}</Text>
          )}
        </View>
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
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
        </ScrollView>
      </View>

      {/* Top 3 Podium */}
      {!loading && leaderboardData.length >= 3 && renderTopThree()}

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
              <Text style={styles.loadingText}>Loading...</Text>
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
  },
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: responsiveSpacing(20),
    gap: responsiveSpacing(12),
  },
  dropdownContainer: {
    position: "relative",
    minWidth: responsiveSpacing(120),
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#333",
    paddingHorizontal: responsiveSpacing(16),
    paddingVertical: responsiveSpacing(12),
    borderRadius: 25,
    minWidth: responsiveSpacing(120),
  },
  dropdownButtonText: {
    color: "#ffffff",
    fontSize: responsiveSize(14, 15, 16),
    fontWeight: "600",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveSpacing(16),
    paddingVertical: responsiveSpacing(12),
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  selectedDropdownItem: {
    backgroundColor: "#ffd33d",
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
  listContainer: {
    paddingHorizontal: responsiveSpacing(20),
    paddingBottom: responsiveSpacing(20),
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: responsiveSpacing(16),
    marginBottom: responsiveSpacing(8),
    borderWidth: 1,
    borderColor: "#333",
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
  avatar: {
    width: responsiveSize(45, 50, 55),
    height: responsiveSize(45, 50, 55),
    borderRadius: responsiveSize(22.5, 25, 27.5),
    marginRight: responsiveSpacing(16),
  },
  userInfo: {
    flex: 1,
    paddingRight: responsiveSpacing(12),
  },
  username: {
    color: "#fff",
    fontSize: responsiveSize(16, 17, 18),
    fontWeight: "bold",
    marginBottom: responsiveSpacing(4),
  },
  currentUserText: {
    color: "#ffd33d",
  },
  userDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  level: {
    color: "#888",
    fontSize: responsiveSize(12, 13, 14),
  },
  region: {
    color: "#666",
    fontSize: responsiveSize(12, 13, 14),
    marginLeft: responsiveSpacing(4),
  },
  countryFlag: {
    fontSize: responsiveSize(14, 15, 16),
    marginLeft: responsiveSpacing(4),
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
  },
});
