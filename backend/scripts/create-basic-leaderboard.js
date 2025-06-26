import sequelize from '../database/db.js';
import { Op } from 'sequelize';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import LeaderboardCache from '../model/leaderboard-cache.model.js';

async function createBasicLeaderboard() {
    try {
        console.log('🏆 Creating basic leaderboard cache...');

        // Clear existing cache
        await LeaderboardCache.destroy({ where: {} });
        console.log('🗑️  Cleared existing leaderboard cache');

        // Get all user statistics with scores > 0
        const userStats = await UserStatistics.findAll({
            where: {
                best_score: { [Op.gt]: 0 }
            },
            order: [['best_score', 'DESC']]
        });

        console.log(`📊 Found ${userStats.length} users with scores > 0`);

        // Get user details for each
        const leaderboardData = [];
        for (const stat of userStats) {
            const user = await User.findByPk(stat.user_id, {
                attributes: ['id', 'username', 'full_name', 'avatar', 'current_level', 'country']
            });

            if (user) {
                leaderboardData.push({
                    user_id: user.id,
                    username: user.username,
                    full_name: user.full_name || user.username,
                    avatar: user.avatar,
                    current_level: user.current_level,
                    country: user.country,
                    best_score: stat.best_score,
                    games_played: stat.games_played,
                    total_score: stat.total_score
                });
            }
        }

        // Sort by best score descending
        leaderboardData.sort((a, b) => b.best_score - a.best_score);

        console.log('\n📋 Leaderboard data:');
        leaderboardData.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.full_name} - Score: ${user.best_score} (${user.games_played} games)`);
        });

        // Create leaderboard cache entries for all 3 difficulty levels
        for (const difficulty_level of [1, 2, 3]) {
            const cacheEntries = leaderboardData.map((user, index) => ({
                leaderboard_type: 'allTime',
                difficulty_level: difficulty_level,
                region: 'others',
                user_id: user.user_id,
                rank_position: index + 1,
                score: user.best_score,
                total_time: 0,
                full_name: user.full_name,
                avatar: user.avatar,
                current_level: user.current_level,
                country: user.country,
                total_games: user.games_played,
                last_updated: new Date()
            }));

            if (cacheEntries.length > 0) {
                try {
                    await LeaderboardCache.bulkCreate(cacheEntries, {
                        ignoreDuplicates: true
                    });
                    console.log(`✅ Created ${cacheEntries.length} entries for difficulty ${difficulty_level}`);
                } catch (error) {
                    console.log(`⚠️  Error creating entries for difficulty ${difficulty_level}: ${error.message}`);
                    // Try creating one by one to handle unique constraint issues
                    for (const entry of cacheEntries) {
                        try {
                            await LeaderboardCache.create(entry);
                        } catch (singleError) {
                            console.log(`   ⚠️  Skipped duplicate entry for user ${entry.full_name}`);
                        }
                    }
                }
            }
        }

        console.log('\n🎉 Basic leaderboard cache created successfully!');

        // Verify the leaderboard
        const testQuery = await LeaderboardCache.findAll({
            where: { difficulty_level: 1, leaderboard_type: 'allTime' },
            order: [['rank_position', 'ASC']],
            limit: 5
        });

        console.log('\n🏆 Top 5 Leaderboard (Difficulty 1):');
        testQuery.forEach(entry => {
            console.log(`   ${entry.rank_position}. ${entry.full_name} - ${entry.score} points`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

createBasicLeaderboard(); 