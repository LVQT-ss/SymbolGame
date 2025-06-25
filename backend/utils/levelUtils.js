/**
 * Level Progression Utility
 * 
 * This utility handles the new level progression system where:
 * - Total game history score = experience points  
 * - Level requirements increase progressively
 * - Level 1: 0 XP, Level 2: 1,000 XP, Level 3: 2,500 XP, Level 4: 4,750 XP, etc.
 */

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
export const calculateLevelRequirements = () => {
    const levels = [
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
let cachedLevelRequirements = null;
export const getLevelRequirements = () => {
    if (!cachedLevelRequirements) {
        cachedLevelRequirements = calculateLevelRequirements();
    }
    return cachedLevelRequirements;
};

/**
 * Calculate user level based on total experience points
 * @param {number} totalXP - Total experience points (total game history score)
 * @returns {object} Level information
 */
export const calculateUserLevel = (totalXP) => {
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
 * Get level requirements for a specific level
 * @param {number} level - Target level
 * @returns {object} Level requirement info
 */
export const getLevelRequirement = (level) => {
    const levels = getLevelRequirements();
    const levelData = levels.find(l => l.level === level);

    if (!levelData) {
        return { level: 1, totalXP: 0, xpNeeded: 0 };
    }

    return levelData;
};

/**
 * Check if user leveled up from old to new XP
 * @param {number} oldXP - Previous total XP
 * @param {number} newXP - New total XP
 * @returns {object} Level up information
 */
export const checkLevelUp = (oldXP, newXP) => {
    const oldLevelInfo = calculateUserLevel(oldXP);
    const newLevelInfo = calculateUserLevel(newXP);

    const leveledUp = newLevelInfo.current_level > oldLevelInfo.current_level;

    return {
        leveled_up: leveledUp,
        old_level: oldLevelInfo.current_level,
        new_level: newLevelInfo.current_level,
        levels_gained: newLevelInfo.current_level - oldLevelInfo.current_level,
        new_level_info: newLevelInfo
    };
}; 