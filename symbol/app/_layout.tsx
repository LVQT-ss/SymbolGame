import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// Initialize Firebase
import "../config/firebase";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* StatusBar configuration for edge-to-edge mode */}
      <StatusBar
        style="light" // Light content for dark theme
        backgroundColor="#25292e" // Set dark background
        translucent={false} // Prevent overlap issues
        // hidden={true}            // Uncomment to hide completely
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#25292e" },
          animation: "fade", // Smoother transition
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="game" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
