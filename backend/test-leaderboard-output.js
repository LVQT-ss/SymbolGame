// Test script to check leaderboard endpoints and show JSON output
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testLeaderboardEndpoints() {
    console.log('🏆 TESTING LEADERBOARD SYSTEM - JSON OUTPUT');
    console.log('='.repeat(60));

    try {
        // Test 1: Main leaderboard endpoint (PostgreSQL-first, Redis fallback)
        console.log('\n1️⃣ MAIN LEADERBOARD ENDPOINT (PostgreSQL-first)');
        console.log('URL: GET /api/leaderboard?difficulty_level=1&region=global&time_period=alltime&limit=10');

        const response1 = await fetch(`${BASE_URL}/api/leaderboard?difficulty_level=1&region=global&time_period=alltime&limit=10`);
        const data1 = await response1.json();

        console.log('Status:', response1.status);
        console.log('JSON Output:');
        console.log(JSON.stringify(data1, null, 2));

        // Test 2: Redis-only leaderboard endpoint
        console.log('\n\n2️⃣ REDIS-ONLY LEADERBOARD ENDPOINT');
        console.log('URL: GET /api/leaderboard/redis?difficulty_level=1&region=global&time_period=alltime&limit=10');

        const response2 = await fetch(`${BASE_URL}/api/leaderboard/redis?difficulty_level=1&region=global&time_period=alltime&limit=10`);
        const data2 = await response2.json();

        console.log('Status:', response2.status);
        console.log('JSON Output:');
        console.log(JSON.stringify(data2, null, 2));

        // Test 3: Regional leaderboard (Asia)
        console.log('\n\n3️⃣ REGIONAL LEADERBOARD (ASIA)');
        console.log('URL: GET /api/leaderboard?difficulty_level=1&region=asia&time_period=alltime&limit=10');

        const response3 = await fetch(`${BASE_URL}/api/leaderboard?difficulty_level=1&region=asia&time_period=alltime&limit=10`);
        const data3 = await response3.json();

        console.log('Status:', response3.status);
        console.log('JSON Output:');
        console.log(JSON.stringify(data3, null, 2));

        // Test 4: Monthly leaderboard
        console.log('\n\n4️⃣ MONTHLY LEADERBOARD');
        console.log('URL: GET /api/leaderboard?difficulty_level=1&region=global&time_period=monthly&limit=10');

        const response4 = await fetch(`${BASE_URL}/api/leaderboard?difficulty_level=1&region=global&time_period=monthly&limit=10`);
        const data4 = await response4.json();

        console.log('Status:', response4.status);
        console.log('JSON Output:');
        console.log(JSON.stringify(data4, null, 2));

        // Test 5: Different difficulty level
        console.log('\n\n5️⃣ DIFFICULTY LEVEL 2 LEADERBOARD');
        console.log('URL: GET /api/leaderboard?difficulty_level=2&region=global&time_period=alltime&limit=10');

        const response5 = await fetch(`${BASE_URL}/api/leaderboard?difficulty_level=2&region=global&time_period=alltime&limit=10`);
        const data5 = await response5.json();

        console.log('Status:', response5.status);
        console.log('JSON Output:');
        console.log(JSON.stringify(data5, null, 2));

        // Summary
        console.log('\n\n📊 SUMMARY:');
        console.log('✅ Main leaderboard (PostgreSQL-first):', response1.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Redis-only leaderboard:', response2.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Regional leaderboard (Asia):', response3.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Monthly leaderboard:', response4.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Difficulty 2 leaderboard:', response5.status === 200 ? 'Working' : 'Failed');

    } catch (error) {
        console.error('❌ Error testing leaderboard endpoints:', error.message);
    }
}

// Run the test
testLeaderboardEndpoints(); 