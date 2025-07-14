import http from 'http';

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = [];

// Store tokens and IDs
const TOKENS = {};
const USER_IDS = {};

// Simple HTTP request function
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        data: parsedData,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: responseData,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Login existing users
async function loginUsers() {
    console.log('\n=== LOGGING IN USERS ===');

    const users = [
        { key: 'admin', username: 'admin_test', password: 'AdminTest123!' },
        { key: 'customer1', username: 'customer1_test', password: 'Customer123!' },
        { key: 'customer2', username: 'customer2_test', password: 'Customer123!' }
    ];

    for (const user of users) {
        try {
            const result = await makeRequest('POST', '/api/auth/login', {
                username: user.username,
                password: user.password
            });

            if (result.success) {
                TOKENS[user.key] = result.data.token;
                USER_IDS[user.key] = result.data.user.id;
                console.log(`✅ ${user.username} logged in successfully`);
            } else {
                console.log(`❌ ${user.username} login failed: ${result.status}`);
            }
        } catch (error) {
            console.log(`❌ ${user.username} login error: ${error.message}`);
        }
    }
}

// Test Game Creation APIs
async function testGameCreation() {
    console.log('\n=== TESTING GAME CREATION ===');

    let adminGameId = null;
    let customerGameId = null;

    // Test 1: Admin Create Game
    if (TOKENS.admin) {
        try {
            console.log('\n🔄 Testing Admin Create Game...');
            const gameData = {
                difficulty_level: 1,
                number_of_rounds: 5,
                admin_instructions: "Complete this beginner-level math game"
            };

            const result = await makeRequest('POST', '/api/game/start', gameData, TOKENS.admin);

            if (result.success) {
                adminGameId = result.data.game_session?.id;
                console.log('✅ Admin Create Game successful');
                console.log(`   Game ID: ${adminGameId}`);
                console.log(`   Rounds: ${result.data.game_session?.number_of_rounds}`);
                console.log(`   Difficulty: ${result.data.game_session?.difficulty_level}`);
                console.log(`   Admin: ${result.data.admin?.username}`);
            } else {
                console.log(`❌ Admin Create Game failed: ${result.status}`);
                console.log(`   Error: ${result.data.message || 'Unknown error'}`);
            }

            TEST_RESULTS.push({
                test: 'Admin Create Game',
                status: result.status,
                success: result.success,
                gameId: adminGameId
            });
        } catch (error) {
            console.log(`❌ Admin Create Game error: ${error.message}`);
        }
    }

    // Test 2: Customer Create Instant Game
    if (TOKENS.customer1) {
        try {
            console.log('\n🔄 Testing Customer Create Instant Game...');
            const instantGameData = {
                difficulty_level: 2,
                number_of_rounds: 3
            };

            const result = await makeRequest('POST', '/api/game/create-instant', instantGameData, TOKENS.customer1);

            if (result.success) {
                customerGameId = result.data.game_session?.id;
                console.log('✅ Customer Create Instant Game successful');
                console.log(`   Game ID: ${customerGameId}`);
                console.log(`   Rounds: ${result.data.game_session?.number_of_rounds}`);
                console.log(`   Difficulty: ${result.data.game_session?.difficulty_level}`);
                console.log(`   Status: ${result.data.game_session?.status}`);

                // Show rounds for completion reference
                if (result.data.rounds && result.data.rounds.length > 0) {
                    console.log('   Generated rounds for completion:');
                    result.data.rounds.forEach(round => {
                        console.log(`     Round ${round.round_number}: ${round.first_number} ? ${round.second_number}`);
                    });
                }
            } else {
                console.log(`❌ Customer Create Instant Game failed: ${result.status}`);
                console.log(`   Error: ${result.data.message || 'Unknown error'}`);
            }

            TEST_RESULTS.push({
                test: 'Customer Create Instant Game',
                status: result.status,
                success: result.success,
                gameId: customerGameId
            });
        } catch (error) {
            console.log(`❌ Customer Create Instant Game error: ${error.message}`);
        }
    }

    return { adminGameId, customerGameId };
}

