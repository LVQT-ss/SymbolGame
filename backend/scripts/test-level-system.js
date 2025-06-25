/**
 * Test script for the new level progression system
 * Run with: node scripts/test-level-system.js
 */

import { calculateUserLevel, getLevelRequirements } from '../utils/levelUtils.js';

console.log('🎮 Level Progression System Test\n');

// Show level requirements
console.log('📊 Level Requirements:');
const levels = getLevelRequirements();
for (let i = 0; i < 10; i++) {
    const level = levels[i];
    console.log(`Level ${level.level}: ${level.totalXP.toLocaleString()} XP total (${level.xpNeeded.toLocaleString()} XP needed from previous)`);
}

console.log('\n🧪 Testing User Level Calculations:');

// Test cases with different total scores
const testCases = [
    { totalScore: 0, description: 'New player' },
    { totalScore: 500, description: 'Beginner' },
    { totalScore: 1000, description: 'Just reached Level 2' },
    { totalScore: 1500, description: 'Halfway to Level 3' },
    { totalScore: 2500, description: 'Just reached Level 3' },
    { totalScore: 4750, description: 'Just reached Level 4' },
    { totalScore: 8125, description: 'Just reached Level 5' },
    { totalScore: 10000, description: 'High performer' },
    { totalScore: 50000, description: 'Master player' }
];

testCases.forEach(testCase => {
    const levelInfo = calculateUserLevel(testCase.totalScore);
    console.log(`\n${testCase.description} (${testCase.totalScore.toLocaleString()} XP):`);
    console.log(`  → Level: ${levelInfo.current_level}`);
    console.log(`  → Progress: ${Math.round(levelInfo.level_progress * 100)}%`);
    console.log(`  → Next Level XP: ${levelInfo.next_level_xp.toLocaleString()}`);
    console.log(`  → XP Needed: ${levelInfo.xp_needed_for_next_level.toLocaleString()}`);

    if (levelInfo.is_max_level) {
        console.log(`  → 🏆 MAX LEVEL REACHED!`);
    }
});

console.log('\n✅ Level progression system test completed!');
console.log('\n📝 Summary:');
console.log('- Total game history score = Experience points');
console.log('- Level 1: 0 XP, Level 2: 1,000 XP, Level 3: 2,500 XP, Level 4: 4,750 XP');
console.log('- Each level increment increases by 50% of the previous increment');
console.log('- Users automatically level up when their total score reaches thresholds'); 