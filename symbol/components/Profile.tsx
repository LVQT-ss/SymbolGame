import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiUtils } from "../services/api";
import { getLevelDisplayInfo } from "../utils/levelUtils";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive helper functions
const getResponsiveFontSize = (baseSize: number) => {
  if (screenWidth < 350) return baseSize * 0.85;
  if (screenWidth > 400) return baseSize * 1.1;
  return baseSize;
};

const getResponsivePadding = () => {
  if (screenWidth < 350) return 12;
  if (screenWidth > 400) return 20;
  return 16;
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

interface ProfileProps {
  visible: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updatedProfile: Partial<UserProfile>) => void;
  onLogout: () => void;
}

export default function Profile({
  visible,
  onClose,
  userProfile,
  onUpdateProfile,
  onLogout,
}: ProfileProps) {
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(userProfile.username);
  const [loading, setLoading] = useState(false);

  // Update tempUsername when userProfile.username changes
  useEffect(() => {
    setTempUsername(userProfile.username);
  }, [userProfile.username]);

  const handleUsernameEdit = () => {
    setEditingUsername(true);
    setTempUsername(userProfile.username);
  };

  const saveUsername = async () => {
    if (tempUsername.trim().length >= 3) {
      try {
        setLoading(true);
        // Update the username in the parent component
        onUpdateProfile({ username: tempUsername.trim() });
        setEditingUsername(false);

        // Here you could also make an API call to update the username on the backend
        // await userAPI.updateUsername(tempUsername.trim());
      } catch (error) {
        console.error("Error updating username:", error);
        Alert.alert("Error", "Failed to update username. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert(
        "Invalid Username",
        "Username must be at least 3 characters long."
      );
    }
  };

  const cancelUsernameEdit = () => {
    setEditingUsername(false);
    setTempUsername(userProfile.username);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
                    editable={!loading}
                  />
                  <View style={styles.usernameEditButtons}>
                    <TouchableOpacity
                      style={[
                        styles.cancelButton,
                        loading && styles.disabledButton,
                      ]}
                      onPress={cancelUsernameEdit}
                      disabled={loading}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        loading && styles.disabledButton,
                      ]}
                      onPress={saveUsername}
                      disabled={loading}
                    >
                      <Text style={styles.saveButtonText}>
                        {loading ? "Saving..." : "Save"}
                      </Text>
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

          <View style={styles.socialSection}>
            <Text style={styles.profileSectionTitle}>Social</Text>

            <View style={styles.socialStatsContainer}>
              <TouchableOpacity style={styles.socialStatItem}>
                <View
                  style={[styles.socialIcon, { backgroundColor: "#4ECDC4" }]}
                >
                  <Ionicons
                    name="people"
                    size={getResponsiveFontSize(20)}
                    color="#fff"
                  />
                </View>
                <View style={styles.socialInfo}>
                  <Text style={styles.socialStatLabel}>Followers</Text>
                  <Text style={styles.socialStatValue}>
                    {formatNumber(userProfile.followers_count || 0)}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialStatItem}>
                <View
                  style={[styles.socialIcon, { backgroundColor: "#FF6B6B" }]}
                >
                  <Ionicons
                    name="person-add"
                    size={getResponsiveFontSize(20)}
                    color="#fff"
                  />
                </View>
                <View style={styles.socialInfo}>
                  <Text style={styles.socialStatLabel}>Following</Text>
                  <Text style={styles.socialStatValue}>
                    {formatNumber(userProfile.following_count || 0)}
                  </Text>
                </View>
              </TouchableOpacity>
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
                      width: `${(() => {
                        const levelInfo = getLevelDisplayInfo(userProfile);
                        return levelInfo.isMaxLevel
                          ? 100
                          : levelInfo.progressPercent;
                      })()}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.expText}>
                {(() => {
                  const levelInfo = getLevelDisplayInfo(userProfile);
                  if (levelInfo.isMaxLevel) {
                    return `🏆 Max Level! ${levelInfo.formattedCurrentXP} XP`;
                  }
                  return `${levelInfo.formattedCurrentXP} / ${levelInfo.formattedNextLevelXP} XP`;
                })()}
              </Text>
            </View>

            {/* 🆕 Additional Level Info */}
            <View style={styles.levelDetailsContainer}>
              <View style={styles.levelDetailRow}>
                <Text style={styles.levelDetailLabel}>Current Level:</Text>
                <Text style={styles.levelDetailValue}>
                  {(() => {
                    const levelInfo = getLevelDisplayInfo(userProfile);
                    return levelInfo.currentLevel;
                  })()}
                </Text>
              </View>

              {(() => {
                const levelInfo = getLevelDisplayInfo(userProfile);
                if (!levelInfo.isMaxLevel) {
                  return (
                    <View style={styles.levelDetailRow}>
                      <Text style={styles.levelDetailLabel}>XP Needed:</Text>
                      <Text style={styles.levelDetailValue}>
                        {levelInfo.formattedXPNeeded}
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}

              <View style={styles.levelDetailRow}>
                <Text style={styles.levelDetailLabel}>Total XP:</Text>
                <Text style={styles.levelDetailValue}>
                  {(() => {
                    const levelInfo = getLevelDisplayInfo(userProfile);
                    return levelInfo.formattedCurrentXP;
                  })()}
                </Text>
              </View>
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

            <TouchableOpacity style={styles.actionButton} onPress={onLogout}>
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
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getResponsivePadding(),
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: "bold",
    color: "#fff",
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    flex: 1,
    padding: getResponsivePadding(),
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileModalImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "#ffd33d",
  },
  usernameContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  usernameEditContainer: {
    alignItems: "center",
    width: "100%",
  },
  usernameInput: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: getResponsiveFontSize(16),
    textAlign: "center",
    marginBottom: 12,
    width: "80%",
  },
  usernameEditButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    backgroundColor: "#666",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: "#ffd33d",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: getResponsiveFontSize(14),
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#25292e",
    fontSize: getResponsiveFontSize(14),
    fontWeight: "600",
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
    fontSize: getResponsiveFontSize(16),
    color: "#ffd33d",
    fontWeight: "600",
  },
  joinDate: {
    fontSize: getResponsiveFontSize(14),
    color: "#888",
    marginTop: 4,
  },
  currencySection: {
    marginBottom: 30,
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  currencyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
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
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    color: "#fff",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  socialSection: {
    marginBottom: 30,
  },
  profileSectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  socialStatsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  socialStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  socialInfo: {
    flex: 1,
  },
  socialStatLabel: {
    fontSize: getResponsiveFontSize(12),
    color: "#888",
    marginBottom: 4,
  },
  socialStatValue: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: "#fff",
  },
  experienceSection: {
    marginBottom: 30,
  },
  expProgressContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
  },
  expProgressBar: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  expProgressFill: {
    height: "100%",
    backgroundColor: "#ffd33d",
    borderRadius: 4,
  },
  expText: {
    fontSize: getResponsiveFontSize(14),
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  levelDetailsContainer: {
    marginTop: 16,
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 12,
  },
  levelDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  levelDetailLabel: {
    fontSize: getResponsiveFontSize(14),
    color: "#888",
  },
  levelDetailValue: {
    fontSize: getResponsiveFontSize(14),
    color: "#ffd33d",
    fontWeight: "600",
  },
  actionButtonsSection: {
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  actionButtonText: {
    fontSize: getResponsiveFontSize(16),
    color: "#fff",
    fontWeight: "600",
  },
});
