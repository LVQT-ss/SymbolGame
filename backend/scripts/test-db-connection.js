import sequelize from '../database/db.js';

async function testConnection() {
    console.log('🔍 Testing database connection...');

    try {
        console.log('📍 Environment variables:');
        console.log('  DB_HOST:', process.env.DB_HOST || 'NOT SET');
        console.log('  DB_PORT:', process.env.DB_PORT || 'NOT SET');
        console.log('  DB_USER:', process.env.DB_USER || 'NOT SET');
        console.log('  DB_NAME:', process.env.DB_NAME || 'NOT SET');
        console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');

        console.log('\n🔌 Attempting to connect...');
        await sequelize.authenticate();
        console.log('✅ Database connection successful!');

        console.log('\n📋 Testing table access...');
        const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leaderboard_cache'");

        if (results.length > 0) {
            console.log('✅ LeaderboardCache table exists');

            // Check if month_year column exists
            const [columns] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'leaderboard_cache' AND column_name = 'month_year'");

            if (columns.length > 0) {
                console.log('✅ month_year column already exists - migration not needed!');
            } else {
                console.log('⚠️  month_year column does NOT exist - migration needed');
            }
        } else {
            console.log('❌ LeaderboardCache table does not exist');
        }

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('📝 Full error:', error);
    } finally {
        try {
            await sequelize.close();
            console.log('🔌 Database connection closed');
        } catch (closeError) {
            console.error('❌ Error closing connection:', closeError.message);
        }
    }
}

testConnection(); 