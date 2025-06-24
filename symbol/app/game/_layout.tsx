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
        name="duoBattle/round-by-round-battle"
        options={{
          headerShown: false,
          title: "Battle Analysis",
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
