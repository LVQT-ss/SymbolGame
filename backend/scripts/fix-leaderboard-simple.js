import sequelize from '../database/db.js';
import { Op } from 'sequelize';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import LeaderboardCache from '../model/leaderboard-cache.model.js';

// Import associations
import '../model/associations.js';

async function fixLeaderboardSimple() {
    try {
        console.log('🏆 Starting simplified leaderboard fix...');

        // First, let's check what UserStatistics data we have
        console.log('\n📊 Checking UserStatistics data...');
        const userStats = await UserStatistics.findAll({
            where: {
                best_score: { [Op.gt]: 0 }
            },
            order: [['best_score', 'DESC']]
        });

        console.log(`Found ${userStats.length} UserStatistics records with scores > 0:`);
        for (const stat of userStats) {
            const user = await User.findByPk(stat.user_id, {
                attributes: ['username', 'full_name', 'avatar', 'current_level', 'country']
            });
            if (user) {
                console.log(`  User ${stat.user_id} (${user.username}): Difficulty ${stat.difficulty_level}, Score: ${stat.best_score}, Games: ${stat.games_played}`);
            }
        }

        if (userStats.length === 0) {
            console.log('❌ No UserStatistics with scores > 0 found. Users need to complete games first.');
            return;
        }

        // Clear existing leaderboard cache
        console.log('\n🗑️  Clearing existing leaderboard cache...');
        await LeaderboardCache.destroy({ where: {} });

        // Create leaderboard entries for each difficulty level
        console.log('\n🏆 Creating new leaderboard cache entries...');

        for (const difficulty_level of [1, 2, 3]) {
            console.log(`\n🎯 Processing difficulty level ${difficulty_level}...`);

            // Get all UserStatistics for this difficulty with scores > 0
            const difficultyStats = await UserStatistics.findAll({
                where: {
                    difficulty_level: difficulty_level,
                    best_score: { [Op.gt]: 0 }
                },
                order: [['best_score', 'DESC']]
            });

            console.log(`  Found ${difficultyStats.length} users with scores for difficulty ${difficulty_level}`);

            if (difficultyStats.length === 0) {
                console.log(`  ⚠️  No users with scores for difficulty ${difficulty_level}, skipping...`);
                continue;
            }

            // Create leaderboard entries
            const leaderboardEntries = [];
            for (let i = 0; i < difficultyStats.length; i++) {
                const stat = difficultyStats[i];

                // Get user details
                const user = await User.findByPk(stat.user_id, {
                    attributes: ['username', 'full_name', 'avatar', 'current_level', 'country']
                });

                if (!user) {
                    console.log(`  ⚠️  User ${stat.user_id} not found, skipping...`);
                    continue;
                }

                // Determine region
                const REGION_MAPPING = {
                    // Asia
                    'VN': 'asia', 'JP': 'asia', 'KR': 'asia', 'CN': 'asia', 'TH': 'asia',
                    'SG': 'asia', 'MY': 'asia', 'ID': 'asia', 'PH': 'asia', 'IN': 'asia',
                    // America
                    'US': 'america', 'CA': 'america', 'BR': 'america', 'MX': 'america',
                    'AR': 'america', 'CL': 'america', 'CO': 'america', 'PE': 'america',
                    // Europe
                    'DE': 'europe', 'FR': 'europe', 'UK': 'europe', 'IT': 'europe',
                    'ES': 'europe', 'NL': 'europe', 'SE': 'europe', 'NO': 'europe',
                    // Oceania
                    'AU': 'oceania', 'NZ': 'oceania', 'FJ': 'oceania',
                    // Africa
                    'ZA': 'africa', 'NG': 'africa', 'EG': 'africa', 'KE': 'africa'
                };

                const region = REGION_MAPPING[user.country] || 'others';

                // Create both allTime and monthly entries
                const baseEntry = {
                    difficulty_level: difficulty_level,
                    region: region,
                    user_id: user.id,
                    rank_position: i + 1,
                    score: stat.best_score,
                    total_time: 0, // We don't have this data in UserStatistics
                    full_name: user.full_name || user.username,
                    avatar: user.avatar,
                    current_level: user.current_level,
                    country: user.country,
                    total_games: stat.games_played,
                    last_updated: new Date()
                };

                // All-time entry
                leaderboardEntries.push({
                    ...baseEntry,
                    leaderboard_type: 'allTime'
                });

                // Monthly entry (same as all-time for now)
                leaderboardEntries.push({
                    ...baseEntry,
                    leaderboard_type: 'monthly'
                });

                console.log(`  ${i + 1}. ${user.full_name || user.username} - Score: ${stat.best_score} (${stat.games_played} games)`);
            }

            // Bulk create leaderboard entries
            if (leaderboardEntries.length > 0) {
                await LeaderboardCache.bulkCreate(leaderboardEntries);
                console.log(`  ✅ Created ${leaderboardEntries.length} leaderboard entries for difficulty ${difficulty_level}`);
            }
        }

        console.log('\n🎉 Leaderboard cache updated successfully!');

        // Verify the results
        console.log('\n🏆 Top 5 leaderboard entries (all difficulties):');
        const topEntries = await LeaderboardCache.findAll({
            where: { leaderboard_type: 'allTime' },
            order: [['score', 'DESC']],
            limit: 5
        });

        topEntries.forEach((entry, index) => {
            console.log(`  ${index + 1}. ${entry.full_name} - Difficulty ${entry.difficulty_level}: ${entry.score} points`);
        });

        console.log('\n✅ Leaderboard fix completed successfully!');

    } catch (error) {
        console.error('❌ Error fixing leaderboard:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await sequelize.close();
    }
}

fixLeaderboardSimple(); 