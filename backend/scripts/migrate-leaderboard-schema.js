import sequelize from '../database/db.js';
import { QueryTypes } from 'sequelize';

async function migrateLeaderboardSchema() {
    try {
        console.log('🔧 Starting database migration for UserStatistics-LeaderboardCache relationship...');

        // Step 1: Add new fields to UserStatistics
        console.log('\n📝 Adding new fields to UserStatistics...');

        try {
            await sequelize.query(`
                ALTER TABLE user_statistics 
                ADD COLUMN best_score_time FLOAT NULL COMMENT 'Time taken to achieve the best score (in seconds)',
                ADD COLUMN best_score_achieved_at DATETIME NULL COMMENT 'When the best score was achieved';
            `);
            console.log('   ✅ Added best_score_time and best_score_achieved_at fields');
        } catch (error) {
            console.log('   ℹ️  Fields may already exist:', error.message);
        }

        // Step 2: Add ID field to UserStatistics if it doesn't exist
        try {
            await sequelize.query(`
                ALTER TABLE user_statistics 
                ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
            `);
            console.log('   ✅ Added auto-increment ID field');
        } catch (error) {
            console.log('   ℹ️  ID field may already exist:', error.message);
        }

        // Step 3: Add user_statistics_id to LeaderboardCache
        console.log('\n🏆 Updating LeaderboardCache table...');

        try {
            await sequelize.query(`
                ALTER TABLE leaderboard_cache 
                ADD COLUMN user_statistics_id INT NULL 
                COMMENT 'References UserStatistics record';
            `);
            console.log('   ✅ Added user_statistics_id field to LeaderboardCache');
        } catch (error) {
            console.log('   ℹ️  Field may already exist:', error.message);
        }

        console.log('\n🎉 Schema migration completed!');
        console.log('\n💡 Next steps:');
        console.log('   1. Run the fix-user-statistics-complete.js script to populate data');
        console.log('   2. Test the leaderboard functionality');
        console.log('   3. Remove user_id column from LeaderboardCache when ready');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateLeaderboardSchema()
        .then(() => {
            console.log('✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

export default migrateLeaderboardSchema; 