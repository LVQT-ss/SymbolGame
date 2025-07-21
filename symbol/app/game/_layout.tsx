import { Stack } from "expo-router";
import React from "react";

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#25292e" },
        animation: "fade", // Smoother transition
      }}
    >
      <Stack.Screen
        name="menu"
        options={{
          headerShown: false,
          title: "Game Menu",
        }}
      />
      <Stack.Screen
        name="play"
        options={{
          headerShown: false,
          title: "Play",
        }}
      />
      <Stack.Screen
        name="gameResult"
        options={{
          headerShown: false,
          title: "Game Results",
        }}
      />
      <Stack.Screen
        name="duoBattle/battleMenu"
        options={{
          headerShown: false,
          title: "Battle Arena",
        }}
      />
      <Stack.Screen
        name="duoBattle/createBattle"
        options={{
          headerShown: false,
          title: "Create Battle",
        }}
      />
      <Stack.Screen
        name="duoBattle/joinBattle"
        options={{
          headerShown: false,
          title: "Join Battle",
        }}
      />
      <Stack.Screen
        name="duoBattle/battleGame"
        options={{
          headerShown: false,
          title: "Battle Game",
        }}
      />
      <Stack.Screen
        name="duoBattle/battleResult"
        options={{
          headerShown: false,
          title: "Battle Results",
        }}
      />
    </Stack>
  );
}
