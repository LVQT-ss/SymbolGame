import sequelize from '../database/db.js';
import { QueryTypes } from 'sequelize';

// Database migration script to update schema for UserStatistics → LeaderboardCache relationship

async function migrateLeaderboardToUserStatistics() {
    try {
        console.log('🔧 Starting database migration: LeaderboardCache → UserStatistics relationship...');

        // Step 1: Add new fields to UserStatistics table
        console.log('\n📝 Step 1: Adding new fields to UserStatistics...');

        try {
            // Add auto-increment ID field
            await sequelize.query(`
                ALTER TABLE user_statistics 
                ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
            `);
            console.log('   ✅ Added auto-increment ID field to UserStatistics');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('   ℹ️  ID field already exists in UserStatistics');
            } else {
                throw error;
            }
        }

        try {
            // Add best_score_time field
            await sequelize.query(`
                ALTER TABLE user_statistics 
                ADD COLUMN best_score_time FLOAT NULL COMMENT 'Time taken to achieve the best score (in seconds)';
            `);
            console.log('   ✅ Added best_score_time field to UserStatistics');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('   ℹ️  best_score_time field already exists in UserStatistics');
            } else {
                throw error;
            }
        }

        try {
            // Add best_score_achieved_at field
            await sequelize.query(`
                ALTER TABLE user_statistics 
                ADD COLUMN best_score_achieved_at DATETIME NULL COMMENT 'When the best score was achieved';
            `);
            console.log('   ✅ Added best_score_achieved_at field to UserStatistics');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('   ℹ️  best_score_achieved_at field already exists in UserStatistics');
            } else {
                throw error;
            }
        }

        // Step 2: Drop unique constraint on user_id + difficulty_level (if it exists as PRIMARY KEY)
        console.log('\n🔑 Step 2: Updating UserStatistics primary key...');

        try {
            // Check if the table has a composite primary key
            const primaryKeys = await sequelize.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'user_statistics' 
                AND CONSTRAINT_NAME = 'PRIMARY';
            `, { type: QueryTypes.SELECT });

            if (primaryKeys.length > 1) {
                console.log('   🔧 Dropping composite primary key...');
                await sequelize.query(`ALTER TABLE user_statistics DROP PRIMARY KEY;`);
                console.log('   ✅ Dropped composite primary key');

                // Add the new primary key on id
                await sequelize.query(`ALTER TABLE user_statistics ADD PRIMARY KEY (id);`);
                console.log('   ✅ Added new primary key on id field');

                // Add unique constraint on user_id + difficulty_level
                await sequelize.query(`
                    ALTER TABLE user_statistics 
                    ADD UNIQUE KEY unique_user_difficulty (user_id, difficulty_level);
                `);
                console.log('   ✅ Added unique constraint on user_id + difficulty_level');
            } else {
                console.log('   ℹ️  UserStatistics already has proper primary key structure');
            }
        } catch (error) {
            console.log('   ⚠️  Primary key update:', error.message);
        }

        // Step 3: Update LeaderboardCache table
        console.log('\n🏆 Step 3: Updating LeaderboardCache table...');

        try {
            // Add new user_statistics_id column
            await sequelize.query(`
                ALTER TABLE leaderboard_cache 
                ADD COLUMN user_statistics_id INT NULL 
                COMMENT 'References the specific UserStatistics record this leaderboard entry represents';
            `);
            console.log('   ✅ Added user_statistics_id field to LeaderboardCache');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('   ℹ️  user_statistics_id field already exists in LeaderboardCache');
            } else {
                throw error;
            }
        }

        // Step 4: Populate user_statistics_id in existing LeaderboardCache records
        console.log('\n🔗 Step 4: Linking existing LeaderboardCache records to UserStatistics...');

        // Get all LeaderboardCache records that don't have user_statistics_id set
        const leaderboardRecords = await sequelize.query(`
            SELECT lc.id, lc.user_id, lc.difficulty_level 
            FROM leaderboard_cache lc 
            WHERE lc.user_statistics_id IS NULL AND lc.user_id IS NOT NULL;
        `, { type: QueryTypes.SELECT });

        console.log(`   Found ${leaderboardRecords.length} LeaderboardCache records to update`);

        let updatedCount = 0;
        for (const record of leaderboardRecords) {
            try {
                // Find the corresponding UserStatistics record
                const userStats = await sequelize.query(`
                    SELECT us.id 
                    FROM user_statistics us 
                    WHERE us.user_id = :userId AND us.difficulty_level = :difficulty
                    LIMIT 1;
                `, {
                    replacements: {
                        userId: record.user_id,
                        difficulty: record.difficulty_level
                    },
                    type: QueryTypes.SELECT
                });

                if (userStats.length > 0) {
                    // Update the LeaderboardCache record
                    await sequelize.query(`
                        UPDATE leaderboard_cache 
                        SET user_statistics_id = :userStatsId 
                        WHERE id = :leaderboardId;
                    `, {
                        replacements: {
                            userStatsId: userStats[0].id,
                            leaderboardId: record.id
                        }
                    });
                    updatedCount++;
                } else {
                    console.log(`   ⚠️  No UserStatistics found for user ${record.user_id} at difficulty ${record.difficulty_level}`);
                }
            } catch (error) {
                console.log(`   ❌ Error updating LeaderboardCache record ${record.id}:`, error.message);
            }
        }

        console.log(`   ✅ Updated ${updatedCount} LeaderboardCache records with user_statistics_id`);

        // Step 5: Add foreign key constraint (optional - can be done later)
        console.log('\n🔗 Step 5: Adding foreign key constraint...');

        try {
            await sequelize.query(`
                ALTER TABLE leaderboard_cache 
                ADD CONSTRAINT fk_leaderboard_user_statistics 
                FOREIGN KEY (user_statistics_id) REFERENCES user_statistics(id) 
                ON DELETE CASCADE;
            `);
            console.log('   ✅ Added foreign key constraint: leaderboard_cache → user_statistics');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('   ℹ️  Foreign key constraint already exists');
            } else {
                console.log('   ⚠️  Could not add foreign key constraint:', error.message);
                console.log('   💡 This is non-critical and can be added manually later');
            }
        }

        // Step 6: Clean up - we can optionally remove user_id from LeaderboardCache later
        console.log('\n🧹 Step 6: Migration cleanup notes...');
        console.log('   💡 The user_id column in LeaderboardCache can be removed later once the migration is verified');
        console.log('   💡 Run: ALTER TABLE leaderboard_cache DROP COLUMN user_id;');

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📋 Summary of changes:');
        console.log('   • Added id (auto-increment) to UserStatistics');
        console.log('   • Added best_score_time field to UserStatistics');
        console.log('   • Added best_score_achieved_at field to UserStatistics');
        console.log('   • Added user_statistics_id field to LeaderboardCache');
        console.log(`   • Linked ${updatedCount} existing LeaderboardCache records to UserStatistics`);
        console.log('   • Added foreign key constraint (if possible)');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('💡 You may need to run parts of this migration manually');
        throw error;
    }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateLeaderboardToUserStatistics()
        .then(() => {
            console.log('✅ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}

export { migrateLeaderboardToUserStatistics }; 