// Test Game Completion API
async function testGameCompletion(gameIds) {
    console.log('\n=== TESTING GAME COMPLETION ===');

    // Test 1: Complete existing game session
    if (gameIds.customerGameId && TOKENS.customer1) {
        try {
            console.log(`\n🔄 Testing Complete Game (existing session)...`);
            console.log(`   Completing game ID: ${gameIds.customerGameId}`);

            const completeGameData = {
                game_session_id: gameIds.customerGameId,
                total_time: 45.2,
                rounds: [
                    { user_symbol: ">", response_time: 2.1 },
                    { user_symbol: "<", response_time: 3.5 },
                    { user_symbol: "=", response_time: 2.8 }
                ]
            };

            const result = await makeRequest('POST', '/api/game/complete', completeGameData, TOKENS.customer1);

            if (result.success) {
                console.log('✅ Complete Game (existing session) successful');
                console.log(`   Final Score: ${result.data.game_result?.scoring?.final_score}`);
                console.log(`   Correct Answers: ${result.data.game_result?.performance?.correct_answers}`);
                console.log(`   Accuracy: ${result.data.game_result?.performance?.accuracy}%`);
                console.log(`   Total Time: ${result.data.game_result?.performance?.total_time}s`);
                console.log(`   Level Before: ${result.data.game_result?.player?.level_before}`);
                console.log(`   Level After: ${result.data.game_result?.player?.level_after}`);
                console.log(`   Level Up: ${result.data.game_result?.player?.level_up}`);
                console.log(`   Coins Earned: ${result.data.game_result?.scoring?.coins_earned}`);
            } else {
                console.log(`❌ Complete Game (existing session) failed: ${result.status}`);
                console.log(`   Error: ${result.data.message || 'Unknown error'}`);
            }

            TEST_RESULTS.push({
                test: 'Complete Game (Existing Session)',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Complete Game (existing session) error: ${error.message}`);
        }
    }

    // Test 2: Complete game with new session creation
    if (TOKENS.customer2) {
        try {
            console.log('\n🔄 Testing Complete Game (create new session)...');

            const completeNewGameData = {
                // No game_session_id = creates new session
                total_time: 38.7,
                difficulty_level: 1,
                rounds: [
                    { user_symbol: ">", response_time: 1.8 },
                    { user_symbol: "<", response_time: 2.2 },
                    { user_symbol: "=", response_time: 3.1 },
                    { user_symbol: ">", response_time: 2.5 },
                    { user_symbol: "<", response_time: 1.9 }
                ]
            };

            const result = await makeRequest('POST', '/api/game/complete', completeNewGameData, TOKENS.customer2);

            if (result.success) {
                console.log('✅ Complete Game (create new session) successful');
                console.log(`   Session Mode: ${result.data.session_info?.mode}`);
                console.log(`   Game ID: ${result.data.session_info?.game_id}`);
                console.log(`   Final Score: ${result.data.game_result?.scoring?.final_score}`);
                console.log(`   Correct Answers: ${result.data.game_result?.performance?.correct_answers}`);
                console.log(`   Accuracy: ${result.data.game_result?.performance?.accuracy}%`);
                console.log(`   Player: ${result.data.session_info?.completed_by}`);
                console.log(`   Level Changes: ${result.data.game_result?.player?.levels_gained} levels gained`);
            } else {
                console.log(`❌ Complete Game (create new session) failed: ${result.status}`);
                console.log(`   Error: ${result.data.message || 'Unknown error'}`);
            }

            TEST_RESULTS.push({
                test: 'Complete Game (New Session)',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Complete Game (create new session) error: ${error.message}`);
        }
    }
}

// Generate focused report
async function generateFocusedReport() {
    console.log('\n=== FOCUSED GAME TESTING REPORT ===');

    const successful = TEST_RESULTS.filter(t => t.success);
    const failed = TEST_RESULTS.filter(t => !t.success);

    console.log(`\n📊 GAME API TEST RESULTS:`);
    console.log(`   Total Game Tests: ${TEST_RESULTS.length}`);
    console.log(`   ✅ Successful: ${successful.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    console.log(`   📈 Success Rate: ${((successful.length / TEST_RESULTS.length) * 100).toFixed(1)}%`);

    console.log('\n🎮 GAME API STATUS:');
    TEST_RESULTS.forEach(test => {
        const status = test.success ? '✅' : '❌';
        console.log(`   ${status} ${test.test}: ${test.status}`);
    });

    console.log('\n📋 SUMMARY:');
    if (successful.length === TEST_RESULTS.length) {
        console.log('   🏆 ALL GAME APIs WORKING PERFECTLY!');
        console.log('   ✓ Admin can create game sessions');
        console.log('   ✓ Customers can create instant games');
        console.log('   ✓ Game completion works for existing sessions');
        console.log('   ✓ Game completion can create new sessions');
    } else {
        console.log(`   ⚠️ ${failed.length} out of ${TEST_RESULTS.length} game APIs have issues`);
        if (failed.length > 0) {
            console.log('   Failed APIs:');
            failed.forEach(test => {
                console.log(`     - ${test.test}: ${test.status}`);
            });
        }
    }

    return {
        total: TEST_RESULTS.length,
        successful: successful.length,
        failed: failed.length,
        success_rate: ((successful.length / TEST_RESULTS.length) * 100).toFixed(1)
    };
}

// Main execution
async function runFocusedGameTests() {
    console.log('🎮 Starting Focused Game API Testing...');
    console.log('🎯 Testing: Create Game & Complete Game APIs Only\n');

    try {
        await loginUsers();
        const gameIds = await testGameCreation();
        await testGameCompletion(gameIds);
        const summary = await generateFocusedReport();

        console.log('\n🎉 Focused Game API Testing Completed!');
        console.log(`🎯 Game API Success Rate: ${summary.success_rate}%`);

        if (parseFloat(summary.success_rate) === 100) {
            console.log('🏆 PERFECT: All game creation and completion APIs working flawlessly!');
        } else if (parseFloat(summary.success_rate) >= 75) {
            console.log('✅ GOOD: Game APIs mostly functional with minor issues');
        } else {
            console.log('⚠️ WARNING: Game APIs need attention');
        }

    } catch (error) {
        console.error('❌ Focused game testing failed:', error);
    }
}

runFocusedGameTests(); 