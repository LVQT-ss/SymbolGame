import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

/**
 * Test script to verify month_year parameter functionality in leaderboard endpoints
 */
async function testMonthYearLeaderboard() {
    console.log('🧪 Testing Leaderboard Month/Year Functionality\n');

    try {
        // Test 1: Monthly leaderboard without month_year (should default to current month)
        console.log('1️⃣ MONTHLY LEADERBOARD - CURRENT MONTH (Default)');
        console.log('URL: GET /api/leaderboard?time_period=monthly&difficulty_level=1&region=global&limit=10');

        const response1 = await fetch(`${BASE_URL}/api/leaderboard?time_period=monthly&difficulty_level=1&region=global&limit=10`);
        const data1 = await response1.json();

        console.log('Status:', response1.status);
        console.log('Response metadata:');
        console.log(JSON.stringify(data1.metadata, null, 2));

        if (data1.data && data1.data.length > 0) {
            console.log('Sample player data (showing month_year field):');
            console.log(JSON.stringify(data1.data[0], null, 2));
        } else {
            console.log('No data available for current month');
        }

        // Test 2: Monthly leaderboard with specific month_year
        console.log('\n\n2️⃣ MONTHLY LEADERBOARD - SPECIFIC MONTH (2024-12)');
        console.log('URL: GET /api/leaderboard?time_period=monthly&month_year=2024-12&difficulty_level=1&region=global&limit=10');

        const response2 = await fetch(`${BASE_URL}/api/leaderboard?time_period=monthly&month_year=2024-12&difficulty_level=1&region=global&limit=10`);
        const data2 = await response2.json();

        console.log('Status:', response2.status);
        console.log('Response metadata:');
        console.log(JSON.stringify(data2.metadata, null, 2));

        if (data2.data && data2.data.length > 0) {
            console.log('Sample player data (showing month_year field):');
            console.log(JSON.stringify(data2.data[0], null, 2));
        } else {
            console.log('No data available for December 2024');
        }

        // Test 3: Test with invalid month_year format
        console.log('\n\n3️⃣ INVALID MONTH_YEAR FORMAT TEST');
        console.log('URL: GET /api/leaderboard?time_period=monthly&month_year=2024-13&difficulty_level=1&region=global&limit=10');

        const response3 = await fetch(`${BASE_URL}/api/leaderboard?time_period=monthly&month_year=2024-13&difficulty_level=1&region=global&limit=10`);
        const data3 = await response3.json();

        console.log('Status:', response3.status);
        console.log('Response (should show validation error):');
        console.log(JSON.stringify(data3, null, 2));

        // Test 4: Test with another invalid format
        console.log('\n\n4️⃣ ANOTHER INVALID FORMAT TEST');
        console.log('URL: GET /api/leaderboard?time_period=monthly&month_year=24-01&difficulty_level=1&region=global&limit=10');

        const response4 = await fetch(`${BASE_URL}/api/leaderboard?time_period=monthly&month_year=24-01&difficulty_level=1&region=global&limit=10`);
        const data4 = await response4.json();

        console.log('Status:', response4.status);
        console.log('Response (should show validation error):');
        console.log(JSON.stringify(data4, null, 2));

        // Test 5: Redis-only endpoint with month_year
        console.log('\n\n5️⃣ REDIS-ONLY LEADERBOARD WITH MONTH_YEAR');
        console.log('URL: GET /api/leaderboard/redis?time_period=monthly&month_year=2024-12&difficulty_level=1&region=global&limit=10');

        const response5 = await fetch(`${BASE_URL}/api/leaderboard/redis?time_period=monthly&month_year=2024-12&difficulty_level=1&region=global&limit=10`);
        const data5 = await response5.json();

        console.log('Status:', response5.status);
        console.log('Response metadata:');
        console.log(JSON.stringify(data5.metadata, null, 2));

        // Test 6: All-time leaderboard (month_year should be null)
        console.log('\n\n6️⃣ ALL-TIME LEADERBOARD (month_year should be null)');
        console.log('URL: GET /api/leaderboard?time_period=allTime&difficulty_level=1&region=global&limit=10');

        const response6 = await fetch(`${BASE_URL}/api/leaderboard?time_period=allTime&difficulty_level=1&region=global&limit=10`);
        const data6 = await response6.json();

        console.log('Status:', response6.status);
        console.log('Response metadata:');
        console.log(JSON.stringify(data6.metadata, null, 2));

        // Test 7: Available months endpoint
        console.log('\n\n7️⃣ AVAILABLE MONTHS ENDPOINT');
        console.log('URL: GET /api/leaderboard/available-months');

        const response7 = await fetch(`${BASE_URL}/api/leaderboard/available-months`);
        const data7 = await response7.json();

        console.log('Status:', response7.status);
        console.log('Available months data:');
        console.log(JSON.stringify(data7, null, 2));

        // Summary
        console.log('\n\n📊 SUMMARY:');
        console.log('✅ Current month default:', response1.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Specific month (2024-12):', response2.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Invalid format validation (2024-13):', response3.status === 400 ? 'Working' : 'Failed');
        console.log('✅ Invalid format validation (24-01):', response4.status === 400 ? 'Working' : 'Failed');
        console.log('✅ Redis-only with month_year:', response5.status === 200 ? 'Working' : 'Failed');
        console.log('✅ All-time (no month_year):', response6.status === 200 ? 'Working' : 'Failed');
        console.log('✅ Available months endpoint:', response7.status === 200 ? 'Working' : 'Failed');

        console.log('\n🎯 Key things to verify:');
        console.log('- month_year field appears in player data for monthly leaderboards');
        console.log('- month_year field is null for all-time leaderboards');
        console.log('- Invalid month_year formats return 400 status with error message');
        console.log('- Both main and Redis endpoints handle month_year consistently');
        console.log('- Metadata includes month_year field');

    } catch (error) {
        console.error('❌ Error testing month_year leaderboard functionality:', error.message);
    }
}

// Run the test
testMonthYearLeaderboard(); 