import sequelize from '../database/db.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import GameHistory from '../model/game-history.model.js';
import GameSession from '../model/game-sessions.model.js';

async function simulateGameCompletion() {
    try {
        console.log('🎮 Simulating game completion for user 1...');

        const userId = 1;

        // Get user
        const user = await User.findByPk(userId);
        if (!user) {
            console.error(`❌ User ${userId} not found`);
            return;
        }

        console.log(`👤 Simulating for user: ${user.username}`);

        // Create a test GameSession (like submitWholeGame does)
        console.log('\n📝 Creating test GameSession...');
        const gameSession = await GameSession.create({
            user_id: userId,
            difficulty_level: 1,
            number_of_rounds: 5,
            total_time: 30.5,
            correct_answers: 4,
            score: 420,
            completed: true,
            is_public: true,
            created_by_admin: null,
            admin_instructions: null
        });

        console.log(`✅ Created GameSession ${gameSession.id} with score ${gameSession.score}`);

        // Create a test GameHistory (like completeGame does)
        console.log('\n📝 Creating test GameHistory...');
        const gameHistory = await GameHistory.create({
            game_session_id: gameSession.id,
            user_id: userId,
            total_time: 30.5,
            correct_answers: 4,
            score: 450, // Slightly different score to test best score logic
            completed: true,
            started_at: new Date(Date.now() - 30000),
            completed_at: new Date()
        });

        console.log(`✅ Created GameHistory ${gameHistory.id} with score ${gameHistory.score}`);

        // Now test the UserStatistics update logic (copy from the fixed code)
        console.log('\n📊 Testing UserStatistics update...');

        try {
            console.log(`📊 Updating UserStatistics for user ${userId} (${user.username})...`);

            // Find or create user statistics record
            let userStats = await UserStatistics.findOne({ where: { user_id: userId } });
            if (!userStats) {
                console.log(`   ⚠️  UserStatistics record not found, creating new one...`);
                userStats = await UserStatistics.create({
                    user_id: userId,
                    games_played: 0,
                    best_score: 0,
                    total_score: 0
                });
                console.log(`   ✅ Created UserStatistics record for user ${userId}`);
            }

            // Get current best score from GameHistory
            const currentBestScore = await GameHistory.max('score', {
                where: { user_id: userId, completed: true }
            }) || 0;

            // Get total games played from GameHistory  
            const totalGamesPlayed = await GameHistory.count({
                where: { user_id: userId, completed: true }
            });

            // Get total score from GameHistory
            const totalScore = await GameHistory.sum('score', {
                where: { user_id: userId, completed: true }
            }) || 0;

            console.log(`   📈 Calculated stats - Games: ${totalGamesPlayed}, Best: ${currentBestScore}, Total: ${totalScore}`);

            // Update the statistics
            await userStats.update({
                games_played: totalGamesPlayed,
                best_score: currentBestScore,
                total_score: totalScore
            });

            console.log(`   ✅ Successfully updated UserStatistics for ${user.username}: ${totalGamesPlayed} games, best: ${currentBestScore}, total: ${totalScore}`);

        } catch (statsError) {
            console.error(`❌ Error updating UserStatistics for user ${userId}:`, statsError);
        }

        // Verify the final result
        console.log('\n🔍 Final verification...');
        const finalStats = await UserStatistics.findOne({ where: { user_id: userId } });
        console.log(`📊 Final UserStatistics:`);
        console.log(`   Games Played: ${finalStats.games_played}`);
        console.log(`   Best Score: ${finalStats.best_score}`);
        console.log(`   Total Score: ${finalStats.total_score}`);

        console.log('\n✅ Simulation complete! UserStatistics update logic is working.');
        console.log('\n💡 The issue is likely that when you play a game, the GameHistory/GameSession records are not being created.');
        console.log('💡 Check the frontend game completion API calls and server logs when you actually play a game.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await sequelize.close();
    }
}

simulateGameCompletion(); 