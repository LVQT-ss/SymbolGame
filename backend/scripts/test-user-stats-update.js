import sequelize from '../database/db.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import GameHistory from '../model/game-history.model.js';
import GameSession from '../model/game-sessions.model.js';

async function testUserStatsUpdate() {
    try {
        console.log('🧪 Testing UserStatistics update...');

        // Get a specific user (user_id = 1 based on your issue)
        const userId = 1;
        const user = await User.findByPk(userId);

        if (!user) {
            console.error(`❌ User ${userId} not found`);
            return;
        }

        console.log(`👤 Testing for user: ${user.username} (ID: ${userId})`);

        // Check current UserStatistics
        let userStats = await UserStatistics.findOne({ where: { user_id: userId } });

        if (!userStats) {
            console.log(`⚠️  No UserStatistics record found for user ${userId}, creating one...`);
            userStats = await UserStatistics.create({
                user_id: userId,
                games_played: 0,
                best_score: 0,
                total_score: 0
            });
            console.log(`✅ Created UserStatistics record`);
        }

        console.log('\n📊 Current UserStatistics:');
        console.log(`   Games Played: ${userStats.games_played}`);
        console.log(`   Best Score: ${userStats.best_score}`);
        console.log(`   Total Score: ${userStats.total_score}`);

        // Check GameHistory data
        const gameHistoryStats = {
            count: await GameHistory.count({ where: { user_id: userId, completed: true } }),
            bestScore: await GameHistory.max('score', { where: { user_id: userId, completed: true } }) || 0,
            totalScore: await GameHistory.sum('score', { where: { user_id: userId, completed: true } }) || 0
        };

        console.log('\n🎮 GameHistory stats:');
        console.log(`   Completed Games: ${gameHistoryStats.count}`);
        console.log(`   Best Score: ${gameHistoryStats.bestScore}`);
        console.log(`   Total Score: ${gameHistoryStats.totalScore}`);

        // Check GameSession data  
        const gameSessionStats = {
            count: await GameSession.count({ where: { user_id: userId, completed: true } }),
            bestScore: await GameSession.max('score', { where: { user_id: userId, completed: true } }) || 0,
            totalScore: await GameSession.sum('score', { where: { user_id: userId, completed: true } }) || 0
        };

        console.log('\n🎯 GameSession stats:');
        console.log(`   Completed Games: ${gameSessionStats.count}`);
        console.log(`   Best Score: ${gameSessionStats.bestScore}`);
        console.log(`   Total Score: ${gameSessionStats.totalScore}`);

        // Determine what the UserStatistics should be
        const shouldBe = {
            games_played: Math.max(gameHistoryStats.count, gameSessionStats.count),
            best_score: Math.max(gameHistoryStats.bestScore, gameSessionStats.bestScore),
            total_score: Math.max(gameHistoryStats.totalScore, gameSessionStats.totalScore)
        };

        console.log('\n🎯 UserStatistics should be:');
        console.log(`   Games Played: ${shouldBe.games_played}`);
        console.log(`   Best Score: ${shouldBe.best_score}`);
        console.log(`   Total Score: ${shouldBe.total_score}`);

        // Update if needed
        if (userStats.games_played !== shouldBe.games_played ||
            userStats.best_score !== shouldBe.best_score ||
            userStats.total_score !== shouldBe.total_score) {

            console.log('\n🔧 UserStatistics needs updating, fixing now...');

            await userStats.update(shouldBe);

            console.log('✅ UserStatistics updated successfully!');
        } else {
            console.log('\n✅ UserStatistics are already correct!');
        }

        // Check recent game activities
        const recentGames = await GameHistory.findAll({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']],
            limit: 3,
            attributes: ['id', 'score', 'completed', 'createdAt']
        });

        console.log('\n📝 Recent GameHistory entries:');
        recentGames.forEach(game => {
            console.log(`   Game ${game.id}: Score ${game.score}, Completed: ${game.completed}, Created: ${game.createdAt}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await sequelize.close();
    }
}

testUserStatsUpdate(); 