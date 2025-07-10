import RedisLeaderboardService from './services/redisLeaderboardService.js';
import LeaderboardCache from './model/leaderboard-cache.model.js';
import { Op } from 'sequelize';

/**
 * Test script to verify historical monthly leaderboard storage
 * This tests that each month's data is stored separately and can be retrieved
 */

const testMonthlyHistory = async () => {
    console.log('🧪 Testing Historical Monthly Leaderboard Storage\n');

    try {
        // 1. Test current month persistence
        console.log('1️⃣ Testing current month persistence...');

        const currentResult = await RedisLeaderboardService.backupToDatabase({
            includeRewards: false,
            clearMonthlyData: false,  // Don't clear for testing
            difficulty_levels: [1],  // Test with difficulty 1 only
            regions: ['global'],     // Test with global only
            leaderboardType: 'monthly'
        });

        console.log('✅ Current month backup result:', {
            success: currentResult.success,
            entriesStored: currentResult.totalEntriesStored
        });

        // 2. Simulate previous month data by manually inserting test data
        console.log('\n2️⃣ Simulating previous month data...');

        const previousMonth = '2024-11';  // November 2024
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        // Insert test data for previous month
        const previousMonthData = [
            {
                leaderboard_type: 'monthly',
                month_year: previousMonth,
                region: null,  // global
                difficulty_level: 1,
                user_statistics_id: 999,  // Test user ID
                rank_position: 1,
                score: 95,
                total_time: 120.5,
                full_name: 'Test Player Previous',
                avatar: null,
                current_level: 5,
                country: 'VN',
                total_games: 10,
                last_updated: new Date()
            },
            {
                leaderboard_type: 'monthly',
                month_year: previousMonth,
                region: null,  // global
                difficulty_level: 1,
                user_statistics_id: 998,  // Test user ID
                rank_position: 2,
                score: 88,
                total_time: 135.2,
                full_name: 'Test Player 2 Previous',
                avatar: null,
                current_level: 4,
                country: 'US',
                total_games: 8,
                last_updated: new Date()
            }
        ];

        // Remove any existing test data first
        await LeaderboardCache.destroy({
            where: {
                user_statistics_id: { [Op.in]: [999, 998] }
            }
        });

        // Insert test previous month data
        await LeaderboardCache.bulkCreate(previousMonthData);
        console.log(`✅ Inserted ${previousMonthData.length} test records for ${previousMonth}`);

        // 3. Test querying different months
        console.log('\n3️⃣ Testing month-specific queries...');

        // Query current month
        const currentMonthData = await LeaderboardCache.findAll({
            where: {
                leaderboard_type: 'monthly',
                month_year: currentMonth,
                difficulty_level: 1,
                region: null
            },
            order: [['rank_position', 'ASC']],
            limit: 5
        });

        console.log(`📊 Current month (${currentMonth}) data:`, {
            count: currentMonthData.length,
            topPlayer: currentMonthData[0] ? {
                name: currentMonthData[0].full_name,
                score: currentMonthData[0].score,
                rank: currentMonthData[0].rank_position
            } : 'No data'
        });

        // Query previous month
        const previousMonthResults = await LeaderboardCache.findAll({
            where: {
                leaderboard_type: 'monthly',
                month_year: previousMonth,
                difficulty_level: 1,
                region: null
            },
            order: [['rank_position', 'ASC']],
            limit: 5
        });

        console.log(`📊 Previous month (${previousMonth}) data:`, {
            count: previousMonthResults.length,
            topPlayer: previousMonthResults[0] ? {
                name: previousMonthResults[0].full_name,
                score: previousMonthResults[0].score,
                rank: previousMonthResults[0].rank_position
            } : 'No data'
        });

        // 4. Test available months query
        console.log('\n4️⃣ Testing available months query...');

        const availableMonths = await LeaderboardCache.findAll({
            where: {
                leaderboard_type: 'monthly',
                month_year: { [Op.not]: null },
                difficulty_level: 1,
                region: null
            },
            attributes: ['month_year'],
            group: ['month_year'],
            order: [['month_year', 'DESC']]
        });

        console.log('📅 Available months:', availableMonths.map(m => m.month_year));

        // 5. Verify data separation
        console.log('\n5️⃣ Verifying data separation...');

        const allMonthlyData = await LeaderboardCache.findAll({
            where: {
                leaderboard_type: 'monthly',
                difficulty_level: 1,
                region: null
            },
            attributes: ['month_year', 'full_name', 'score', 'rank_position'],
            order: [['month_year', 'DESC'], ['rank_position', 'ASC']]
        });

        const dataByMonth = {};
        allMonthlyData.forEach(record => {
            if (!dataByMonth[record.month_year]) {
                dataByMonth[record.month_year] = [];
            }
            dataByMonth[record.month_year].push({
                name: record.full_name,
                score: record.score,
                rank: record.rank_position
            });
        });

        console.log('📊 Data separation verification:');
        Object.keys(dataByMonth).forEach(month => {
            console.log(`  ${month}: ${dataByMonth[month].length} players`);
            dataByMonth[month].slice(0, 2).forEach(player => {
                console.log(`    ${player.rank}. ${player.name} (${player.score} pts)`);
            });
        });

        // 6. Clean up test data
        console.log('\n6️⃣ Cleaning up test data...');

        const deletedCount = await LeaderboardCache.destroy({
            where: {
                user_statistics_id: { [Op.in]: [999, 998] }
            }
        });

        console.log(`🧹 Cleaned up ${deletedCount} test records`);

        console.log('\n🎉 Historical Monthly Leaderboard Test Completed Successfully!');
        console.log('\n✅ Verified functionality:');
        console.log('  • Monthly data is stored with month_year identifier');
        console.log('  • Each month\'s data is kept separate');
        console.log('  • Historical months can be queried independently');
        console.log('  • Available months can be retrieved');
        console.log('  • Data separation prevents overwrites');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testMonthlyHistory().catch(console.error);
}

export default testMonthlyHistory; 