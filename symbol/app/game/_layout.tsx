import { Stack } from "expo-router";
import React from "react";

export default function GameLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="menu"
        options={{
          headerShown: false,
          title: "Game Menu",
        }}
      />
      <Stack.Screen
        name="game"
        options={{
          headerShown: false,
          title: "Game",
        }}
      />
      <Stack.Screen
        name="round"
        options={{
          headerShown: false,
          title: "Round",
        }}
      />
      <Stack.Screen
        name="round-by-round"
        options={{
          headerShown: false,
          title: "Round by Round",
        }}
      />
      <Stack.Screen
        name="play"
        options={{
          headerShown: false,
          title: "Play",
        }}
      />
    </Stack>
  );
}
