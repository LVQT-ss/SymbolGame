import sequelize from '../database/db.js';
import LeaderboardCache from '../model/leaderboard-cache.model.js';

async function testMonthlyPersistence() {
    console.log('🧪 Testing monthly persistence with new month_year column...');

    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Test 1: Try to create a monthly entry with month_year
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        console.log(`🗓️  Testing with current month: ${currentMonth}`);

        const testEntry = {
            leaderboard_type: 'monthly',
            month_year: currentMonth,
            difficulty_level: 1,
            region: 'global',
            user_statistics_id: 1, // Using a test user ID
            rank_position: 1,
            score: 100,
            total_time: 30,
            full_name: 'Test User',
            avatar: null,
            current_level: 1,
            country: 'US',
            total_games: 5,
            last_updated: new Date()
        };

        console.log('📝 Creating test monthly leaderboard entry...');

        // Try to create the entry
        const created = await LeaderboardCache.create(testEntry);
        console.log('✅ Successfully created monthly entry with month_year!');
        console.log(`   ID: ${created.id}, Month: ${created.month_year}`);

        // Test 2: Query entries by month_year
        console.log('\n🔍 Testing month_year queries...');

        const monthlyEntries = await LeaderboardCache.findAll({
            where: {
                leaderboard_type: 'monthly',
                month_year: currentMonth
            },
            limit: 5
        });

        console.log(`✅ Found ${monthlyEntries.length} monthly entries for ${currentMonth}`);

        // Test 3: Test the availability of months
        console.log('\n📅 Testing available months query...');

        const [availableMonths] = await sequelize.query(`
            SELECT DISTINCT month_year 
            FROM leaderboard_cache 
            WHERE leaderboard_type = 'monthly' 
            AND month_year IS NOT NULL 
            ORDER BY month_year DESC
        `);

        console.log(`✅ Available months: ${availableMonths.map(m => m.month_year).join(', ')}`);

        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await LeaderboardCache.destroy({
            where: {
                full_name: 'Test User',
                leaderboard_type: 'monthly'
            }
        });
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 All tests passed! Monthly persistence with month_year is working correctly!');
        return { success: true, message: 'Monthly persistence tests passed' };

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('📝 Full error:', error);
        return { success: false, message: error.message };
    } finally {
        try {
            await sequelize.close();
            console.log('🔌 Database connection closed');
        } catch (closeError) {
            console.error('❌ Error closing connection:', closeError.message);
        }
    }
}

testMonthlyPersistence()
    .then(result => {
        console.log('\n🏁 Test finished:', result);
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test crashed:', error);
        process.exit(1);
    }); 