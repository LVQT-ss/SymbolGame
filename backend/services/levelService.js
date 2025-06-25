/**
 * Level Service
 * 
 * Handles user level updates based on total game history scores
 * Designed for minimal system impact and high performance
 */

import GameHistory from '../model/game-history.model.js';
import User from '../model/user.model.js';
import { calculateUserLevel, checkLevelUp } from '../utils/levelUtils.js';
import { Op } from 'sequelize';

/**
 * Update a single user's level based on their total game history score
 * @param {number} userId - User ID to update
 * @param {boolean} returnDetails - Whether to return detailed level info
 * @returns {object} Update result
 */
export const updateUserLevel = async (userId, returnDetails = false) => {
    try {
        // Get user's current level data
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'current_level', 'experience_points', 'level_progress']
        });

        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        // Calculate total score from game history
        const totalScore = await GameHistory.sum('score', {
            where: {
                user_id: userId,
                completed: true
            }
        }) || 0;

        // Store old XP for level up detection
        const oldXP = user.experience_points;

        // Calculate new level based on total score
        const newLevelInfo = calculateUserLevel(totalScore);

        // Check if user leveled up
        const levelUpInfo = checkLevelUp(oldXP, totalScore);

        // Update user with new level information
        await user.update({
            experience_points: totalScore, // Total score becomes experience points
            current_level: newLevelInfo.current_level,
            level_progress: newLevelInfo.level_progress
        });

        const result = {
            user_id: userId,
            username: user.username,
            updated: true,
            old_level: levelUpInfo.old_level,
            new_level: newLevelInfo.current_level,
            leveled_up: levelUpInfo.leveled_up,
            levels_gained: levelUpInfo.levels_gained,
            total_score_xp: totalScore,
            old_xp: oldXP
        };

        if (returnDetails) {
            result.level_details = newLevelInfo;
        }

        console.log(`📊 Level updated for ${user.username}: Level ${result.old_level} → ${result.new_level} (${levelUpInfo.leveled_up ? 'LEVEL UP!' : 'No change'}) | XP: ${oldXP} → ${totalScore}`);

        return result;

    } catch (error) {
        console.error(`❌ Error updating level for user ${userId}:`, error);
        return {
            user_id: userId,
            updated: false,
            error: error.message
        };
    }
};

/**
 * Update levels for multiple users efficiently
 * @param {number[]} userIds - Array of user IDs to update
 * @param {boolean} returnDetails - Whether to return detailed results
 * @returns {object} Batch update results
 */
export const updateUserLevelsBatch = async (userIds, returnDetails = false) => {
    try {
        const results = [];
        const successful = [];
        const failed = [];

        // Process users in batches to avoid overwhelming the database
        const batchSize = 10;

        for (let i = 0; i < userIds.length; i += batchSize) {
            const batch = userIds.slice(i, i + batchSize);

            // Process batch in parallel
            const batchPromises = batch.map(userId => updateUserLevel(userId, returnDetails));
            const batchResults = await Promise.all(batchPromises);

            batchResults.forEach(result => {
                results.push(result);
                if (result.updated) {
                    successful.push(result);
                } else {
                    failed.push(result);
                }
            });
        }

        return {
            total_processed: userIds.length,
            successful_updates: successful.length,
            failed_updates: failed.length,
            level_ups_detected: successful.filter(r => r.leveled_up).length,
            results: returnDetails ? results : successful.map(r => ({
                user_id: r.user_id,
                username: r.username,
                leveled_up: r.leveled_up,
                new_level: r.new_level
            }))
        };

    } catch (error) {
        console.error('❌ Error in batch level update:', error);
        throw error;
    }
};

/**
 * Update levels for all active users (use sparingly)
 * @param {boolean} returnDetails - Whether to return detailed results
 * @returns {object} Full update results
 */
export const updateAllUserLevels = async (returnDetails = false) => {
    try {
        console.log('🔄 Starting full user level update...');

        // Get all active user IDs
        const users = await User.findAll({
            where: { is_active: true },
            attributes: ['id'],
            order: [['id', 'ASC']]
        });

        const userIds = users.map(u => u.id);
        console.log(`📊 Found ${userIds.length} active users to update`);

        const result = await updateUserLevelsBatch(userIds, returnDetails);

        console.log(`✅ Full level update completed: ${result.successful_updates}/${result.total_processed} successful`);
        return result;

    } catch (error) {
        console.error('❌ Error in full level update:', error);
        throw error;
    }
};

/**
 * Lightweight level update after game completion
 * This is designed to be called from game completion handlers
 * @param {number} userId - User ID
 * @returns {object} Simple update result
 */
export const updateUserLevelAfterGame = async (userId) => {
    try {
        const result = await updateUserLevel(userId, false);

        // Return minimal data to avoid affecting existing JSON responses
        return {
            leveled_up: result.leveled_up,
            old_level: result.old_level,
            new_level: result.new_level,
            levels_gained: result.levels_gained
        };

    } catch (error) {
        console.error(`❌ Post-game level update failed for user ${userId}:`, error);
        return {
            leveled_up: false,
            old_level: 1,
            new_level: 1,
            levels_gained: 0
        };
    }
};

/**
 * Get user's current level info without updating
 * @param {number} userId - User ID
 * @returns {object} Current level information
 */
export const getUserLevelInfo = async (userId) => {
    try {
        // Get total score from game history
        const totalScore = await GameHistory.sum('score', {
            where: {
                user_id: userId,
                completed: true
            }
        }) || 0;

        // Calculate level info
        const levelInfo = calculateUserLevel(totalScore);

        return {
            user_id: userId,
            ...levelInfo,
            calculated_from_total_score: totalScore
        };

    } catch (error) {
        console.error(`❌ Error getting level info for user ${userId}:`, error);
        return null;
    }
}; 