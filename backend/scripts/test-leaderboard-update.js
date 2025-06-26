import sequelize from '../database/db.js';
import LeaderboardController from '../controllers/leaderboard.controller.js';

async function testLeaderboardUpdate() {
    try {
        console.log('🧪 Testing leaderboard update...');

        // Create mock request/response objects
        const mockReq = {};
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`📈 Response (${code}):`, data.message);
                    return { status: code, json: data };
                }
            })
        };

        // Call the leaderboard update function
        await LeaderboardController.updateLeaderboardCache(mockReq, mockRes);

        console.log('✅ Leaderboard update test completed');

    } catch (error) {
        console.error('❌ Error testing leaderboard update:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await sequelize.close();
    }
}

testLeaderboardUpdate(); 