import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { apiUtils, paymentAPI } from "../services/api";
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

  // Update tempUsername when userProfile.username changes
  useEffect(() => {
    setTempUsername(userProfile.username);
  }, [userProfile.username]);

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
  // Payment Modal Styles
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
  // QR Payment Modal Styles
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
  // Payment Status Styles
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
  // Success Modal Styles
  successContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  successMessage: {
    fontSize: getResponsiveFontSize(16),
    color: "#888",
    textAlign: "center",
    lineHeight: 24,
  },
  successDetailsCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
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
    marginBottom: 12,
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
});
