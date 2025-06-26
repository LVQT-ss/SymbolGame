import sequelize from '../database/db.js';

async function addCountryColumn() {
    try {
        console.log('Adding country column to users table...');

        // Add the country column
        await sequelize.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS country VARCHAR(2)
        `);

        console.log('✓ Country column added successfully');

        // Add comment to country column
        await sequelize.query(`
            COMMENT ON COLUMN users.country IS 'ISO 3166-1 alpha-2 country code (e.g., US, VN, JP)'
        `);

        console.log('✓ Country column comment added');

        // Create index for country
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_users_country ON users(country)
        `);

        console.log('✓ Country index created successfully');

        // Check if leaderboard_cache table exists and add total_time column
        try {
            await sequelize.query(`
                ALTER TABLE leaderboard_cache 
                ADD COLUMN IF NOT EXISTS total_time REAL
            `);
            console.log('✓ Total time column added to leaderboard cache');

            // Add comment to total_time column
            await sequelize.query(`
                COMMENT ON COLUMN leaderboard_cache.total_time IS 'Total time spent playing (in seconds)'
            `);
            console.log('✓ Total time column comment added');

        } catch (error) {
            console.log('ℹ Leaderboard cache table may not exist yet, skipping...');
        }

        console.log('🎉 Database migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
    } finally {
        await sequelize.close();
    }
}

addCountryColumn(); 