import sequelize from '../database/db.js';
import LeaderboardCache from '../model/leaderboard-cache.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import User from '../model/user.model.js';
import GameHistory from '../model/game-history.model.js';
import GameSession from '../model/game-sessions.model.js';

// Import associations
import '../model/associations.js';

async function checkLeaderboardData() {
    try {
        console.log('📊 Checking current leaderboard-related data...\n');

        // Check UserStatistics
        console.log('1. UserStatistics data:');
        const userStats = await UserStatistics.findAll({
            order: [['best_score', 'DESC']]
        });
        console.log(`   Found ${userStats.length} UserStatistics records:`);
        userStats.forEach(stat => {
            console.log(`   User ${stat.user_id}, Difficulty ${stat.difficulty_level}: ${stat.games_played} games, best: ${stat.best_score}, total: ${stat.total_score}`);
        });

        // Check LeaderboardCache
        console.log('\n2. LeaderboardCache data:');
        const leaderboard = await LeaderboardCache.findAll({
            order: [['rank_position', 'ASC']]
        });
        console.log(`   Found ${leaderboard.length} LeaderboardCache records`);
        if (leaderboard.length > 0) {
            leaderboard.slice(0, 5).forEach(entry => {
                console.log(`   ${entry.rank_position}. ${entry.full_name} - Score: ${entry.score} (Difficulty ${entry.difficulty_level})`);
            });
        }

        // Check GameHistory with scores
        console.log('\n3. GameHistory with scores:');
        const gameHistory = await GameHistory.findAll({
            where: { completed: true },
            order: [['score', 'DESC']],
            limit: 5
        });
        console.log(`   Found ${gameHistory.length} completed GameHistory records:`);
        gameHistory.forEach(game => {
            console.log(`   Game ${game.id}: User ${game.user_id}, Score: ${game.score}, Session: ${game.game_session_id}`);
        });

        // Check Users
        console.log('\n4. Active Users:');
        const users = await User.findAll({
            where: { is_active: true },
            attributes: ['id', 'username', 'full_name']
        });
        console.log(`   Found ${users.length} active users:`);
        users.forEach(user => {
            console.log(`   User ${user.id}: ${user.username} (${user.full_name})`);
        });

        console.log('\n✅ Data check completed');

    } catch (error) {
        console.error('❌ Error checking data:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await sequelize.close();
    }
}

checkLeaderboardData(); 