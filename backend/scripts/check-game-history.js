import sequelize from '../database/db.js';
import User from '../model/user.model.js';
import GameHistory from '../model/game-history.model.js';
import GameSession from '../model/game-sessions.model.js';

async function checkGameHistory() {
    try {
        console.log('🔍 Checking game history for user...');

        const userId = 1; // Based on your issue

        // Check ALL GameHistory records for this user (including incomplete)
        const allGameHistory = await GameHistory.findAll({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        console.log(`\n📋 All GameHistory records for user ${userId}:`);
        if (allGameHistory.length === 0) {
            console.log('   ❌ No GameHistory records found');
        } else {
            allGameHistory.forEach((game, index) => {
                console.log(`   ${index + 1}. ID: ${game.id}, Score: ${game.score}, Completed: ${game.completed}, Created: ${game.createdAt}`);
            });
        }

        // Check ALL GameSession records for this user
        const allGameSessions = await GameSession.findAll({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        console.log(`\n🎮 All GameSession records for user ${userId}:`);
        if (allGameSessions.length === 0) {
            console.log('   ❌ No GameSession records found');
        } else {
            allGameSessions.forEach((game, index) => {
                console.log(`   ${index + 1}. ID: ${game.id}, Score: ${game.score}, Completed: ${game.completed}, Created: ${game.createdAt}`);
            });
        }

        // Check for any recent game activities across all users to see if the system is working
        console.log('\n🌐 Recent game activities (all users):');

        const recentHistory = await GameHistory.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5,
            attributes: ['id', 'user_id', 'score', 'completed', 'createdAt']
        });

        console.log('   Recent GameHistory:');
        recentHistory.forEach(game => {
            console.log(`     User ${game.user_id}: ID ${game.id}, Score ${game.score}, Completed: ${game.completed}`);
        });

        const recentSessions = await GameSession.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5,
            attributes: ['id', 'user_id', 'score', 'completed', 'createdAt']
        });

        console.log('   Recent GameSessions:');
        recentSessions.forEach(game => {
            console.log(`     User ${game.user_id}: ID ${game.id}, Score ${game.score}, Completed: ${game.completed}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkGameHistory(); 