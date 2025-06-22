import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { battleAPI, userAPI } from "../../../services/api";

const BattleCodeInput = React.memo(({ value, onChangeText, ...props }: any) => (
  <TextInput
    style={styles.battleCodeInput}
    value={value}
    onChangeText={onChangeText}
    placeholder="CODE"
    placeholderTextColor="#666"
    maxLength={8}
    autoCapitalize="characters"
    autoCorrect={false}
    returnKeyType="done"
    {...props}
  />
));
BattleCodeInput.displayName = "BattleCodeInput";

export default function JoinBattleScreen() {
  const [loading, setLoading] = useState(false);
  const [battleCode, setBattleCode] = useState("");
  const params = useLocalSearchParams();

  // Pre-fill battle code if passed from available battles
  useEffect(() => {
    if (params.code && typeof params.code === "string") {
      setBattleCode(params.code.toUpperCase());
    }
  }, [params.code]);

  const handleBattleCodeChange = (text: string) => {
    const cleanText = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
    setBattleCode(cleanText);
  };

  const handleJoinBattle = async () => {
    const cleanCode = battleCode.toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (!cleanCode || cleanCode.trim().length === 0) {
      Alert.alert("Error", "Please enter a valid battle code.");
      return;
    }

    if (cleanCode.length !== 8) {
      Alert.alert("Error", "Battle code must be exactly 8 characters long.");
      return;
    }

    // Prevent multiple concurrent join requests
    if (loading) {
      console.log("Join request already in progress, ignoring duplicate");
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Attempting to join battle with code:", cleanCode);

      // Debug: Check current user identity and battle state
      await userAPI.debugCurrentUser();
      await battleAPI.debugBattleByCode(cleanCode);

      const response = await battleAPI.joinBattle(cleanCode);
      console.log("✅ Join battle response:", response);

      if (response && response.battle_session) {
        console.log(
          "🎮 Navigating to battle game - Battle ID:",
          response.battle_session.id
        );

        // Determine source based on whether user is creator or opponent
        const source = response.is_creator ? "create" : "join";

        console.log("👤 User role in battle:", source);

        // Automatically navigate to battle game without requiring user to press button
        router.replace({
          pathname: "/game/duoBattle/battleGame",
          params: {
            battleId: response.battle_session.id.toString(),
            battleCode: response.battle_session.battle_code,
            source: source,
          },
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("❌ Error joining battle:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = "Failed to join battle. Please try again.";

      if (error.message?.includes("not found")) {
        errorMessage = "Battle not found. Please check the battle code.";
      } else if (error.message?.includes("already has an opponent")) {
        errorMessage = "This battle is already full. Someone else has joined.";
      } else if (error.message?.includes("cannot join your own")) {
        errorMessage =
          "You cannot join your own battle. Share the code with someone else.";
      } else if (error.message?.includes("already part of this battle")) {
        errorMessage = "Resuming your existing battle...";
        // This is actually not an error, but a successful rejoin
      } else if (error.message?.includes("This is your battle")) {
        errorMessage = "Redirecting to your battle...";
        // This is also not an error, but a redirect
      } else if (error.message?.includes("expired")) {
        errorMessage = "This battle has expired.";
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isCodeValid = battleCode.length === 8;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Battle</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>🔑 Battle Code</Text>
          <View style={styles.inputContainer}>
            <BattleCodeInput
              value={battleCode}
              onChangeText={handleBattleCodeChange}
              onSubmitEditing={() => {
                if (battleCode.length === 8) {
                  handleJoinBattle();
                }
              }}
            />
          </View>
        </View>

        <View style={styles.validationContainer}>
          <View style={styles.validationRow}>
            {Array.from({ length: 8 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.validationDot,
                  i < battleCode.length && styles.validationDotFilled,
                ]}
              />
            ))}
          </View>
          <Text style={styles.validationText}>
            {battleCode.length}/8 characters
          </Text>
        </View>

        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>How to Join</Text>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="search" size={14} color="#4CAF50" />
            </View>
            <Text style={styles.instructionText}>
              Get the 8-character battle code from your opponent
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="create" size={14} color="#4CAF50" />
            </View>
            <Text style={styles.instructionText}>CODE</Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="play" size={14} color="#4CAF50" />
            </View>
            <Text style={styles.instructionText}>
              Tap &lsquo;Join Battle&rsquo; to start the challenge
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.joinButton,
            (!isCodeValid || loading) && styles.joinButtonDisabled,
          ]}
          onPress={handleJoinBattle}
          disabled={!isCodeValid || loading}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.joinButtonText}>Joining...</Text>
            </>
          ) : (
            <>
              <Ionicons name="enter" size={24} color="#fff" />
              <Text style={styles.joinButtonText}>Join Battle</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeSection: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  headerSection: {
    alignItems: "center",
    paddingVertical: 40,
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
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  inputContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#333",
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#E91E63",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  inputIconContainer: {
    marginRight: 16,
    paddingVertical: 16,
  },
  battleCodeInput: {
    fontSize: 24,
    color: "#fff",
    fontFamily: "monospace",
    paddingVertical: 20,
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 4,
    backgroundColor: "transparent",
  },
  inputHint: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  validationContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  validationRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  validationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#333",
  },
  validationDotFilled: {
    backgroundColor: "#E91E63",
  },
  validationText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  instructionsSection: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  instructionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    marginTop: 2,
  },
  instructionText: {
    fontSize: 14,
    color: "#ccc",
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: "#0a0a0a",
    borderTopWidth: 1,
    borderTopColor: "#333",
    gap: 12,
  },
  joinButton: {
    backgroundColor: "#E91E63",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonDisabled: {
    backgroundColor: "#666",
    opacity: 0.6,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },
});
