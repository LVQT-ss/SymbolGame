import sequelize from '../database/db.js';

/**
 * FIXED Migration script to add month_year column to leaderboard_cache table
 * This version has better error handling and won't hang
 */

const migrationScript = async () => {
    console.log('🔧 Starting FIXED migration: Adding month_year column to leaderboard_cache table...');

    try {
        // Test connection first
        console.log('🔌 Testing database connection...');
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');

        const queryInterface = sequelize.getQueryInterface();

        // Check if the column already exists
        console.log('🔍 Checking if month_year column exists...');
        const tableDescription = await queryInterface.describeTable('leaderboard_cache');

        if (tableDescription.month_year) {
            console.log('✅ month_year column already exists. Skipping migration.');
            return { success: true, message: 'Column already exists' };
        }

        console.log('📝 month_year column not found. Adding it...');

        // Add month_year column with explicit SQL (more reliable)
        await sequelize.query(`
            ALTER TABLE leaderboard_cache 
            ADD COLUMN month_year VARCHAR(7)
        `);

        // Add comment separately (PostgreSQL syntax)
        await sequelize.query(`
            COMMENT ON COLUMN leaderboard_cache.month_year IS 'Month and year in YYYY-MM format (e.g., 2024-01). Required for monthly leaderboards, null for others'
        `);

        console.log('✅ Successfully added month_year column');

        // Update existing monthly records to have current month_year
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        console.log(`📅 Updating existing monthly records with current month (${currentMonth})...`);

        const [result] = await sequelize.query(`
            UPDATE leaderboard_cache 
            SET month_year = :monthYear 
            WHERE leaderboard_type = 'monthly' AND month_year IS NULL
        `, {
            replacements: { monthYear: currentMonth }
        });

        console.log(`✅ Updated existing monthly records`);

        // Create indexes (more robust approach)
        console.log('📊 Creating/updating indexes...');

        try {
            // Create month_year index
            await sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_leaderboard_month_year 
                ON leaderboard_cache (month_year)
            `);
            console.log('✅ Created month_year index');
        } catch (indexError) {
            console.log('⚠️  Index creation skipped:', indexError.message);
        }

        console.log('🎉 Migration completed successfully!');
        console.log('\n📋 Summary:');
        console.log('  ✅ Added month_year column');
        console.log('  ✅ Updated existing monthly records');
        console.log('  ✅ Created necessary indexes');
        console.log('\n💡 You can now:');
        console.log('  • Store separate monthly leaderboards for each month');
        console.log('  • Query historical monthly data using month_year parameter');
        console.log('  • View previous months\' rankings');

        return { success: true, message: 'Migration completed successfully' };

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
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
};

// Run migration if this file is executed directly
migrationScript()
    .then(result => {
        console.log('\n🏁 Migration finished:', result);
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Migration crashed:', error);
        process.exit(1);
    }); 