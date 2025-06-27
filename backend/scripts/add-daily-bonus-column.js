import sequelize from '../database/db.js';

async function addDailyBonusColumn() {
    try {
        await sequelize.query(`ALTER TABLE users ADD COLUMN last_daily_bonus DATETIME NULL COMMENT 'The last time the user claimed their daily bonus'`);
        console.log('✅ last_daily_bonus column added to users table');
    } catch (error) {
        console.error('❌ Error adding last_daily_bonus column:', error);
    } finally {
        await sequelize.close();
    }
}

addDailyBonusColumn(); 