import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      // Check if user is authenticated
      const token = await AsyncStorage.getItem("token");
      const userData = await AsyncStorage.getItem("user_profile");

      // Add a small delay to prevent flash
      setTimeout(() => {
        if (token && userData) {
          // User is authenticated, go to main app
          router.replace("/(tabs)/home");
        } else {
          // User not authenticated, go to auth screen
          router.replace("/(auth)/Auth");
        }
      }, 1000);
    } catch (error) {
      console.error("Auth check error:", error);
      // If there's an error, default to auth screen
      setTimeout(() => {
        router.replace("/(auth)/Auth");
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ffd33d" />
      <Text style={styles.loadingText}>Loading Symbol...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 20,
    fontWeight: "bold",
  },
});
