import sequelize from '../database/db.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import LeaderboardCache from '../model/leaderboard-cache.model.js';

// Import associations to ensure models are properly linked
import '../model/associations.js';

async function createSimpleLeaderboardCache() {
    try {
        console.log('🏆 Creating simple leaderboard cache...');

        // Clear existing cache
        await LeaderboardCache.destroy({ where: {} });
        console.log('🗑️  Cleared existing leaderboard cache');

        // Get all users with their statistics
        const users = await User.findAll({
            include: [{
                model: UserStatistics,
                as: 'statistics',
                required: true // Only users with statistics
            }],
            where: { is_active: true },
            order: [
                [{ model: UserStatistics, as: 'statistics' }, 'best_score', 'DESC']
            ]
        });

        console.log(`📋 Found ${users.length} users with statistics`);

        // Process difficulty levels 1, 2, 3
        for (const difficulty_level of [1, 2, 3]) {
            console.log(`\n🎯 Processing difficulty level ${difficulty_level}...`);

            // For simplicity, we'll use best_score as the ranking metric
            // In a real system, you'd filter by actual games played at each difficulty
            const rankedUsers = users
                .filter(user => user.statistics.best_score > 0)
                .sort((a, b) => b.statistics.best_score - a.statistics.best_score);

            const leaderboardEntries = rankedUsers.map((user, index) => ({
                leaderboard_type: 'allTime',
                difficulty_level: difficulty_level,
                region: 'others', // Default region since users don't have country set
                user_id: user.id,
                rank_position: index + 1,
                score: user.statistics.best_score,
                total_time: 0, // We don't have this data readily available
                full_name: user.full_name || user.username,
                avatar: user.avatar,
                current_level: user.current_level,
                country: user.country || null,
                total_games: user.statistics.games_played,
                last_updated: new Date()
            }));

            if (leaderboardEntries.length > 0) {
                await LeaderboardCache.bulkCreate(leaderboardEntries);
                console.log(`✅ Created ${leaderboardEntries.length} leaderboard entries for difficulty ${difficulty_level}`);
            }
        }

        console.log('\n🎉 Simple leaderboard cache created successfully!');

        // Test the leaderboard by querying it
        const testLeaderboard = await LeaderboardCache.findAll({
            where: { difficulty_level: 1, leaderboard_type: 'allTime' },
            order: [['rank_position', 'ASC']],
            limit: 10
        });

        console.log('\n📊 Top 10 leaderboard (Difficulty 1):');
        testLeaderboard.forEach(entry => {
            console.log(`   ${entry.rank_position}. ${entry.full_name} - Score: ${entry.score} (Games: ${entry.total_games})`);
        });

    } catch (error) {
        console.error('❌ Error creating leaderboard cache:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await sequelize.close();
    }
}

// Run the script
createSimpleLeaderboardCache(); 