import http from 'http';

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = [];

// Store tokens and IDs from previous test
const TOKENS = {};
const USER_IDS = {};

// Updated test data with proper game completion format
const GAME_COMPLETION_DATA = {
    total_time: 45.2,
    rounds: [
        {
            first_number: 15,
            second_number: 8,
            user_symbol: ">",
            response_time: 2.1
        },
        {
            first_number: 5,
            second_number: 12,
            user_symbol: "<",
            response_time: 3.5
        },
        {
            first_number: 7,
            second_number: 7,
            user_symbol: "=",
            response_time: 2.8
        }
    ]
};

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

// Login existing users to get tokens
async function loginExistingUsers() {
    console.log('\n=== LOGGING IN EXISTING USERS ===');

    const users = [
        { key: 'admin', username: 'admin_test', password: 'AdminTest123!' },
        { key: 'customer1', username: 'customer1_test', password: 'Customer123!' },
        { key: 'customer2', username: 'customer2_test', password: 'Customer123!' },
        { key: 'customer3', username: 'customer3_test', password: 'Customer123!' }
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

// Test game system thoroughly
async function testCompleteGameFlow() {
    console.log('\n=== TESTING COMPLETE GAME FLOW ===');

    let gameId = null;

    // Test 1: Create instant game with proper data
    if (TOKENS.customer1) {
        try {
            console.log('\n🔄 Creating instant game...');
            const result = await makeRequest('POST', '/api/game/create-instant', {
                difficulty_level: 1,
                number_of_rounds: 3
            }, TOKENS.customer1);

            if (result.success) {
                gameId = result.data.game_session?.id;
                console.log(`✅ Game created with ID: ${gameId}`);
                console.log(`   Rounds provided: ${result.data.rounds?.length || 0}`);

                // Show the actual rounds for proper completion
                if (result.data.rounds) {
                    console.log('   Generated rounds:');
                    result.data.rounds.forEach((round, index) => {
                        console.log(`     Round ${round.round_number}: ${round.first_number} ? ${round.second_number}`);
                    });
                }
            }

            TEST_RESULTS.push({
                test: 'Create Instant Game for Completion',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Game creation error: ${error.message}`);
        }
    }

    // Test 2: Submit whole game (alternative method)
    if (TOKENS.customer2) {
        try {
            console.log('\n🔄 Testing submit whole game...');
            const result = await makeRequest('POST', '/api/game/submit-whole-game', {
                difficulty_level: 2,
                number_of_rounds: 3,
                total_time: 35.7,
                rounds: [
                    { user_symbol: ">", response_time: 2.1 },
                    { user_symbol: "<", response_time: 3.5 },
                    { user_symbol: "=", response_time: 2.8 }
                ]
            }, TOKENS.customer2);

            if (result.success) {
                console.log('✅ Submit whole game successful');
                console.log(`   Final Score: ${result.data.game_result?.scoring?.final_score}`);
                console.log(`   Accuracy: ${result.data.game_result?.performance?.accuracy}%`);
            } else {
                console.log(`❌ Submit whole game failed: ${result.status}`);
                console.log(`   Error: ${result.data.message || 'Unknown error'}`);
            }

            TEST_RESULTS.push({
                test: 'Submit Whole Game',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Submit whole game error: ${error.message}`);
        }
    }

    // Test 3: Get game history
    if (TOKENS.customer1) {
        try {
            console.log('\n🔄 Testing get game history...');
            const result = await makeRequest('GET', '/api/game/history?page=1&limit=10', null, TOKENS.customer1);

            if (result.success) {
                console.log('✅ Game history retrieved successfully');
                console.log(`   Games found: ${result.data.games?.length || 0}`);
                console.log(`   Total games: ${result.data.pagination?.total || 0}`);
            } else {
                console.log(`❌ Game history failed: ${result.status}`);
            }

            TEST_RESULTS.push({
                test: 'Get Game History',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Game history error: ${error.message}`);
        }
    }

    return gameId;
}

// Test user management
async function testUserManagement() {
    console.log('\n=== TESTING USER MANAGEMENT ===');

    // Test 1: Get all users
    try {
        console.log('\n🔄 Testing get all users...');
        const result = await makeRequest('GET', '/api/user/getalluser');

        if (result.success) {
            console.log('✅ Get all users successful');
            console.log(`   Users found: ${result.data?.length || 0}`);
        } else {
            console.log(`❌ Get all users failed: ${result.status}`);
        }

        TEST_RESULTS.push({
            test: 'Get All Users',
            status: result.status,
            success: result.success
        });
    } catch (error) {
        console.log(`❌ Get all users error: ${error.message}`);
    }

    // Test 2: Get all customers
    try {
        console.log('\n🔄 Testing get all customers...');
        const result = await makeRequest('GET', '/api/user/getallcustomer');

        if (result.success) {
            console.log('✅ Get all customers successful');
            console.log(`   Customers found: ${result.data?.length || 0}`);
        } else {
            console.log(`❌ Get all customers failed: ${result.status}`);
        }

        TEST_RESULTS.push({
            test: 'Get All Customers',
            status: result.status,
            success: result.success
        });
    } catch (error) {
        console.log(`❌ Get all customers error: ${error.message}`);
    }

    // Test 3: Update user profile
    if (TOKENS.customer1 && USER_IDS.customer1) {
        try {
            console.log('\n🔄 Testing update user profile...');
            const result = await makeRequest('PUT', `/api/user/update/${USER_IDS.customer1}`, {
                full_name: "Customer One Updated",
                email: "customer1_updated@test.com"
            }, TOKENS.customer1);

            if (result.success) {
                console.log('✅ Update user profile successful');
                console.log(`   Updated name: ${result.data.user?.full_name}`);
            } else {
                console.log(`❌ Update user profile failed: ${result.status}`);
                console.log(`   Error: ${result.data.message || 'Unknown error'}`);
            }

            TEST_RESULTS.push({
                test: 'Update User Profile',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Update user profile error: ${error.message}`);
        }
    }
}

// Test comments and likes system
async function testCommentsAndLikes(gameSessionId) {
    console.log('\n=== TESTING COMMENTS AND LIKES ===');

    if (!gameSessionId) {
        console.log('⚠️ No game session ID available for comments testing');
        return;
    }

    let commentId = null;

    // Test 1: Create comment
    if (TOKENS.customer1) {
        try {
            console.log('\n🔄 Testing create comment...');
            const result = await makeRequest('POST', `/api/game/sessions/${gameSessionId}/comments`, {
                content: "Great game session! Really enjoyed this challenge."
            }, TOKENS.customer1);

            if (result.success) {
                commentId = result.data.comment?.id;
                console.log('✅ Create comment successful');
                console.log(`   Comment ID: ${commentId}`);
            } else {
                console.log(`❌ Create comment failed: ${result.status}`);
                console.log(`   Error: ${result.data.message || 'Unknown error'}`);
            }

            TEST_RESULTS.push({
                test: 'Create Comment',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Create comment error: ${error.message}`);
        }
    }

    // Test 2: Get comments
    try {
        console.log('\n🔄 Testing get comments...');
        const result = await makeRequest('GET', `/api/game/sessions/${gameSessionId}/comments?page=1&limit=10`);

        if (result.success) {
            console.log('✅ Get comments successful');
            console.log(`   Comments found: ${result.data.comments?.length || 0}`);
        } else {
            console.log(`❌ Get comments failed: ${result.status}`);
        }

        TEST_RESULTS.push({
            test: 'Get Comments',
            status: result.status,
            success: result.success
        });
    } catch (error) {
        console.log(`❌ Get comments error: ${error.message}`);
    }

    // Test 3: Like session
    if (TOKENS.customer2) {
        try {
            console.log('\n🔄 Testing like session...');
            const result = await makeRequest('POST', `/api/game/sessions/${gameSessionId}/like`, null, TOKENS.customer2);

            if (result.success) {
                console.log('✅ Like session successful');
            } else {
                console.log(`❌ Like session failed: ${result.status}`);
                console.log(`   Error: ${result.data.message || 'Unknown error'}`);
            }

            TEST_RESULTS.push({
                test: 'Like Session',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Like session error: ${error.message}`);
        }
    }

    // Test 4: Get session likes
    try {
        console.log('\n🔄 Testing get session likes...');
        const result = await makeRequest('GET', `/api/game/sessions/${gameSessionId}/likes`);

        if (result.success) {
            console.log('✅ Get session likes successful');
            console.log(`   Total likes: ${result.data.total_likes || 0}`);
        } else {
            console.log(`❌ Get session likes failed: ${result.status}`);
        }

        TEST_RESULTS.push({
            test: 'Get Session Likes',
            status: result.status,
            success: result.success
        });
    } catch (error) {
        console.log(`❌ Get session likes error: ${error.message}`);
    }
}

// Test additional social features
async function testAdvancedSocialFeatures() {
    console.log('\n=== TESTING ADVANCED SOCIAL FEATURES ===');

    // Test 1: Get followers
    if (USER_IDS.customer2) {
        try {
            console.log('\n🔄 Testing get followers...');
            const result = await makeRequest('GET', `/api/users/${USER_IDS.customer2}/followers?page=1&limit=10`);

            if (result.success) {
                console.log('✅ Get followers successful');
                console.log(`   Followers: ${result.data.followers?.length || 0}`);
            } else {
                console.log(`❌ Get followers failed: ${result.status}`);
            }

            TEST_RESULTS.push({
                test: 'Get Followers',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Get followers error: ${error.message}`);
        }
    }

    // Test 2: Get following
    if (USER_IDS.customer1) {
        try {
            console.log('\n🔄 Testing get following...');
            const result = await makeRequest('GET', `/api/users/${USER_IDS.customer1}/following?page=1&limit=10`);

            if (result.success) {
                console.log('✅ Get following successful');
                console.log(`   Following: ${result.data.following?.length || 0}`);
            } else {
                console.log(`❌ Get following failed: ${result.status}`);
            }

            TEST_RESULTS.push({
                test: 'Get Following',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Get following error: ${error.message}`);
        }
    }

    // Test 3: Unfollow user
    if (TOKENS.customer1 && USER_IDS.customer2) {
        try {
            console.log('\n🔄 Testing unfollow user...');
            const result = await makeRequest('DELETE', `/api/users/${USER_IDS.customer2}/unfollow`, null, TOKENS.customer1);

            if (result.success) {
                console.log('✅ Unfollow user successful');
            } else {
                console.log(`❌ Unfollow user failed: ${result.status}`);
            }

            TEST_RESULTS.push({
                test: 'Unfollow User',
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ Unfollow user error: ${error.message}`);
        }
    }
}

// Test leaderboard variations
async function testLeaderboardVariations() {
    console.log('\n=== TESTING LEADERBOARD VARIATIONS ===');

    const tests = [
        { name: 'Global Easy All-time', params: '?difficulty_level=1&region=global&time_period=alltime&limit=10' },
        { name: 'Asia Medium Monthly', params: '?difficulty_level=2&region=asia&time_period=monthly&limit=5' },
        { name: 'America Hard All-time', params: '?difficulty_level=3&region=america&time_period=alltime&limit=15' },
        { name: 'Europe Easy Monthly', params: '?difficulty_level=1&region=europe&time_period=monthly&limit=20' }
    ];

    for (const test of tests) {
        try {
            console.log(`\n🔄 Testing ${test.name} leaderboard...`);
            const result = await makeRequest('GET', `/api/leaderboard${test.params}`);

            if (result.success) {
                console.log(`✅ ${test.name} leaderboard successful`);
                console.log(`   Players: ${result.data.data?.length || 0}`);
                console.log(`   Region: ${result.data.metadata?.region}`);
                console.log(`   Difficulty: ${result.data.metadata?.difficulty_level}`);
                console.log(`   Period: ${result.data.metadata?.time_period}`);
            } else {
                console.log(`❌ ${test.name} leaderboard failed: ${result.status}`);
            }

            TEST_RESULTS.push({
                test: `Leaderboard ${test.name}`,
                status: result.status,
                success: result.success
            });
        } catch (error) {
            console.log(`❌ ${test.name} leaderboard error: ${error.message}`);
        }
    }
}

// Generate comprehensive report
async function generateComprehensiveReport() {
    console.log('\n=== COMPREHENSIVE TEST REPORT ===');

    const successful = TEST_RESULTS.filter(t => t.success);
    const failed = TEST_RESULTS.filter(t => !t.success);

    console.log(`\n📊 FINAL STATISTICS:`);
    console.log(`   Total Tests: ${TEST_RESULTS.length}`);
    console.log(`   ✅ Successful: ${successful.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    console.log(`   📈 Success Rate: ${((successful.length / TEST_RESULTS.length) * 100).toFixed(1)}%`);

    if (successful.length > 0) {
        console.log('\n✅ SUCCESSFUL TESTS:');
        successful.forEach(test => {
            console.log(`   ✓ ${test.test}: ${test.status}`);
        });
    }

    if (failed.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        failed.forEach(test => {
            console.log(`   ✗ ${test.test}: ${test.status}`);
        });
    }

    // Create summary for documentation
    const summary = {
        total_tests: TEST_RESULTS.length,
        successful_tests: successful.length,
        failed_tests: failed.length,
        success_rate: ((successful.length / TEST_RESULTS.length) * 100).toFixed(1),
        test_categories: {
            authentication: TEST_RESULTS.filter(t => t.test.includes('Login')).length,
            user_management: TEST_RESULTS.filter(t => t.test.includes('User') || t.test.includes('Customer')).length,
            game_system: TEST_RESULTS.filter(t => t.test.includes('Game') || t.test.includes('Complete')).length,
            social_features: TEST_RESULTS.filter(t => t.test.includes('Follow') || t.test.includes('Stats')).length,
            comments_likes: TEST_RESULTS.filter(t => t.test.includes('Comment') || t.test.includes('Like')).length,
            leaderboard: TEST_RESULTS.filter(t => t.test.includes('Leaderboard')).length
        },
        execution_time: new Date().toISOString()
    };

    console.log('\n📋 TEST CATEGORIES BREAKDOWN:');
    Object.entries(summary.test_categories).forEach(([category, count]) => {
        console.log(`   ${category.replace(/_/g, ' ').toUpperCase()}: ${count} tests`);
    });

    return summary;
}

// Main execution
async function runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive Symbol Mobile App Backend Testing...');
    console.log('🔧 This will test all available functionality except payment systems and battles');

    try {
        await loginExistingUsers();
        await testUserManagement();
        const gameId = await testCompleteGameFlow();
        await testCommentsAndLikes(gameId);
        await testAdvancedSocialFeatures();
        await testLeaderboardVariations();

        const summary = await generateComprehensiveReport();

        console.log('\n🎉 Comprehensive testing completed!');
        console.log(`📊 Overall Success Rate: ${summary.success_rate}%`);

        if (parseFloat(summary.success_rate) >= 85) {
            console.log('🏆 EXCELLENT: Backend is functioning very well!');
        } else if (parseFloat(summary.success_rate) >= 70) {
            console.log('✅ GOOD: Backend is functioning well with minor issues');
        } else {
            console.log('⚠️ WARNING: Backend has significant issues that need attention');
        }

    } catch (error) {
        console.error('❌ Comprehensive testing failed:', error);
    }
}

runComprehensiveTests(); 