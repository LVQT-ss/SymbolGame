import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { battleAPI } from "../../../services/api";

export default function CreateBattleScreen() {
  const [loading, setLoading] = useState(false);
  const [numberOfRounds, setNumberOfRounds] = useState(10);
  const [timeLimit, setTimeLimit] = useState(600);
  const [isPublic, setIsPublic] = useState(true);

  const handleNumberOfRoundsChange = (rounds: number) => {
    setNumberOfRounds(rounds);
  };

  const handleTimeLimitChange = (time: number) => {
    setTimeLimit(time);
  };

  const handleIsPublicChange = () => {
    setIsPublic((prev) => !prev);
  };

  const handleCreateBattle = async () => {
    try {
      setLoading(true);

      const battleData = {
        number_of_rounds: numberOfRounds,
        time_limit: timeLimit,
        is_public: isPublic,
      };

      const response = await battleAPI.createBattle(battleData);

      if (response && response.battle_session) {
        Alert.alert(
          "Battle Created! ⚔️",
          `Your battle has been created!\n\nBattle Code: ${response.battle_session.battle_code}\n\nShare this code with your opponent or wait for someone to join.`,
          [
            {
              text: "Share Code",
              onPress: () => {
                console.log("Share code:", response.battle_session.battle_code);
              },
            },
            {
              text: "Enter Battle",
              onPress: () => {
                router.push({
                  pathname: "/game/duoBattle/battleGame",
                  params: {
                    battleId: response.battle_session.id.toString(),
                    battleCode: response.battle_session.battle_code,
                  },
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Error creating battle:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create battle. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Battle</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>EveryRound is random number</Text>
          <Text style={styles.subtitle}>
            Set up your battle preferences and challenge other players
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Battle Settings</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of Rounds</Text>
            <View style={styles.roundsSelector}>
              {[5, 10, 15, 20].map((rounds) => (
                <TouchableOpacity
                  key={rounds}
                  style={[
                    styles.roundsOption,
                    numberOfRounds === rounds && styles.roundsOptionSelected,
                  ]}
                  onPress={() => handleNumberOfRoundsChange(rounds)}
                >
                  <Text
                    style={[
                      styles.roundsOptionText,
                      numberOfRounds === rounds &&
                        styles.roundsOptionTextSelected,
                    ]}
                  >
                    {rounds}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Time Limit</Text>
            <View style={styles.roundsSelector}>
              {[300, 600, 900, 1200].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.roundsOption,
                    timeLimit === time && styles.roundsOptionSelected,
                  ]}
                  onPress={() => handleTimeLimitChange(time)}
                >
                  <Text
                    style={[
                      styles.roundsOptionText,
                      timeLimit === time && styles.roundsOptionTextSelected,
                    ]}
                  >
                    {Math.floor(time / 60)}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.inputLabel}>Public Battle</Text>
              <TouchableOpacity
                style={[styles.switch, isPublic && styles.switchActive]}
                onPress={handleIsPublicChange}
              >
                <View
                  style={[
                    styles.switchThumb,
                    isPublic && styles.switchThumbActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.switchDescription}>
              {isPublic
                ? "Other players can find and join your battle"
                : "Only players with the battle code can join"}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateBattle}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.createButtonText}>Creating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.createButtonText}>Create Battle</Text>
            </>
          )}
        </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: "#333",
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(233, 30, 99, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
  },
  formSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  roundsSelector: {
    flexDirection: "row",
    gap: 8,
  },
  roundsOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
  },
  roundsOptionSelected: {
    backgroundColor: "rgba(233, 30, 99, 0.2)",
    borderColor: "#E91E63",
  },
  roundsOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888",
  },
  roundsOptionTextSelected: {
    color: "#E91E63",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switch: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    padding: 2,
    justifyContent: "center",
  },
  switchActive: {
    backgroundColor: "#E91E63",
  },
  switchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  switchThumbActive: {
    alignSelf: "flex-end",
  },
  switchDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    backgroundColor: "#0a0a0a",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  createButton: {
    backgroundColor: "#E91E63",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: "#666",
    opacity: 0.6,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
