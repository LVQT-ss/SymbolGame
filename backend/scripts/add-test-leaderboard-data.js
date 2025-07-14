import sequelize from '../database/db.js';
import LeaderboardCache from '../model/leaderboard-cache.model.js';

async function addTestLeaderboardData() {
    console.log('🎮 Adding test leaderboard data...');

    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Clear existing test data
        await LeaderboardCache.destroy({
            where: { full_name: { [sequelize.Sequelize.Op.like]: 'TestUser%' } }
        });

        // Add test leaderboard entries
        const testEntries = [];

        for (let i = 1; i <= 20; i++) {
            // All-time entries
            testEntries.push({
                leaderboard_type: 'allTime',
                difficulty_level: 1,
                region: 'global',
                user_statistics_id: 1000 + i,
                rank_position: i,
                score: 10000 - (i * 100),
                total_time: 60 + (i * 5),
                full_name: `TestUser${i}`,
                avatar: `https://i.pravatar.cc/150?img=${i}`,
                current_level: Math.floor(Math.random() * 10) + 1,
                country: ['US', 'VN', 'JP', 'KR', 'DE'][i % 5],
                total_games: Math.floor(Math.random() * 50) + 10,
                last_updated: new Date()
            });

            // Monthly entries (without month_year for now)
            testEntries.push({
                leaderboard_type: 'monthly',
                difficulty_level: 1,
                region: 'global',
                user_statistics_id: 2000 + i,
                rank_position: i,
                score: 8000 - (i * 80),
                total_time: 50 + (i * 3),
                full_name: `MonthlyUser${i}`,
                avatar: `https://i.pravatar.cc/150?img=${i + 20}`,
                current_level: Math.floor(Math.random() * 8) + 1,
                country: ['CA', 'FR', 'UK', 'BR', 'AU'][i % 5],
                total_games: Math.floor(Math.random() * 30) + 5,
                last_updated: new Date()
            });
        }

        await LeaderboardCache.bulkCreate(testEntries);
        console.log(`✅ Added ${testEntries.length} test leaderboard entries`);

        // Verify data was added
        const allTimeCount = await LeaderboardCache.count({ where: { leaderboard_type: 'allTime' } });
        const monthlyCount = await LeaderboardCache.count({ where: { leaderboard_type: 'monthly' } });

        console.log(`📊 Database now has:`);
        console.log(`   📈 All-time entries: ${allTimeCount}`);
        console.log(`   📅 Monthly entries: ${monthlyCount}`);

        return { success: true, message: 'Test data added successfully' };

    } catch (error) {
        console.error('❌ Error adding test data:', error);
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

addTestLeaderboardData()
    .then(result => {
        console.log('\n🏁 Script finished:', result);
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Script crashed:', error);
        process.exit(1);
    }); 