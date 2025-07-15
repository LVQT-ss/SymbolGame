import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

/**
 * Test script to verify Redis functionality after monthly reward test
 */
async function testRedisAfterMonthly() {
    console.log('🧪 Testing Redis Functionality After Monthly Reward Test\n');

    try {
        // Step 1: Check Redis stats before any action
        console.log('1️⃣ CHECKING REDIS STATS BEFORE TEST');
        const response1 = await fetch(`${BASE_URL}/api/leaderboard/redis-stats`, {
            headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
        });
        const stats1 = await response1.json();
        console.log('Redis stats before:', JSON.stringify(stats1.data || stats1, null, 2));

        // Step 2: Run test monthly rewards (this will clear monthly data)
        console.log('\n2️⃣ RUNNING TEST MONTHLY REWARDS');
        const response2 = await fetch(`${BASE_URL}/api/leaderboard/test-monthly-rewards`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const monthlyTest = await response2.json();
        console.log('Status:', response2.status);
        console.log('Monthly test result:', monthlyTest.success ? 'SUCCESS' : 'FAILED');
        if (monthlyTest.data) {
            console.log('Persistence stats:', monthlyTest.data.persistence_stats);
        }

        // Step 3: Check Redis stats after monthly test
        console.log('\n3️⃣ CHECKING REDIS STATS AFTER MONTHLY TEST');
        const response3 = await fetch(`${BASE_URL}/api/leaderboard/redis-stats`, {
            headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
        });
        const stats3 = await response3.json();
        console.log('Redis stats after monthly test:', JSON.stringify(stats3.data || stats3, null, 2));

        // Step 4: Check Redis leaderboard (should be empty or have limited data)
        console.log('\n4️⃣ CHECKING REDIS LEADERBOARD AFTER MONTHLY TEST');
        const response4 = await fetch(`${BASE_URL}/api/leaderboard/redis?difficulty_level=1&region=global&limit=10`);
        const redisLeaderboard = await response4.json();
        console.log('Status:', response4.status);
        console.log('Redis leaderboard data count:', redisLeaderboard.data?.length || 0);
        console.log('Source:', redisLeaderboard.metadata?.source);

        // Step 5: Sync historical scores to Redis to restore functionality
        console.log('\n5️⃣ SYNCING HISTORICAL SCORES TO REDIS');
        const response5 = await fetch(`${BASE_URL}/api/leaderboard/sync-historical-scores`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
        });
        const syncResult = await response5.json();
        console.log('Status:', response5.status);
        console.log('Sync result:', syncResult.success ? 'SUCCESS' : 'FAILED');
        if (syncResult.data) {
            console.log('Sync stats:', syncResult.data);
        }

        // Step 6: Check Redis stats after sync
        console.log('\n6️⃣ CHECKING REDIS STATS AFTER HISTORICAL SYNC');
        const response6 = await fetch(`${BASE_URL}/api/leaderboard/redis-stats`, {
            headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
        });
        const stats6 = await response6.json();
        console.log('Redis stats after sync:', JSON.stringify(stats6.data || stats6, null, 2));

        // Step 7: Check Redis leaderboard after sync (should have data)
        console.log('\n7️⃣ CHECKING REDIS LEADERBOARD AFTER SYNC');
        const response7 = await fetch(`${BASE_URL}/api/leaderboard/redis?difficulty_level=1&region=global&limit=10`);
        const redisLeaderboard2 = await response7.json();
        console.log('Status:', response7.status);
        console.log('Redis leaderboard data count:', redisLeaderboard2.data?.length || 0);
        console.log('Source:', redisLeaderboard2.metadata?.source);

        // Summary
        console.log('\n\n📊 SUMMARY:');
        console.log('✅ Redis stats check before:', response1.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Monthly rewards test:', response2.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Redis stats after monthly:', response3.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Redis leaderboard after monthly:', response4.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Historical scores sync:', response5.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Redis stats after sync:', response6.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Redis leaderboard after sync:', response7.status === 200 ? 'Working' : 'Failed');

        console.log('\n🎯 Expected behavior:');
        console.log('- After monthly test: Redis monthly data should be cleared');
        console.log('- After historical sync: Redis should have data again');
        console.log('- Game completion should work normally after sync');

        console.log('\n💡 If Redis is still not working after game completion:');
        console.log('1. Run: POST /api/leaderboard/sync-historical-scores');
        console.log('2. Or check if updateUserScore method has errors');
        console.log('3. Or verify Redis connection is working');

    } catch (error) {
        console.error('❌ Error testing Redis after monthly:', error.message);
    }
}

// Run the test
testRedisAfterMonthly(); 