import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { battleAPI } from "../../../services/api";
import {
  filterActiveBattles,
  BattleSession as BattleSessionType,
} from "../../../utils/battleUtils";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive helper functions
const getResponsiveFontSize = (baseSize: number) => {
  const width = Dimensions.get("window").width;
  if (width >= 1024) return baseSize * 1.4;
  if (width >= 768) return baseSize * 1.2;
  return baseSize;
};

const getResponsivePadding = () => {
  const width = Dimensions.get("window").width;
  if (width >= 1024) return 32;
  if (width >= 768) return 24;
  return 20;
};

// Use the interface from battleUtils
type BattleSession = BattleSessionType;

export default function BattleMenuScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [availableBattles, setAvailableBattles] = useState<BattleSession[]>([]);

  useEffect(() => {
    loadAvailableBattles();
  }, []);

  // Use the utility function for filtering stale battles

  const loadAvailableBattles = async () => {
    try {
      setLoading(true);
      console.log("📡 Loading available battles...");
      const response = await battleAPI.getAvailableBattles(1, 20);
      console.log("📡 Battle API response:", response);

      if (response && response.battles) {
        console.log("✅ Found battles from API:", response.battles.length);

        // Apply frontend filtering to remove stale battles
        // Use individual time limits (30s battles expire after 30s)
        const filteredBattles = filterActiveBattles(response.battles, 6, true);
        console.log("🔍 Battles after filtering:", filteredBattles.length);

        setAvailableBattles(filteredBattles);
      } else {
        console.log("⚠️ No battles in response");
        setAvailableBattles([]);
      }
    } catch (error: any) {
      console.error("❌ Error loading available battles:", error);
      Alert.alert(
        "Error",
        `Failed to load available battles: ${
          error.message || error
        }. Please check your connection and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAvailableBattles();
    setRefreshing(false);
  };

  const handleJoinAvailableBattle = async (battle: BattleSession) => {
    if (!battle.can_join) {
      Alert.alert("Cannot Join", "This battle is no longer available to join.");
      return;
    }

    // Navigate to join battle page with pre-filled code
    router.push({
      pathname: "/game/duoBattle/joinBattle",
      params: { code: battle.battle_code },
    });
  };

  const formatTimeAgo = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getDifficultyColor = (rounds: number) => {
    if (rounds <= 5) return "#4CAF50"; // Easy - Green
    if (rounds <= 10) return "#FF9800"; // Medium - Orange
    if (rounds <= 15) return "#F44336"; // Hard - Red
    return "#9C27B0"; // Expert - Purple
  };

  const getDifficultyText = (rounds: number) => {
    if (rounds <= 5) return "Easy";
    if (rounds <= 10) return "Medium";
    if (rounds <= 15) return "Hard";
    return "Expert";
  };

  // 7. Also add this to prevent unnecessary FlatList re-renders
  const renderBattleItem = useCallback(
    ({ item }: { item: BattleSession }) => (
      <TouchableOpacity
        style={styles.battleCard}
        onPress={() => handleJoinAvailableBattle(item)}
        disabled={!item.can_join}
      >
        <View style={styles.battleHeader}>
          <View style={styles.battleInfo}>
            <Text style={styles.battleCode}>{item.battle_code}</Text>
            <View style={styles.difficultyBadge}>
              <View
                style={[
                  styles.difficultyDot,
                  {
                    backgroundColor: getDifficultyColor(item.number_of_rounds),
                  },
                ]}
              />
              <Text style={styles.difficultyText}>
                {getDifficultyText(item.number_of_rounds)}
              </Text>
            </View>
          </View>
          <Text style={styles.timeAgo}>
            {formatTimeAgo(item.time_since_created)}
          </Text>
        </View>

        <View style={styles.battleDetails}>
          <View style={styles.creatorInfo}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.creatorText}>
              {item.creator?.username || "Unknown"} (Lv.
              {item.creator?.current_level || 1})
            </Text>
          </View>

          <View style={styles.battleStats}>
            <View style={styles.statItem}>
              <Ionicons name="layers" size={16} color="#666" />
              <Text style={styles.statText}>
                {item.number_of_rounds} rounds
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={16} color="#666" />
              <Text style={styles.statText}>
                {Math.floor(item.time_limit / 60)}m
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.battleFooter}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.can_join ? "#4CAF50" : "#FF9800",
              },
            ]}
          >
            <Text style={styles.statusText}>
              {item.can_join ? "Available" : "In Progress"}
            </Text>
          </View>

          {item.can_join && (
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Battle</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    ),
    []
  );

  // 6. Additional optimization - memoize expensive operations
  const availableBattlesData = useMemo(
    () => availableBattles,
    [availableBattles]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Battle Arena</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/game/duoBattle/createBattle")}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Create Battle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => router.push("/game/duoBattle/joinBattle")}
        >
          <Ionicons name="enter" size={24} color="#E91E63" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Join Battle
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Battles</Text>
          <TouchableOpacity onPress={loadAvailableBattles} disabled={loading}>
            <Ionicons
              name="refresh"
              size={24}
              color={loading ? "#ccc" : "#E91E63"}
            />
          </TouchableOpacity>
        </View>

        {loading && availableBattles.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E91E63" />
            <Text style={styles.loadingText}>Loading battles...</Text>
          </View>
        ) : availableBattles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flash" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Battles Available</Text>
            <Text style={styles.emptyDescription}>
              Be the first to create a battle or check back later!
            </Text>
          </View>
        ) : (
          <FlatList
            data={availableBattlesData}
            renderItem={renderBattleItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#1a1a1a",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(233, 30, 99, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E91E63",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#E91E63",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#E91E63",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#888",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ccc",
  },
  emptyDescription: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    maxWidth: 280,
  },
  listContainer: {
    paddingBottom: 20,
  },
  battleCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  battleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  battleInfo: {
    flex: 1,
  },
  battleCode: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E91E63",
    fontFamily: "monospace",
    marginBottom: 4,
  },
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  timeAgo: {
    fontSize: 12,
    color: "#666",
  },
  battleDetails: {
    gap: 8,
    marginBottom: 16,
  },
  creatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  creatorText: {
    fontSize: 14,
    color: "#ccc",
  },
  battleStats: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: "#888",
  },
  battleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  joinButton: {
    backgroundColor: "#E91E63",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
