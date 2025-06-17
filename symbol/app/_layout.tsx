import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function RootLayout() {
  return (
    <>
      {/* StatusBar configuration for edge-to-edge mode */}
      <StatusBar
        style="light" // Light content for dark theme
        // backgroundColor removed due to edge-to-edge mode
        // translucent removed as it's always true in edge-to-edge
        // hidden={true}            // Uncomment to hide completely
      />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="game" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
