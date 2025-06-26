import sequelize from '../database/db.js';
import { Op } from 'sequelize';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import GameHistory from '../model/game-history.model.js';
import GameSession from '../model/game-sessions.model.js';
import LeaderboardCache from '../model/leaderboard-cache.model.js';

// Import and setup associations
import '../model/associations.js';

async function fixUserStatisticsComplete() {
    try {
        console.log('🔧 Starting comprehensive user statistics fix...');

        // Get all active users
        const users = await User.findAll({
            where: { is_active: true },
            attributes: ['id', 'username', 'full_name']
        });

        console.log(`📋 Found ${users.length} active users to process`);

        // Process each difficulty level separately
        for (const difficulty_level of [1, 2, 3]) {
            console.log(`\n🎯 Processing difficulty level ${difficulty_level}...`);

            for (const user of users) {
                console.log(`\n👤 Processing user: ${user.username} (ID: ${user.id}) - Difficulty ${difficulty_level}`);

                // Find or create UserStatistics record for this difficulty
                let userStats = await UserStatistics.findOne({
                    where: {
                        user_id: user.id,
                        difficulty_level: difficulty_level
                    }
                });

                if (!userStats) {
                    console.log(`   ⚠️  No statistics record found for difficulty ${difficulty_level}, creating one...`);
                    userStats = await UserStatistics.create({
                        user_id: user.id,
                        difficulty_level: difficulty_level,
                        games_played: 0,
                        best_score: 0,
                        total_score: 0
                    });
                }

                // Method 1: Get stats from GameHistory (preferred for completeGame API)
                const gameHistoryStats = await sequelize.query(`
                    SELECT 
                        COUNT(*) as games_played,
                        COALESCE(MAX(gh.score), 0) as best_score,
                        COALESCE(SUM(gh.score), 0) as total_score
                    FROM game_history gh 
                    JOIN game_sessions gs ON gh.game_session_id = gs.id 
                    WHERE gh.user_id = :userId 
                    AND gh.completed = true 
                    AND gs.difficulty_level = :difficulty
                `, {
                    replacements: { userId: user.id, difficulty: difficulty_level },
                    type: sequelize.QueryTypes.SELECT
                });

                // Method 2: Get stats from GameSession (for submitWholeGame API)
                const gameSessionStats = await GameSession.findAll({
                    where: {
                        user_id: user.id,
                        completed: true,
                        difficulty_level: difficulty_level
                    },
                    attributes: [
                        [sequelize.fn('COUNT', sequelize.col('id')), 'games_played'],
                        [sequelize.fn('MAX', sequelize.col('score')), 'best_score'],
                        [sequelize.fn('SUM', sequelize.col('score')), 'total_score']
                    ],
                    raw: true
                });

                const historyData = gameHistoryStats[0] || { games_played: 0, best_score: 0, total_score: 0 };
                const sessionData = gameSessionStats[0] || { games_played: 0, best_score: 0, total_score: 0 };

                // Use the maximum values from both sources (accounts for both API methods)
                const finalStats = {
                    games_played: Math.max(
                        parseInt(historyData.games_played) || 0,
                        parseInt(sessionData.games_played) || 0
                    ),
                    best_score: Math.max(
                        parseInt(historyData.best_score) || 0,
                        parseInt(sessionData.best_score) || 0
                    ),
                    total_score: Math.max(
                        parseInt(historyData.total_score) || 0,
                        parseInt(sessionData.total_score) || 0
                    )
                };

                console.log(`   📊 GameHistory stats: ${historyData.games_played} games, best: ${historyData.best_score}, total: ${historyData.total_score}`);
                console.log(`   📊 GameSession stats: ${sessionData.games_played} games, best: ${sessionData.best_score}, total: ${sessionData.total_score}`);
                console.log(`   🎯 Final stats: ${finalStats.games_played} games, best: ${finalStats.best_score}, total: ${finalStats.total_score}`);

                // Update user statistics only if values have changed
                const needsUpdate = (
                    userStats.games_played !== finalStats.games_played ||
                    userStats.best_score !== finalStats.best_score ||
                    userStats.total_score !== finalStats.total_score
                );

                if (needsUpdate) {
                    await userStats.update(finalStats);
                    console.log(`   ✅ Updated UserStatistics for ${user.username} at difficulty ${difficulty_level}`);
                } else {
                    console.log(`   ✅ UserStatistics already correct for ${user.username} at difficulty ${difficulty_level}`);
                }
            }
        }

        console.log('\n🎉 User statistics fix completed successfully!');
        console.log('\n🏆 Now updating leaderboard cache...');

        // Clear and rebuild leaderboard cache
        await LeaderboardCache.destroy({ where: {} });
        console.log('🗑️  Cleared existing leaderboard cache');

        // Import leaderboard controller and update cache
        const { default: LeaderboardController } = await import('../controllers/leaderboard.controller.js');

        const mockReq = {};
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`📈 Leaderboard cache update result (${code}): ${data.message}`);
                    return { status: code, json: data };
                }
            })
        };

        await LeaderboardController.updateLeaderboardCache(mockReq, mockRes);

        console.log('\n🎉 All fixes completed! User statistics and leaderboard should now be accurate.');

        // Verify the results by showing top users
        console.log('\n📊 Top 5 users by best score (all difficulties):');
        const topUsers = await UserStatistics.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'full_name']
            }],
            where: {
                best_score: { [Op.gt]: 0 }
            },
            order: [['best_score', 'DESC']],
            limit: 5
        });

        topUsers.forEach((stat, index) => {
            const username = stat.user.full_name || stat.user.username;
            console.log(`   ${index + 1}. ${username} - Difficulty ${stat.difficulty_level}: ${stat.best_score} points (${stat.games_played} games)`);
        });

    } catch (error) {
        console.error('❌ Error fixing user statistics:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await sequelize.close();
    }
}

// Run the script
fixUserStatisticsComplete(); 