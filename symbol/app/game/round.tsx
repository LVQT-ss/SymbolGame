import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { gameAPI } from "../../services/api";

const { width: screenWidth } = Dimensions.get("window");

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

interface GameRound {
  id: string;
  title: string;
  status: "waiting" | "active" | "completed";
  currentPlayers: number;
  maxPlayers: number;
  createdBy: {
    id: string;
    username: string;
  };
  startTime: string;
}

export default function GameRoundScreen() {
  const [loading, setLoading] = useState(false);
  const [roundTitle, setRoundTitle] = useState("");
  const [availableRounds, setAvailableRounds] = useState<GameRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<GameRound | null>(null);

  useEffect(() => {
    loadAvailableRounds();
  }, []);

  const loadAvailableRounds = async () => {
    try {
      setLoading(true);
      const response = await gameAPI.getAvailableGames(1, 20);
      if (response && response.available_games) {
        const rounds = response.available_games.map((game: any) => ({
          id: game.id.toString(),
          title: game.title || `Game Session ${game.id}`,
          status: game.status === "available_to_join" ? "waiting" : "active",
          currentPlayers: game.current_players || 0,
          maxPlayers: game.max_players || 1,
          createdBy: {
            id: game.created_by.id.toString(),
            username: game.created_by.username,
          },
          startTime: game.created_at,
        }));
        setAvailableRounds(rounds);
      }
    } catch (error) {
      console.error("Error loading game rounds:", error);
      Alert.alert("Error", "Failed to load available game rounds");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRound = async () => {
    if (!roundTitle.trim()) {
      Alert.alert("Error", "Please enter a round title");
      return;
    }

    try {
      setLoading(true);
      const response = await gameAPI.createGameSession({
        title: roundTitle,
        number_of_rounds: 10, // Default to 10 rounds
        time_limit: "10 minutes per session",
      });

      if (response && response.session_id) {
        Alert.alert("Success", "Game round created successfully!", [
          {
            text: "Join Now",
            onPress: () => handleJoinRound(response.session_id),
          },
          {
            text: "Stay Here",
            style: "cancel",
          },
        ]);
        setRoundTitle("");
        loadAvailableRounds();
      }
    } catch (error) {
      console.error("Error creating game round:", error);
      Alert.alert("Error", "Failed to create game round");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRound = async (roundId: string) => {
    try {
      setLoading(true);
      const response = await gameAPI.joinGameSession(roundId);

      if (response && response.success) {
        router.push({
          pathname: "/game/game",
          params: {
            sessionId: roundId,
            gameType: "Symbol Match",
            title: selectedRound?.title || "Game Session",
          },
        });
      }
    } catch (error) {
      console.error("Error joining game round:", error);
      Alert.alert("Error", "Failed to join game round");
    } finally {
      setLoading(false);
    }
  };

  const renderCreateRound = () => (
    <View style={styles.createRoundContainer}>
      <Text style={styles.sectionTitle}>Create New Game Round</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter round title"
        placeholderTextColor="#666"
        value={roundTitle}
        onChangeText={setRoundTitle}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreateRound}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Round</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderRoundList = () => (
    <View style={styles.roundListContainer}>
      <Text style={styles.sectionTitle}>Available Rounds</Text>
      {availableRounds.map((round) => (
        <TouchableOpacity
          key={round.id}
          style={styles.roundCard}
          onPress={() => {
            setSelectedRound(round);
            handleJoinRound(round.id);
          }}
        >
          <View style={styles.roundInfo}>
            <Text style={styles.roundTitle}>{round.title}</Text>
            <Text style={styles.roundDetails}>
              Created by {round.createdBy.username}
            </Text>
            <Text style={styles.roundDetails}>
              Players: {round.currentPlayers}/{round.maxPlayers}
            </Text>
          </View>
          <View style={styles.roundStatus}>
            <Text
              style={[
                styles.statusText,
                { color: round.status === "waiting" ? "#4CAF50" : "#FFC107" },
              ]}
            >
              {round.status.toUpperCase()}
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      ))}
    </View>
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
        <Text style={styles.headerTitle}>Game Rounds</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {renderCreateRound()}
        {renderRoundList()}
      </View>
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
  headerTitle: {
    flex: 1,
    fontSize: getResponsiveFontSize(20),
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: getResponsivePadding(),
  },
  createRoundContainer: {
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#444",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#ffd33d",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#000",
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
  },
  roundListContainer: {
    flex: 1,
  },
  roundCard: {
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roundInfo: {
    flex: 1,
  },
  roundTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  roundDetails: {
    fontSize: getResponsiveFontSize(12),
    color: "#888",
    marginBottom: 2,
  },
  roundStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: "bold",
    marginRight: 8,
  },
});
