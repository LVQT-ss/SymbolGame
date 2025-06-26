import fetch from 'node-fetch';

async function testGameCompletionAPI() {
    try {
        console.log('🧪 Testing game completion API for user 1...');

        // Test data for completing a game
        const gameCompletionData = {
            total_time: 25.5,
            rounds: [
                { user_symbol: '>', response_time: 2.1 },
                { user_symbol: '<', response_time: 1.8 },
                { user_symbol: '=', response_time: 3.2 },
                { user_symbol: '>', response_time: 2.5 },
                { user_symbol: '<', response_time: 2.0 }
            ],
            difficulty_level: 1
        };

        console.log('📤 Sending game completion request...');
        console.log('Data:', JSON.stringify(gameCompletionData, null, 2));

        // You'll need to replace 'YOUR_AUTH_TOKEN' with a real token for user 1
        const response = await fetch('http://localhost:3000/api/game/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_AUTH_TOKEN_HERE' // ⚠️  You need to replace this
            },
            body: JSON.stringify(gameCompletionData)
        });

        console.log(`📥 Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Error: ${errorText}`);
            return;
        }

        const responseData = await response.json();
        console.log('✅ API Response:', JSON.stringify(responseData, null, 2));

        console.log('\n🔍 If this works, your UserStatistics should now be updated!');
        console.log('💡 If this fails, check:');
        console.log('   1. Server is running on localhost:3000');
        console.log('   2. Valid auth token for user 1');
        console.log('   3. API endpoint path is correct');

    } catch (error) {
        console.error('❌ Error testing API:', error.message);
        console.log('\n💡 Common issues:');
        console.log('   1. Server not running');
        console.log('   2. Wrong API URL');
        console.log('   3. Network connection issues');
    }
}

testGameCompletionAPI(); 