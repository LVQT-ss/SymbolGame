import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useRef, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
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
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { apiUtils, paymentAPI, userAPI } from "../services/api";
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

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  description: string;
  bonus?: number;
}

interface PaymentData {
  paymentUrl: string;
  qrCode: string;
  qrCodeImageUrl: string;
  transaction: any;
  package: CoinPackage;
  orderCode: number;
  user: {
    id: number;
    username: string;
    email: string;
    currentCoins: number;
    newCoinsAfterPayment: number;
  };
  paymentInfo: {
    description: string;
    amount: number;
    currency: string;
    expiresAt: string;
    expiresInMinutes: number;
  };
}

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

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

export default function Profile({
  visible,
  onClose,
  userProfile,
  onUpdateProfile,
  onLogout,
}: ProfileProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingAge, setEditingAge] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempEmail, setTempEmail] = useState(userProfile.email || "");
  const [tempAge, setTempAge] = useState(userProfile.age || "");
  const [tempAvatar, setTempAvatar] = useState(userProfile.avatar);
  const [tempFullName, setTempFullName] = useState(userProfile.full_name || "");
  const [loading, setLoading] = useState(false);
  const [lastUpdateDate, setLastUpdateDate] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Coin purchase states
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [qrModalVisible, setQRModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<{
    coinsAdded: number;
    newBalance: number;
    packageName: string;
    amount: number;
  } | null>(null);

  // Polling ref
  const pollingInterval = useRef<any>(null);

  const [changedFields, setChangedFields] = useState<{ [key: string]: any }>(
    {}
  );

  useEffect(() => {
    setTempEmail(userProfile.email || "");
    setTempAge(userProfile.age || "");
    setTempAvatar(userProfile.avatar);
    setTempFullName(userProfile.full_name || "");
    checkLastUpdate();
  }, [userProfile]);

  useEffect(() => {
    // Check for unsaved changes
    const hasChanges =
      tempEmail !== userProfile.email ||
      tempAge !== userProfile.age ||
      tempAvatar !== userProfile.avatar ||
      tempFullName !== userProfile.full_name;

    setHasUnsavedChanges(hasChanges);
  }, [tempEmail, tempAge, tempAvatar, tempFullName, userProfile]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Load coin packages when component mounts
  useEffect(() => {
    loadCoinPackages();
  }, []);

  // Load available coin packages
  const loadCoinPackages = async () => {
    try {
      setLoadingPackages(true);
      const response = await paymentAPI.getCoinPackages();
      if (response.success && response.packages) {
        const packagesArray = Object.entries(response.packages).map(
          ([id, pkg]: [string, any]) => ({
            id,
            ...pkg,
          })
        );
        setCoinPackages(packagesArray);
      }
    } catch (error) {
      console.error("Error loading coin packages:", error);
      Alert.alert("Error", "Failed to load coin packages. Please try again.");
    } finally {
      setLoadingPackages(false);
    }
  };

  // Handle coin purchase
  const handleCoinPurchase = async (packageId: string) => {
    try {
      if (!userProfile.id) {
        Alert.alert("Error", "User ID not available. Please log in again.");
        return;
      }

      setCreatingPayment(true);
      const response = await paymentAPI.createPayOSPayment(
        userProfile.id,
        packageId
      );

      if (response.success) {
        setPaymentData(response);
        setPaymentModalVisible(false);
        setQRModalVisible(true);

        // Start polling for payment completion
        startPaymentPolling(response.transaction.id, response.package);
      } else {
        Alert.alert("Error", "Failed to create payment. Please try again.");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      Alert.alert("Error", "Failed to create payment. Please try again.");
    } finally {
      setCreatingPayment(false);
    }
  };

  // Open web payment
  const openWebPayment = () => {
    if (paymentData?.paymentUrl) {
      Linking.openURL(paymentData.paymentUrl);
    }
  };

  // Format currency (VND)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const checkLastUpdate = async () => {
    try {
      const lastUpdate = await AsyncStorage.getItem(
        `last_profile_update_${userProfile.id}`
      );
      if (lastUpdate) {
        setLastUpdateDate(new Date(lastUpdate));
      }
    } catch (error) {
      console.error("Error checking last update:", error);
    }
  };

  const canUpdateProfile = () => {
    if (!lastUpdateDate) return true;

    const currentDate = new Date();
    const monthsDiff =
      (currentDate.getFullYear() - lastUpdateDate.getFullYear()) * 12 +
      (currentDate.getMonth() - lastUpdateDate.getMonth());
    return monthsDiff >= 1;
  };

  const getNextUpdateDate = () => {
    if (!lastUpdateDate) return null;

    const nextUpdate = new Date(lastUpdateDate);
    nextUpdate.setMonth(nextUpdate.getMonth() + 1);
    return nextUpdate.toLocaleDateString();
  };

  const handleEditProfile = () => {
    setIsEditMode(true);
    setTempEmail(userProfile.email || "");
    setTempAge(userProfile.age || "");
    setTempAvatar(userProfile.avatar);
    setTempFullName(userProfile.full_name || "");
    setShowSettingsMenu(false);
    setChangedFields({});
  };

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case "full_name":
        setTempFullName(value);
        if (value !== userProfile.full_name) {
          setChangedFields((prev) => ({ ...prev, full_name: value }));
        } else {
          setChangedFields((prev) => {
            const { full_name, ...rest } = prev;
            return rest;
          });
        }
        break;
      case "email":
        setTempEmail(value);
        if (value !== userProfile.email) {
          setChangedFields((prev) => ({ ...prev, email: value }));
        } else {
          setChangedFields((prev) => {
            const { email, ...rest } = prev;
            return rest;
          });
        }
        break;
      case "age":
        setTempAge(value);
        if (value !== userProfile.age) {
          setChangedFields((prev) => ({ ...prev, age: value }));
        } else {
          setChangedFields((prev) => {
            const { age, ...rest } = prev;
            return rest;
          });
        }
        break;
      case "avatar_url":
        setTempAvatar(value);
        if (value !== userProfile.avatar) {
          setChangedFields((prev) => ({ ...prev, avatar: value }));
        } else {
          setChangedFields((prev) => {
            const { avatar, ...rest } = prev;
            return rest;
          });
        }
        break;
    }
  };

  const handleSaveChanges = async () => {
    if (!canUpdateProfile()) {
      Alert.alert(
        "Update Not Available",
        "You can only update your profile once per month."
      );
      return;
    }

    if (Object.keys(changedFields).length === 0) {
      Alert.alert("No Changes", "No changes have been made to save.");
      return;
    }

    setLoading(true);
    try {
      await onUpdateProfile(changedFields);
      setIsEditMode(false);
      setChangedFields({});
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Start polling for payment completion
  const startPaymentPolling = (transactionId: number, packageInfo: any) => {
    console.log(`🔄 Starting payment polling for transaction ${transactionId}`);
    setPaymentPolling(true);

    // Clear any existing polling
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    pollingInterval.current = setInterval(async () => {
      try {
        console.log(`🔍 Polling transaction status: ${transactionId}`);
        const response = await paymentAPI.getTransactionById(transactionId);

        if (response.success && response.transaction) {
          const transaction = response.transaction;

          if (transaction.status === "completed") {
            console.log(`✅ Payment completed! Transaction ${transactionId}`);

            // Stop polling
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
            setPaymentPolling(false);

            // Set purchase result
            setPurchaseResult({
              coinsAdded: packageInfo.coins,
              newBalance: userProfile.coins + packageInfo.coins,
              packageName: packageInfo.name,
              amount: packageInfo.price,
            });

            // Update user profile with new coin balance
            onUpdateProfile({
              coins: userProfile.coins + packageInfo.coins,
            });

            // Close QR modal and show success modal
            setQRModalVisible(false);
            setSuccessModalVisible(true);
          } else if (transaction.status === "failed") {
            console.log(`❌ Payment failed! Transaction ${transactionId}`);

            // Stop polling
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
            setPaymentPolling(false);

            // Show error
            Alert.alert(
              "Payment Failed",
              "Your payment was not successful. Please try again."
            );
          }
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 10 minutes (payment expiry)
    setTimeout(() => {
      if (pollingInterval.current) {
        console.log(
          `⏰ Payment polling timeout for transaction ${transactionId} after 10 minutes`
        );
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
        setPaymentPolling(false);

        // Optional: Show timeout alert to user
        Alert.alert(
          "Payment Timeout",
          "Payment verification has timed out after 10 minutes. Please check your transaction manually or try again."
        );
      }
    }, 10 * 60 * 1000); // 10 minutes
  };

  // Stop polling manually
  const stopPaymentPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
      setPaymentPolling(false);
      console.log("🛑 Payment polling stopped manually");
    }
  };

  // Close QR modal and stop polling
  const closeQRModal = () => {
    setQRModalVisible(false);
    stopPaymentPolling();
  };

  // Close success modal
  const closeSuccessModal = () => {
    setSuccessModalVisible(false);
    setPurchaseResult(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const toggleSettingsMenu = () => {
    setShowSettingsMenu(!showSettingsMenu);
    if (isEditMode) {
      setIsEditMode(false);
    }
  };

  const handleLogout = () => {
    setShowSettingsMenu(false);
    onLogout();
  };

  const openDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: tempAge ? new Date(tempAge) : new Date(),
        mode: "date",
        is24Hour: true,
        display: "spinner",
        maximumDate: new Date(),
        onChange: (_event, selectedDate) => {
          if (selectedDate) {
            const isoDate = selectedDate.toISOString().split("T")[0];
            setTempAge(isoDate);
            handleFieldChange("age", isoDate);
          }
        },
      });
    } else {
      setShowDatePicker(true);
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant permission to access your photos"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        try {
          const formData = new FormData();
          const filename =
            result.assets[0].uri.split("/").pop() || "profile.jpg";
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image/jpeg";

          formData.append("image", {
            uri: result.assets[0].uri,
            type,
            name: filename,
          } as any);

          const response = await fetch(
            "https://symbolgame.onrender.com/api/user/upload-profile-picture",
            {
              method: "POST",
              body: formData,
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to upload image");
          }

          const data = await response.json();
          setTempAvatar(data.imageUrl);
        } catch (error) {
          Alert.alert("Error", "Failed to upload image. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View>
              <TouchableOpacity
                onPress={toggleSettingsMenu}
                style={styles.settingsButton}
              >
                <Ionicons name="settings-outline" size={24} color="#ffd33d" />
              </TouchableOpacity>
              {showSettingsMenu && (
                <View style={styles.settingsMenu}>
                  <TouchableOpacity
                    style={styles.settingsMenuItem}
                    onPress={handleEditProfile}
                  >
                    <Ionicons name="create-outline" size={20} color="#fff" />
                    <Text style={styles.settingsMenuText}>Edit Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.settingsMenuItem}
                    onPress={handleLogout}
                  >
                    <Ionicons name="log-out-outline" srize={20} color="#fff" />
                    <Text style={styles.settingsMenuText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={styles.profileSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={isEditMode ? pickImage : undefined}
              disabled={!isEditMode || loading}
            >
              <Image source={{ uri: tempAvatar }} style={styles.avatar} />
              {isEditMode && (
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.avatarOverlayText}>Change Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.levelInfoContainer}>
              <Text style={styles.profileLevel}>Level {userProfile.level}</Text>
              {lastUpdateDate && (
                <Text style={styles.nextUpdateText}>
                  {canUpdateProfile()
                    ? "Profile update available"
                    : `Next update: ${getNextUpdateDate()}`}
                </Text>
              )}
            </View>

            <View style={styles.updateLimitInfo}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#888"
              />
              <Text style={styles.updateLimitText}>
                You can only update your profile once per month
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.valueContainer}>
                  <Text style={[styles.value, styles.usernameText]}>
                    {userProfile.username}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.valueContainer}>
                  {isEditMode ? (
                    <TextInput
                      style={styles.input}
                      value={tempFullName}
                      onChangeText={(value) =>
                        handleFieldChange("full_name", value)
                      }
                      placeholder="Enter full name"
                      placeholderTextColor="#888"
                      autoCapitalize="words"
                    />
                  ) : (
                    <Text style={styles.value}>
                      {userProfile.full_name || "Not set"}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.valueContainer}>
                  {isEditMode ? (
                    <TextInput
                      style={styles.input}
                      value={tempEmail}
                      onChangeText={(value) =>
                        handleFieldChange("email", value)
                      }
                      placeholder="Enter email"
                      placeholderTextColor="#888"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  ) : (
                    <Text style={styles.value}>
                      {userProfile.email || "Not set"}
                    </Text>
                  )}
                </View>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.label}>Age</Text>
                <View style={styles.valueContainer}>
                  {isEditMode ? (
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={openDatePicker}
                    >
                      <Text style={styles.datePickerText}>
                        {tempAge ? formatDate(tempAge) : "Select Birth Date"}
                      </Text>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#ffd33d"
                      />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.value}>
                      {userProfile.age
                        ? formatDate(userProfile.age)
                        : "Not set"}
                    </Text>
                  )}
                </View>
              </View>

              {isEditMode && (
                <TouchableOpacity
                  style={[
                    styles.saveAllButton,
                    (Object.keys(changedFields).length === 0 || loading) &&
                      styles.disabledButton,
                  ]}
                  onPress={handleSaveChanges}
                  disabled={Object.keys(changedFields).length === 0 || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#25292e" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={24} color="#25292e" />
                      <Text style={styles.saveAllButtonText}>
                        Save Changes ({Object.keys(changedFields).length})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
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
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setPaymentModalVisible(true)}
                >
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
              <Text style={styles.profileSectionTitle}>
                Experience Progress
              </Text>
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
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Coin Packages Modal */}
        <Modal
          visible={paymentModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setPaymentModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Buy Coins</Text>
              <View style={styles.closeButton} />
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.sectionTitle}>💰 Choose a coin package</Text>

              {loadingPackages ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#ffd33d" />
                  <Text style={styles.loadingText}>Loading packages...</Text>
                </View>
              ) : (
                coinPackages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.id}
                    style={styles.packageCard}
                    onPress={() => handleCoinPurchase(pkg.id)}
                    disabled={creatingPayment}
                  >
                    <View style={styles.packageHeader}>
                      <View style={styles.packageIcon}>
                        <Ionicons name="cash" size={24} color="#FFD700" />
                      </View>
                      <View style={styles.packageInfo}>
                        <Text style={styles.packageCoins}>
                          {formatNumber(pkg.coins)} Coins
                        </Text>
                        <Text style={styles.packagePrice}>
                          {formatCurrency(pkg.price)}
                        </Text>
                      </View>
                      {pkg.bonus && (
                        <View style={styles.bonusBadge}>
                          <Text style={styles.bonusText}>
                            +{pkg.bonus}% Bonus
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.packageDescription}>
                      {pkg.description}
                    </Text>
                  </TouchableOpacity>
                ))
              )}

              {creatingPayment && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#ffd33d" />
                  <Text style={styles.loadingText}>Creating payment...</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* QR Payment Modal */}
        <Modal
          visible={qrModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeQRModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeQRModal}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {paymentPolling ? "Checking Payment..." : "PayOS Payment"}
              </Text>
              <View style={styles.closeButton} />
            </View>

            <ScrollView style={styles.modalContent}>
              {paymentPolling && (
                <View style={styles.statusCard}>
                  <ActivityIndicator size="small" color="#ffd33d" />
                  <Text style={styles.statusText}>🔄 Checking Payment...</Text>
                </View>
              )}

              {paymentData && (
                <>
                  <View style={styles.paymentInfoCard}>
                    <Text style={styles.paymentTitle}>Payment Details</Text>
                    <View style={styles.paymentDetailRow}>
                      <Text style={styles.paymentLabel}>User:</Text>
                      <Text style={styles.paymentValue}>
                        {paymentData.user.username}
                      </Text>
                    </View>
                    <View style={styles.paymentDetailRow}>
                      <Text style={styles.paymentLabel}>Package:</Text>
                      <Text style={styles.paymentValue}>
                        {formatNumber(paymentData.package.coins)} Coins
                      </Text>
                    </View>
                    <View style={styles.paymentDetailRow}>
                      <Text style={styles.paymentLabel}>Amount:</Text>
                      <Text style={styles.paymentValue}>
                        {formatCurrency(paymentData.paymentInfo.amount)}
                      </Text>
                    </View>
                    <View style={styles.paymentDetailRow}>
                      <Text style={styles.paymentLabel}>Current Coins:</Text>
                      <Text style={styles.paymentValue}>
                        {formatNumber(paymentData.user.currentCoins)}
                      </Text>
                    </View>
                    <View style={styles.paymentDetailRow}>
                      <Text style={styles.paymentLabel}>After Payment:</Text>
                      <Text
                        style={[styles.paymentValue, styles.highlightValue]}
                      >
                        {formatNumber(paymentData.user.newCoinsAfterPayment)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.qrContainer}>
                    <Text style={styles.qrTitle}>📱 Scan QR Code to Pay</Text>
                    <Image
                      source={{ uri: paymentData.qrCodeImageUrl }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.qrInstructions}>
                      Scan this QR code with your banking app or PayOS app
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.webPaymentButton}
                    onPress={openWebPayment}
                  >
                    <Ionicons name="globe" size={20} color="#fff" />
                    <Text style={styles.webPaymentText}>
                      Pay via Web Browser
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.expiryContainer}>
                    <Text style={styles.expiryText}>
                      ⏰ Payment expires in{" "}
                      {paymentData.paymentInfo.expiresInMinutes} minutes
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={successModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeSuccessModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.closeButton} />
              <Text style={styles.modalTitle}>Payment Success!</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeSuccessModal}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {purchaseResult && (
                <>
                  <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                      <Ionicons
                        name="checkmark-circle"
                        size={80}
                        color="#00ff88"
                      />
                    </View>
                    <Text style={styles.successTitle}>
                      🎉 Payment Successful!
                    </Text>
                    <Text style={styles.successMessage}>
                      Your coin purchase has been completed successfully.
                    </Text>
                  </View>

                  <View style={styles.successDetailsCard}>
                    <Text style={styles.successDetailsTitle}>
                      Purchase Details
                    </Text>

                    <View style={styles.successDetailRow}>
                      <Text style={styles.successDetailLabel}>Package:</Text>
                      <Text style={styles.successDetailValue}>
                        {purchaseResult.packageName}
                      </Text>
                    </View>

                    <View style={styles.successDetailRow}>
                      <Text style={styles.successDetailLabel}>
                        Amount Paid:
                      </Text>
                      <Text style={styles.successDetailValue}>
                        {formatCurrency(purchaseResult.amount)}
                      </Text>
                    </View>

                    <View style={styles.successDetailRow}>
                      <Text style={styles.successDetailLabel}>
                        Coins Added:
                      </Text>
                      <Text
                        style={[
                          styles.successDetailValue,
                          styles.highlightValue,
                        ]}
                      >
                        +{formatNumber(purchaseResult.coinsAdded)}
                      </Text>
                    </View>

                    <View style={[styles.successDetailRow, styles.totalRow]}>
                      <Text style={styles.successDetailLabel}>
                        New Balance:
                      </Text>
                      <Text
                        style={[styles.successDetailValue, styles.totalValue]}
                      >
                        {formatNumber(purchaseResult.newBalance)} Coins
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.successButton}
                    onPress={closeSuccessModal}
                  >
                    <Text style={styles.successButtonText}>Continue</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Date Picker Modal */}
        {showDatePicker && Platform.OS === "ios" && (
          <Modal transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={tempAge ? new Date(tempAge) : new Date()}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (event.type === "set" && selectedDate) {
                      const isoDate = selectedDate.toISOString().split("T")[0];
                      setTempAge(isoDate);
                    }
                    setShowDatePicker(false);
                  }}
                  style={{ backgroundColor: "#25292e" }}
                />
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#25292e",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    padding: 16,
  },
  avatarContainer: {
    position: "relative",
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 16,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#ffd33d",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOverlayText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  levelInfoContainer: {
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#2a2e35",
    borderRadius: 12,
  },
  profileLevel: {
    color: "#ffd33d",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  nextUpdateText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
  },
  updateLimitInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2e35",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  updateLimitText: {
    color: "#888",
    fontSize: 14,
    marginLeft: 8,
  },
  profileInfo: {
    backgroundColor: "#2a2e35",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3e45",
  },
  label: {
    color: "#888",
    fontSize: 16,
    width: 100,
  },
  valueContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    backgroundColor: "#3a3e45",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#3a3e45",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  datePickerText: {
    color: "#fff",
    fontSize: 16,
  },
  editButton: {
    padding: 8,
    backgroundColor: "#3a3e45",
    borderRadius: 8,
  },
  saveAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffd33d",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
  },
  saveAllButtonText: {
    color: "#25292e",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
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
  modalTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: "bold",
    color: "#fff",
  },
  modalContent: {
    flex: 1,
    padding: getResponsivePadding(),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: getResponsiveFontSize(14),
    color: "#888",
    marginTop: 12,
  },
  packageCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  packageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  packageInfo: {
    flex: 1,
  },
  packageCoins: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: "#fff",
  },
  packagePrice: {
    fontSize: getResponsiveFontSize(14),
    color: "#ffd33d",
    fontWeight: "600",
  },
  bonusBadge: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bonusText: {
    fontSize: getResponsiveFontSize(12),
    color: "#fff",
    fontWeight: "600",
  },
  packageDescription: {
    fontSize: getResponsiveFontSize(12),
    color: "#888",
    fontStyle: "italic",
  },
  paymentInfoCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  paymentDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: getResponsiveFontSize(14),
    color: "#888",
  },
  paymentValue: {
    fontSize: getResponsiveFontSize(14),
    color: "#fff",
    fontWeight: "600",
  },
  highlightValue: {
    color: "#ffd33d",
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
  },
  qrContainer: {
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  qrTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  qrInstructions: {
    fontSize: getResponsiveFontSize(12),
    color: "#888",
    textAlign: "center",
  },
  webPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffd33d",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  webPaymentText: {
    fontSize: getResponsiveFontSize(16),
    color: "#25292e",
    fontWeight: "600",
  },
  expiryContainer: {
    backgroundColor: "#ff4444",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  expiryText: {
    fontSize: getResponsiveFontSize(12),
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  expiryTime: {
    fontSize: getResponsiveFontSize(18),
    color: "#ffd33d",
    fontWeight: "bold",
  },
  statusCard: {
    backgroundColor: "#1a4b3a",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 280,
    height: 40,
    alignSelf: "center",
  },
  statusText: {
    fontSize: getResponsiveFontSize(12),
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  statusSubtext: {
    fontSize: getResponsiveFontSize(12),
    color: "#888",
    marginTop: 4,
  },
  successContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  successMessage: {
    fontSize: getResponsiveFontSize(14),
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },
  successDetailsCard: {
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  successDetailsTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  successDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  successDetailLabel: {
    fontSize: getResponsiveFontSize(14),
    color: "#888",
  },
  successDetailValue: {
    fontSize: getResponsiveFontSize(14),
    color: "#fff",
    fontWeight: "600",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 12,
    marginTop: 8,
  },
  totalValue: {
    fontSize: getResponsiveFontSize(16),
    color: "#ffd33d",
    fontWeight: "bold",
  },
  successButton: {
    backgroundColor: "#ffd33d",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  successButtonText: {
    fontSize: getResponsiveFontSize(16),
    color: "#25292e",
    fontWeight: "bold",
  },
  settingsMenu: {
    position: "absolute",
    top: 45,
    right: 10,
    backgroundColor: "#2a2e35",
    borderRadius: 8,
    padding: 8,
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  settingsMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 4,
  },
  settingsMenuText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    backgroundColor: "#25292e",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  doneButton: {
    backgroundColor: "#ffd33d",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 16,
  },
  doneButtonText: {
    color: "#25292e",
    fontSize: 16,
    fontWeight: "bold",
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
  usernameText: {
    color: "#888", // Slightly dimmed to indicate it's not editable
    fontStyle: "italic",
  },
});
