/**
 * Frontend Level Progression Utility
 * 
 * This utility mirrors the backend level progression system where:
 * - Total game history score = experience points  
 * - Level requirements increase progressively
 * - Level 1: 0 XP, Level 2: 1,000 XP, Level 3: 2,500 XP, Level 4: 4,750 XP, etc.
 */

interface LevelRequirement {
  level: number;
  totalXP: number;
  xpNeeded: number;
}

interface UserLevelInfo {
  current_level: number;
  experience_points: number;
  level_progress: number; // 0-1 float
  current_level_xp: number;
  next_level_xp: number;
  xp_needed_for_next_level: number;
  is_max_level: boolean;
}

/**
 * Calculate level requirements based on the progressive system
 * Level 1: 0 XP (starting level)
 * Level 2: 1,000 XP
 * Level 3: 2,500 XP (1,500 more) 
 * Level 4: 4,750 XP (2,250 more)
 * Level 5: 8,125 XP (3,375 more)
 * 
 * Pattern: Each level increment increases by 50% of the previous increment
 */
export const calculateLevelRequirements = (): LevelRequirement[] => {
  const levels: LevelRequirement[] = [
    { level: 1, totalXP: 0, xpNeeded: 0 },
    { level: 2, totalXP: 1000, xpNeeded: 1000 }
  ];

  let currentIncrement = 1000; // Base increment from Level 1 to 2
  let currentTotal = 1000;

  // Calculate up to level 100 (should be more than enough)
  for (let level = 3; level <= 100; level++) {
    currentIncrement = Math.floor(currentIncrement * 1.5); // 50% increase
    currentTotal += currentIncrement;
    
    levels.push({
      level: level,
      totalXP: currentTotal,
      xpNeeded: currentIncrement
    });
  }

  return levels;
};

/**
 * Get the cached level requirements (computed once for performance)
 */
let cachedLevelRequirements: LevelRequirement[] | null = null;
export const getLevelRequirements = (): LevelRequirement[] => {
  if (!cachedLevelRequirements) {
    cachedLevelRequirements = calculateLevelRequirements();
  }
  return cachedLevelRequirements;
};

/**
 * Calculate user level based on total experience points
 * @param totalXP - Total experience points (total game history score)
 * @returns Level information
 */
export const calculateUserLevel = (totalXP: number): UserLevelInfo => {
  const levels = getLevelRequirements();
  
  // Find the highest level the user has achieved
  let currentLevel = 1;
  let currentLevelXP = 0;
  let nextLevelXP = 1000;
  let progressToNext = 0;

  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalXP >= levels[i].totalXP) {
      currentLevel = levels[i].level;
      currentLevelXP = levels[i].totalXP;
      
      // Find next level XP
      if (i + 1 < levels.length) {
        nextLevelXP = levels[i + 1].totalXP;
        progressToNext = (totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
      } else {
        // Max level reached
        nextLevelXP = currentLevelXP;
        progressToNext = 1.0;
      }
      break;
    }
  }

  return {
    current_level: currentLevel,
    experience_points: totalXP,
    level_progress: Math.min(progressToNext, 1.0),
    current_level_xp: currentLevelXP,
    next_level_xp: nextLevelXP,
    xp_needed_for_next_level: Math.max(0, nextLevelXP - totalXP),
    is_max_level: progressToNext >= 1.0 && currentLevel >= 100
  };
};

/**
 * Get level requirement for a specific level
 * @param level - Target level
 * @returns Level requirement info
 */
export const getLevelRequirement = (level: number): LevelRequirement => {
  const levels = getLevelRequirements();
  const levelData = levels.find(l => l.level === level);
  
  if (!levelData) {
    return { level: 1, totalXP: 0, xpNeeded: 0 };
  }
  
  return levelData;
};

/**
 * Format XP numbers with appropriate suffixes (K, M, B)
 * @param num - Number to format
 * @returns Formatted string
 */
export const formatXP = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Get level display information for UI
 * @param userProfile - User profile object
 * @returns Display information for level progress
 */
export const getLevelDisplayInfo = (userProfile: any) => {
  // Use experience_points as the source of truth (total game history score)
  const totalXP = userProfile.experience_points || 0;
  const levelInfo = calculateUserLevel(totalXP);
  
  return {
    currentLevel: levelInfo.current_level,
    experience: levelInfo.experience_points,
    progressPercent: Math.round(levelInfo.level_progress * 100),
    currentLevelXP: levelInfo.current_level_xp,
    nextLevelXP: levelInfo.next_level_xp,
    xpNeeded: levelInfo.xp_needed_for_next_level,
    isMaxLevel: levelInfo.is_max_level,
    formattedCurrentXP: formatXP(totalXP),
    formattedNextLevelXP: formatXP(levelInfo.next_level_xp),
    formattedXPNeeded: formatXP(levelInfo.xp_needed_for_next_level)
  };
}; 