import sequelize from '../database/db.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import GameHistory from '../model/game-history.model.js';
import GameSession from '../model/game-sessions.model.js';

// Import and setup associations
import '../model/associations.js';

async function fixUserStatistics() {
    try {
        console.log('🔧 Starting user statistics fix...');

        // Get all users
        const users = await User.findAll({
            where: { is_active: true },
            attributes: ['id', 'username']
        });

        console.log(`📋 Found ${users.length} active users to process`);

        for (const user of users) {
            console.log(`\n👤 Processing user: ${user.username} (ID: ${user.id})`);

            // Check if user has statistics record
            let userStats = await UserStatistics.findOne({ where: { user_id: user.id } });

            if (!userStats) {
                console.log(`   ⚠️  No statistics record found, creating one...`);
                userStats = await UserStatistics.create({
                    user_id: user.id,
                    games_played: 0,
                    best_score: 0,
                    total_score: 0
                });
            }

            // Get statistics from GameHistory (preferred source for completed games)
            const gameHistoryStats = {
                games_played: await GameHistory.count({
                    where: { user_id: user.id, completed: true }
                }),
                best_score: await GameHistory.max('score', {
                    where: { user_id: user.id, completed: true }
                }) || 0,
                total_score: await GameHistory.sum('score', {
                    where: { user_id: user.id, completed: true }
                }) || 0
            };

            // Get statistics from GameSession (for games completed via submitWholeGame)
            const gameSessionStats = {
                games_played: await GameSession.count({
                    where: { user_id: user.id, completed: true }
                }),
                best_score: await GameSession.max('score', {
                    where: { user_id: user.id, completed: true }
                }) || 0,
                total_score: await GameSession.sum('score', {
                    where: { user_id: user.id, completed: true }
                }) || 0
            };

            console.log(`   📊 GameHistory stats: ${gameHistoryStats.games_played} games, best: ${gameHistoryStats.best_score}, total: ${gameHistoryStats.total_score}`);
            console.log(`   📊 GameSession stats: ${gameSessionStats.games_played} games, best: ${gameSessionStats.best_score}, total: ${gameSessionStats.total_score}`);

            // Use the higher values from both sources
            const finalStats = {
                games_played: Math.max(gameHistoryStats.games_played, gameSessionStats.games_played),
                best_score: Math.max(gameHistoryStats.best_score, gameSessionStats.best_score),
                total_score: Math.max(gameHistoryStats.total_score, gameSessionStats.total_score)
            };

            // Update user statistics
            await userStats.update(finalStats);

            console.log(`   ✅ Updated statistics: ${finalStats.games_played} games, best: ${finalStats.best_score}, total: ${finalStats.total_score}`);
        }

        console.log('\n🎉 User statistics fix completed successfully!');
        console.log('\n📝 Now updating leaderboard cache...');

        // Trigger leaderboard cache update
        const LeaderboardController = await import('../controllers/leaderboard.controller.js');

        // Create a mock request/response for the controller
        const mockReq = {};
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`📈 Leaderboard cache update result: ${data.message}`);
                    return { status: code, json: data };
                }
            })
        };

        await LeaderboardController.default.updateLeaderboardCache(mockReq, mockRes);

        console.log('\n🏆 All fixes completed! Leaderboard should now show correct data.');

    } catch (error) {
        console.error('❌ Error fixing user statistics:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await sequelize.close();
    }
}

// Run the fix
fixUserStatistics(); 