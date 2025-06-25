// Test script to verify that game completion responses include updated user info
import { updateUserLevelAfterGame } from '../services/levelService.js';
import User from '../model/user.model.js';
import GameHistory from '../model/game-history.model.js';
import sequelize from '../database/db.js';

const testLevelUpdateResponse = async () => {
    try {
        console.log('🧪 Testing level update response functionality...\n');

        // Find a test user
        const testUser = await User.findOne({
            where: { usertype: 'Customer' },
            attributes: ['id', 'username', 'current_level', 'experience_points']
        });

        if (!testUser) {
            console.log('❌ No test user found');
            return;
        }

        console.log(`👤 Test User: ${testUser.username} (ID: ${testUser.id})`);
        console.log(`📊 Current Level: ${testUser.current_level}`);
        console.log(`🔥 Current XP: ${testUser.experience_points}\n`);

        // Get total score from game history
        const totalScore = await GameHistory.sum('score', {
            where: { user_id: testUser.id }
        }) || 0;

        console.log(`🎮 Total Game Score: ${totalScore}`);

        // Test the level update function
        console.log('🔄 Testing level update function...');
        const levelUpdateResult = await updateUserLevelAfterGame(testUser.id);

        console.log('\n✅ Level Update Result:');
        console.log('- Old Level:', levelUpdateResult.old_level);
        console.log('- New Level:', levelUpdateResult.new_level);
        console.log('- Leveled Up:', levelUpdateResult.leveled_up);
        console.log('- Levels Gained:', levelUpdateResult.levels_gained);
        console.log('- Total XP:', levelUpdateResult.total_xp);
        console.log('- Next Level XP:', levelUpdateResult.next_level_xp);
        console.log('- Progress:', `${levelUpdateResult.progress_percentage}%`);

        // Get updated user data
        const updatedUser = await User.findByPk(testUser.id, {
            attributes: ['current_level', 'experience_points', 'level_progress']
        });

        console.log('\n📱 Updated User Info for Frontend:');
        const updatedUserInfo = {
            current_level: updatedUser.current_level,
            experience_points: updatedUser.experience_points,
            level_progress: updatedUser.level_progress,
            coins: 999 // Example - would come from user.coins + coinsEarned
        };
        console.log(JSON.stringify(updatedUserInfo, null, 2));

        if (levelUpdateResult.leveled_up) {
            console.log('\n🎉 LEVEL UP DETECTED! Frontend should show celebration!');
        } else {
            console.log('\n📈 No level up, but progress updated.');
        }

        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the test
testLevelUpdateResponse(); 