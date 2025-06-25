/**
 * Level Progress Demo Component
 *
 * This component demonstrates the new level progression system
 * Use this for testing and validating the level calculations
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getLevelDisplayInfo, calculateUserLevel } from "../utils/levelUtils";

interface DemoProps {
  experiencePoints: number;
}

export const LevelProgressDemo: React.FC<DemoProps> = ({
  experiencePoints,
}) => {
  const mockUserProfile = {
    experience_points: experiencePoints,
    current_level: 1, // This will be overridden by calculation
    level_progress: 0, // This will be overridden by calculation
  };

  const levelInfo = getLevelDisplayInfo(mockUserProfile);
  const detailedInfo = calculateUserLevel(experiencePoints);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎮 Level Progress Demo</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Input XP: {experiencePoints.toLocaleString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Current Level:</Text>
        <Text style={styles.value}>{levelInfo.currentLevel}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Progress:</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${levelInfo.progressPercent}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{levelInfo.progressPercent}%</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>XP Status:</Text>
        <Text style={styles.value}>
          {levelInfo.isMaxLevel
            ? `🏆 Max Level! ${levelInfo.formattedCurrentXP} XP`
            : `${levelInfo.formattedCurrentXP} / ${levelInfo.formattedNextLevelXP} XP`}
        </Text>
      </View>

      {!levelInfo.isMaxLevel && (
        <View style={styles.section}>
          <Text style={styles.label}>XP Needed for Next Level:</Text>
          <Text style={styles.value}>{levelInfo.formattedXPNeeded}</Text>
        </View>
      )}

      <View style={styles.detailsSection}>
        <Text style={styles.detailsTitle}>📊 Detailed Info</Text>
        <Text style={styles.detail}>
          Current Level XP: {detailedInfo.current_level_xp.toLocaleString()}
        </Text>
        <Text style={styles.detail}>
          Next Level XP: {detailedInfo.next_level_xp.toLocaleString()}
        </Text>
        <Text style={styles.detail}>
          Progress: {(detailedInfo.level_progress * 100).toFixed(1)}%
        </Text>
        <Text style={styles.detail}>
          Max Level: {detailedInfo.is_max_level ? "Yes" : "No"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffd33d",
    textAlign: "center",
    marginBottom: 16,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffd33d",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#888",
    minWidth: 40,
  },
  detailsSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffd33d",
    marginBottom: 8,
  },
  detail: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 2,
  },
});

export default LevelProgressDemo;
