import { QueryInterface, DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

/**
 * Migration script to add month_year column to leaderboard_cache table
 * This enables storing historical monthly leaderboard data separately
 */

const migrationScript = async () => {
    console.log('🔧 Starting migration: Adding month_year column to leaderboard_cache table...');

    try {
        const queryInterface = sequelize.getQueryInterface();

        // Check if the column already exists
        const tableDescription = await queryInterface.describeTable('leaderboard_cache');

        if (tableDescription.month_year) {
            console.log('✅ month_year column already exists. Skipping migration.');
            return;
        }

        // Add month_year column
        await queryInterface.addColumn('leaderboard_cache', 'month_year', {
            type: DataTypes.STRING(7),
            allowNull: true,
            comment: 'Month and year in YYYY-MM format (e.g., 2024-01). Required for monthly leaderboards, null for others'
        });

        console.log('✅ Successfully added month_year column');

        // Drop existing unique index
        try {
            await queryInterface.removeIndex('leaderboard_cache', 'idx_leaderboard_user_unique');
            console.log('✅ Removed old unique index');
        } catch (error) {
            console.log('⚠️  Old unique index not found or already removed');
        }

        // Create new unique index including month_year
        await queryInterface.addIndex('leaderboard_cache', {
            fields: ['leaderboard_type', 'month_year', 'user_statistics_id', 'region', 'difficulty_level'],
            unique: true,
            name: 'idx_leaderboard_user_unique'
        });

        console.log('✅ Created new unique index with month_year');

        // Update existing fast query index
        try {
            await queryInterface.removeIndex('leaderboard_cache', 'idx_leaderboard_fast_query');
            console.log('✅ Removed old fast query index');
        } catch (error) {
            console.log('⚠️  Old fast query index not found or already removed');
        }

        await queryInterface.addIndex('leaderboard_cache', {
            fields: ['leaderboard_type', 'month_year', 'region', 'difficulty_level', 'rank_position'],
            name: 'idx_leaderboard_fast_query'
        });

        console.log('✅ Updated fast query index with month_year');

        // Add new month_year index
        await queryInterface.addIndex('leaderboard_cache', {
            fields: ['month_year'],
            name: 'idx_leaderboard_month_year'
        });

        console.log('✅ Added month_year index');

        // Update existing monthly records to have current month_year
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        const [updatedRows] = await sequelize.query(`
            UPDATE leaderboard_cache 
            SET month_year = :monthYear 
            WHERE leaderboard_type = 'monthly' AND month_year IS NULL
        `, {
            replacements: { monthYear: currentMonth }
        });

        console.log(`✅ Updated ${updatedRows} existing monthly records with current month (${currentMonth})`);

        console.log('🎉 Migration completed successfully!');
        console.log('\n📋 Summary:');
        console.log('  ✅ Added month_year column');
        console.log('  ✅ Updated indexes to include month_year');
        console.log('  ✅ Updated existing monthly records');
        console.log('\n💡 You can now:');
        console.log('  • Store separate monthly leaderboards for each month');
        console.log('  • Query historical monthly data using month_year parameter');
        console.log('  • View previous months\' rankings');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrationScript().catch(console.error);
}

export default migrationScript; 