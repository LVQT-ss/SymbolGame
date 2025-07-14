import http from 'http';
import https from 'https';

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = [];

// Test Users
const USERS = {
    admin: {
        usertype: "Admin",
        username: "admin_test",
        email: "admin@test.com",
        password: "AdminTest123!",
        full_name: "Test Administrator",
        country: "US"
    },
    customer1: {
        usertype: "Customer",
        username: "customer1_test",
        email: "customer1@test.com",
        password: "Customer123!",
        full_name: "Customer One",
        country: "VN"
    },
    customer2: {
        usertype: "Customer",
        username: "customer2_test",
        email: "customer2@test.com",
        password: "Customer123!",
        full_name: "Customer Two",
        country: "US"
    },
    customer3: {
        usertype: "Customer",
        username: "customer3_test",
        email: "customer3@test.com",
        password: "Customer123!",
        full_name: "Customer Three",
        country: "JP"
    }
};

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

// Test functions
async function testUserRegistration() {
    console.log('\n=== TESTING USER REGISTRATION ===');

    for (const [key, user] of Object.entries(USERS)) {
        try {
            console.log(`\n🔄 Registering ${user.username}...`);
            const result = await makeRequest('POST', '/api/auth/register', user);

            if (result.success) {
                console.log(`✅ ${user.username} registered successfully`);
                console.log(`   User ID: ${result.data.user?.id}`);
                console.log(`   Level: ${result.data.user?.current_level}`);
                console.log(`   Coins: ${result.data.user?.coins}`);
                USER_IDS[key] = result.data.user?.id;
            } else {
                console.log(`❌ ${user.username} registration failed: ${result.status}`);
                console.log(`   Error: ${result.data.message || 'Unknown error'}`);
            }

            TEST_RESULTS.push({
                test: `Register ${user.username}`,
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ ${user.username} registration error: ${error.message}`);
        }
    }
}

async function testUserLogin() {
    console.log('\n=== TESTING USER LOGIN ===');

    for (const [key, user] of Object.entries(USERS)) {
        try {
            console.log(`\n🔄 Logging in ${user.username}...`);
            const loginData = {
                username: user.username,
                password: user.password
            };

            const result = await makeRequest('POST', '/api/auth/login', loginData);

            if (result.success) {
                console.log(`✅ ${user.username} logged in successfully`);
                console.log(`   Token: ${result.data.token?.substring(0, 20)}...`);
                TOKENS[key] = result.data.token;
            } else {
                console.log(`❌ ${user.username} login failed: ${result.status}`);
                console.log(`   Error: ${result.data.message || 'Unknown error'}`);
            }

            TEST_RESULTS.push({
                test: `Login ${user.username}`,
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ ${user.username} login error: ${error.message}`);
        }
    }
}

async function testGameCreation() {
    console.log('\n=== TESTING GAME CREATION ===');

    // Test admin game creation
    if (TOKENS.admin) {
        try {
            console.log('\n🔄 Admin creating game session...');
            const gameData = {
                difficulty_level: 1,
                number_of_rounds: 5,
                admin_instructions: "Complete this beginner-level math game"
            };

            const result = await makeRequest('POST', '/api/game/start', gameData, TOKENS.admin);

            if (result.success) {
                console.log('✅ Admin game created successfully');
                console.log(`   Game ID: ${result.data.game_session?.id}`);
                console.log(`   Rounds: ${result.data.game_session?.number_of_rounds}`);
                console.log(`   Difficulty: ${result.data.game_session?.difficulty_level}`);
            } else {
                console.log(`❌ Admin game creation failed: ${result.status}`);
                console.log(`   Error: ${result.data.message || 'Unknown error'}`);
            }

            TEST_RESULTS.push({
                test: 'Admin Create Game',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Admin game creation error: ${error.message}`);
        }
    }

    // Test customer instant game creation
    if (TOKENS.customer1) {
        try {
            console.log('\n🔄 Customer creating instant game...');
            const instantGameData = {
                difficulty_level: 2,
                number_of_rounds: 3
            };

            const result = await makeRequest('POST', '/api/game/create-instant', instantGameData, TOKENS.customer1);

            if (result.success) {
                console.log('✅ Customer instant game created successfully');
                console.log(`   Game ID: ${result.data.game_session?.id}`);
                console.log(`   Rounds: ${result.data.game_session?.number_of_rounds}`);
                console.log(`   Status: ${result.data.game_session?.status}`);
                return result.data.game_session?.id;
            } else {
                console.log(`❌ Customer instant game creation failed: ${result.status}`);
                console.log(`   Error: ${result.data.message || 'Unknown error'}`);
            }

            TEST_RESULTS.push({
                test: 'Customer Create Instant Game',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Customer instant game creation error: ${error.message}`);
        }
    }

    return null;
}

async function testGameCompletion(gameId) {
    if (!gameId || !TOKENS.customer1) {
        console.log('\n⚠️ Skipping game completion test - no game ID or token');
        return;
    }

    console.log('\n=== TESTING GAME COMPLETION ===');

    try {
        console.log(`\n🔄 Completing game ${gameId}...`);
        const completeGameData = {
            game_session_id: gameId,
            total_time: 45.2,
            rounds: [
                { user_symbol: ">", response_time: 2.1 },
                { user_symbol: "<", response_time: 3.5 },
                { user_symbol: "=", response_time: 2.8 }
            ]
        };

        const result = await makeRequest('POST', '/api/game/complete', completeGameData, TOKENS.customer1);

        if (result.success) {
            console.log('✅ Game completed successfully');
            console.log(`   Final Score: ${result.data.game_result?.scoring?.final_score}`);
            console.log(`   Correct Answers: ${result.data.game_result?.performance?.correct_answers}`);
            console.log(`   Accuracy: ${result.data.game_result?.performance?.accuracy}%`);
            console.log(`   Level After: ${result.data.game_result?.player?.level_after}`);
        } else {
            console.log(`❌ Game completion failed: ${result.status}`);
            console.log(`   Error: ${result.data.message || 'Unknown error'}`);
        }

        TEST_RESULTS.push({
            test: 'Complete Game',
            status: result.status,
            success: result.success
        });
    } catch (error) {
        console.log(`❌ Game completion error: ${error.message}`);
    }
}

async function testSocialFeatures() {
    console.log('\n=== TESTING SOCIAL FEATURES ===');

    if (TOKENS.customer1 && USER_IDS.customer2) {
        try {
            // Test follow
            console.log('\n🔄 Testing follow feature...');
            const followResult = await makeRequest('POST', `/api/users/${USER_IDS.customer2}/follow`, null, TOKENS.customer1);

            if (followResult.success) {
                console.log('✅ Follow successful');
            } else {
                console.log(`❌ Follow failed: ${followResult.status} - ${followResult.data.message}`);
            }

            TEST_RESULTS.push({
                test: 'Follow User',
                status: followResult.status,
                success: followResult.success
            });

            // Test get user stats
            console.log('\n🔄 Testing get user stats...');
            const statsResult = await makeRequest('GET', `/api/users/${USER_IDS.customer2}/stats`);

            if (statsResult.success) {
                console.log('✅ Get user stats successful');
                console.log(`   Username: ${statsResult.data.user?.username}`);
                console.log(`   Level: ${statsResult.data.user?.current_level}`);
                console.log(`   Followers: ${statsResult.data.user?.followers_count}`);
            } else {
                console.log(`❌ Get user stats failed: ${statsResult.status}`);
            }

            TEST_RESULTS.push({
                test: 'Get User Stats',
                status: statsResult.status,
                success: statsResult.success
            });
        } catch (error) {
            console.log(`❌ Social features error: ${error.message}`);
        }
    }
}

async function testLeaderboard() {
    console.log('\n=== TESTING LEADERBOARD ===');

    try {
        console.log('\n🔄 Testing global leaderboard...');
        const result = await makeRequest('GET', '/api/leaderboard?difficulty_level=1&region=global&time_period=alltime&limit=10');

        if (result.success) {
            console.log('✅ Global leaderboard retrieved successfully');
            console.log(`   Players returned: ${result.data.data?.length || 0}`);
            console.log(`   Region: ${result.data.metadata?.region}`);
            console.log(`   Difficulty: ${result.data.metadata?.difficulty_level}`);
        } else {
            console.log(`❌ Leaderboard failed: ${result.status}`);
            console.log(`   Error: ${result.data.message || 'Unknown error'}`);
        }

        TEST_RESULTS.push({
            test: 'Get Leaderboard',
            status: result.status,
            success: result.success
        });
    } catch (error) {
        console.log(`❌ Leaderboard error: ${error.message}`);
    }
}

async function testAdminFunctions() {
    console.log('\n=== TESTING ADMIN FUNCTIONS ===');

    if (!TOKENS.admin) {
        console.log('⚠️ No admin token available');
        return;
    }

    try {
        console.log('\n🔄 Testing get customer count...');
        const result = await makeRequest('GET', '/api/admin/customers/count', null, TOKENS.admin);

        if (result.success) {
            console.log('✅ Customer count retrieved successfully');
            console.log(`   Active customers: ${result.data.active_customers}`);
            console.log(`   Total customers: ${result.data.total_customers}`);
        } else {
            console.log(`❌ Customer count failed: ${result.status}`);
            console.log(`   Error: ${result.data.message || 'Unknown error'}`);
        }

        TEST_RESULTS.push({
            test: 'Get Customer Count',
            status: result.status,
            success: result.success
        });
    } catch (error) {
        console.log(`❌ Admin functions error: ${error.message}`);
    }
}

async function generateReport() {
    console.log('\n=== TEST EXECUTION SUMMARY ===');

    const successful = TEST_RESULTS.filter(t => t.success);
    const failed = TEST_RESULTS.filter(t => !t.success);

    console.log(`\n📊 Total Tests: ${TEST_RESULTS.length}`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📈 Success Rate: ${((successful.length / TEST_RESULTS.length) * 100).toFixed(1)}%`);

    if (failed.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        failed.forEach(test => {
            console.log(`   - ${test.test}: ${test.status}`);
        });
    }

    if (successful.length > 0) {
        console.log('\n✅ SUCCESSFUL TESTS:');
        successful.forEach(test => {
            console.log(`   - ${test.test}: ${test.status}`);
        });
    }
}

// Main execution
async function runTests() {
    console.log('🚀 Starting Symbol Mobile App Backend Testing...');

    try {
        await testUserRegistration();
        await testUserLogin();
        const gameId = await testGameCreation();
        await testGameCompletion(gameId);
        await testSocialFeatures();
        await testLeaderboard();
        await testAdminFunctions();
        await generateReport();

        console.log('\n🎉 Testing completed!');
    } catch (error) {
        console.error('❌ Testing failed:', error);
    }
}

runTests(); 