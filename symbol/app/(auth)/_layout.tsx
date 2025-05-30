import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#25292e" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#25292e",
          },
          headerTintColor: "#fff",
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen
          name="Auth"
          options={{
            title: "Authentication",
            headerShown: false, // Hide header for cleaner auth experience
          }}
        />
      </Stack>
    </>
  );
}
