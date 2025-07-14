#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = [];

// Test Users Data
const TEST_USERS = [
    {
        usertype: "Admin",
        username: "admin_test",
        email: "admin@test.com",
        password: "AdminTest123!",
        full_name: "Test Administrator",
        country: "US"
    },
    {
        usertype: "Customer",
        username: "customer1_test",
        email: "customer1@test.com",
        password: "Customer123!",
        full_name: "Customer One",
        country: "VN"
    },
    {
        usertype: "Customer",
        username: "customer2_test",
        email: "customer2@test.com",
        password: "Customer123!",
        full_name: "Customer Two",
        country: "US"
    },
    {
        usertype: "Customer",
        username: "customer3_test",
        email: "customer3@test.com",
        password: "Customer123!",
        full_name: "Customer Three",
        country: "JP"
    }
];

// Store user tokens
const USER_TOKENS = {};
const USER_IDS = {};

// Utility function to make HTTP requests
async function makeRequest(method, endpoint, data = null, token = null, testName = '') {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const responseData = await response.json();

        const result = {
            test: testName,
            method,
            endpoint,
            status: response.status,
            success: response.ok,
            data: responseData,
            timestamp: new Date().toISOString()
        };

        TEST_RESULTS.push(result);

        console.log(`${response.ok ? '✅' : '❌'} ${testName}: ${response.status} ${response.statusText}`);

        return { response, data: responseData, success: response.ok };
    } catch (error) {
        const result = {
            test: testName,
            method,
            endpoint,
            status: 'ERROR',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        TEST_RESULTS.push(result);
        console.log(`❌ ${testName}: ERROR - ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Phase 1: Authentication Tests
async function testAuthentication() {
    console.log('\n=== PHASE 1: AUTHENTICATION TESTS ===');

    // Test 1.1: Register all test users
    for (const user of TEST_USERS) {
        const result = await makeRequest('POST', '/api/auth/register', user, null, `Register ${user.username}`);
        if (result.success && result.data.user) {
            USER_IDS[user.username] = result.data.user.id;
        }
    }

    // Test 1.2: Login all test users
    for (const user of TEST_USERS) {
        const loginData = {
            username: user.username,
            password: user.password
        };
        const result = await makeRequest('POST', '/api/auth/login', loginData, null, `Login ${user.username}`);
        if (result.success && result.data.token) {
            USER_TOKENS[user.username] = result.data.token;
        }
    }
}

// Phase 2: User Management Tests
async function testUserManagement() {
    console.log('\n=== PHASE 2: USER MANAGEMENT TESTS ===');

    // Test 2.1: Get all users
    await makeRequest('GET', '/api/user/getalluser', null, null, 'Get All Users');

    // Test 2.2: Get all customers
    await makeRequest('GET', '/api/user/getallcustomer', null, null, 'Get All Customers');

    // Test 2.3: Get user by ID
    if (USER_IDS['customer1_test']) {
        await makeRequest('GET', `/api/user/${USER_IDS['customer1_test']}`, null, null, 'Get User by ID');
    }

    // Test 2.4: Update user profile
    if (USER_TOKENS['customer1_test'] && USER_IDS['customer1_test']) {
        const updateData = {
            full_name: "Customer One Updated",
            email: "customer1_updated@test.com"
        };
        await makeRequest('PUT', `/api/user/update/${USER_IDS['customer1_test']}`, updateData, USER_TOKENS['customer1_test'], 'Update User Profile');
    }
}

// Phase 3: Game System Tests
async function testGameSystem() {
    console.log('\n=== PHASE 3: GAME SYSTEM TESTS ===');

    let adminGameId = null;
    let customerGameId = null;

    // Test 3.1: Admin creates game session
    if (USER_TOKENS['admin_test']) {
        const gameData = {
            difficulty_level: 1,
            number_of_rounds: 5,
            admin_instructions: "Complete this beginner-level math game"
        };
        const result = await makeRequest('POST', '/api/game/start', gameData, USER_TOKENS['admin_test'], 'Admin Create Game');
        if (result.success && result.data.game_session) {
            adminGameId = result.data.game_session.id;
        }
    }

    // Test 3.2: Customer creates instant game
    if (USER_TOKENS['customer1_test']) {
        const instantGameData = {
            difficulty_level: 2,
            number_of_rounds: 3
        };
        const result = await makeRequest('POST', '/api/game/create-instant', instantGameData, USER_TOKENS['customer1_test'], 'Create Instant Game');
        if (result.success && result.data.game_session) {
            customerGameId = result.data.game_session.id;
        }
    }

    // Test 3.3: Get available games
    await makeRequest('GET', '/api/game/available', null, null, 'Get Available Games');

    // Test 3.4: Customer joins admin game
    if (adminGameId && USER_TOKENS['customer2_test']) {
        const joinData = { game_session_id: adminGameId };
        await makeRequest('POST', '/api/game/join', joinData, USER_TOKENS['customer2_test'], 'Join Admin Game');
    }

    // Test 3.5: Get game session details
    if (customerGameId) {
        await makeRequest('GET', `/api/game/${customerGameId}`, null, USER_TOKENS['customer1_test'], 'Get Game Session');
    }

    // Test 3.6: Complete game
    if (customerGameId && USER_TOKENS['customer1_test']) {
        const completeGameData = {
            game_session_id: customerGameId,
            total_time: 45.2,
            rounds: [
                { user_symbol: ">", response_time: 2.1 },
                { user_symbol: "<", response_time: 3.5 },
                { user_symbol: "=", response_time: 2.8 }
            ]
        };
        await makeRequest('POST', '/api/game/complete', completeGameData, USER_TOKENS['customer1_test'], 'Complete Game');
    }

    // Test 3.7: Get game history
    if (USER_TOKENS['customer1_test']) {
        await makeRequest('GET', '/api/game/history', null, USER_TOKENS['customer1_test'], 'Get Game History');
    }

    // Test 3.8: Get game stats summary
    if (USER_TOKENS['customer1_test']) {
        await makeRequest('GET', '/api/game/stats/summary', null, USER_TOKENS['customer1_test'], 'Get Game Stats Summary');
    }

    return { adminGameId, customerGameId };
}

// Phase 4: Social Features Tests
async function testSocialFeatures() {
    console.log('\n=== PHASE 4: SOCIAL FEATURES TESTS ===');

    // Test 4.1: Follow user
    if (USER_TOKENS['customer1_test'] && USER_IDS['customer2_test']) {
        await makeRequest('POST', `/api/users/${USER_IDS['customer2_test']}/follow`, null, USER_TOKENS['customer1_test'], 'Follow User');
    }

    // Test 4.2: Get user stats
    if (USER_IDS['customer1_test']) {
        await makeRequest('GET', `/api/users/${USER_IDS['customer1_test']}/stats`, null, null, 'Get User Stats');
    }

    // Test 4.3: Get user followers
    if (USER_IDS['customer2_test']) {
        await makeRequest('GET', `/api/users/${USER_IDS['customer2_test']}/followers`, null, null, 'Get User Followers');
    }

    // Test 4.4: Get user following
    if (USER_IDS['customer1_test']) {
        await makeRequest('GET', `/api/users/${USER_IDS['customer1_test']}/following`, null, null, 'Get User Following');
    }

    // Test 4.5: Unfollow user
    if (USER_TOKENS['customer1_test'] && USER_IDS['customer2_test']) {
        await makeRequest('DELETE', `/api/users/${USER_IDS['customer2_test']}/unfollow`, null, USER_TOKENS['customer1_test'], 'Unfollow User');
    }
}

// Phase 5: Comments System Tests
async function testCommentsSystem(gameSessionId) {
    console.log('\n=== PHASE 5: COMMENTS SYSTEM TESTS ===');

    let commentId = null;

    if (!gameSessionId) {
        console.log('⚠️ No game session available for comment testing');
        return;
    }

    // Test 5.1: Create comment
    if (USER_TOKENS['customer1_test']) {
        const commentData = {
            content: "Great game session! Really challenging but fair."
        };
        const result = await makeRequest('POST', `/api/game/sessions/${gameSessionId}/comments`, commentData, USER_TOKENS['customer1_test'], 'Create Comment');
        if (result.success && result.data.comment) {
            commentId = result.data.comment.id;
        }
    }

    // Test 5.2: Get comments
    await makeRequest('GET', `/api/game/sessions/${gameSessionId}/comments`, null, null, 'Get Comments');

    // Test 5.3: Update comment
    if (commentId && USER_TOKENS['customer1_test']) {
        const updateData = {
            content: "Updated: Excellent game session with great difficulty progression!"
        };
        await makeRequest('PUT', `/api/game/sessions/${gameSessionId}/comments/${commentId}`, updateData, USER_TOKENS['customer1_test'], 'Update Comment');
    }

    // Test 5.4: Like game session
    if (USER_TOKENS['customer2_test']) {
        await makeRequest('POST', `/api/game/sessions/${gameSessionId}/like`, null, USER_TOKENS['customer2_test'], 'Like Game Session');
    }

    // Test 5.5: Get session likes
    await makeRequest('GET', `/api/game/sessions/${gameSessionId}/likes`, null, null, 'Get Session Likes');

    // Test 5.6: Unlike game session
    if (USER_TOKENS['customer2_test']) {
        await makeRequest('DELETE', `/api/game/sessions/${gameSessionId}/unlike`, null, USER_TOKENS['customer2_test'], 'Unlike Game Session');
    }

    // Test 5.7: Delete comment
    if (commentId && USER_TOKENS['customer1_test']) {
        await makeRequest('DELETE', `/api/game/sessions/${gameSessionId}/comments/${commentId}`, null, USER_TOKENS['customer1_test'], 'Delete Comment');
    }
}

// Phase 6: Leaderboard Tests
async function testLeaderboard() {
    console.log('\n=== PHASE 6: LEADERBOARD TESTS ===');

    // Test 6.1: Global leaderboard
    await makeRequest('GET', '/api/leaderboard?difficulty_level=1&region=global&time_period=alltime&limit=50', null, null, 'Global Leaderboard');

    // Test 6.2: Regional leaderboard - Asia
    await makeRequest('GET', '/api/leaderboard?difficulty_level=2&region=asia&time_period=monthly&limit=25', null, null, 'Asia Regional Leaderboard');

    // Test 6.3: Regional leaderboard - America
    await makeRequest('GET', '/api/leaderboard?difficulty_level=1&region=america&time_period=alltime&limit=10', null, null, 'America Regional Leaderboard');

    // Test 6.4: Monthly leaderboard
    await makeRequest('GET', '/api/leaderboard?difficulty_level=3&region=global&time_period=monthly&limit=20', null, null, 'Monthly Global Leaderboard');
}

// Phase 7: Admin Functions Tests
async function testAdminFunctions() {
    console.log('\n=== PHASE 7: ADMIN FUNCTIONS TESTS ===');

    if (!USER_TOKENS['admin_test']) {
        console.log('⚠️ No admin token available for admin testing');
        return;
    }

    // Test 7.1: Get customer count
    await makeRequest('GET', '/api/admin/customers/count', null, USER_TOKENS['admin_test'], 'Get Customer Count');

    // Test 7.2: Create sample games
    const sampleGamesData = {
        count: 3,
        difficulty_level: 1
    };
    await makeRequest('POST', '/api/admin/create-sample-games', sampleGamesData, USER_TOKENS['admin_test'], 'Create Sample Games');

    // Test 7.3: Update user levels
    await makeRequest('POST', '/api/admin/users/update-levels', {}, USER_TOKENS['admin_test'], 'Update User Levels');
}

// Main test execution function
async function runAllTests() {
    console.log('🚀 Starting Comprehensive Backend Testing...\n');

    try {
        // Phase 1: Authentication
        await testAuthentication();

        // Phase 2: User Management
        await testUserManagement();

        // Phase 3: Game System
        const gameResults = await testGameSystem();

        // Phase 4: Social Features
        await testSocialFeatures();

        // Phase 5: Comments System
        await testCommentsSystem(gameResults.customerGameId || gameResults.adminGameId);

        // Phase 6: Leaderboard
        await testLeaderboard();

        // Phase 7: Admin Functions
        await testAdminFunctions();

        // Generate test report
        generateTestReport();

    } catch (error) {
        console.error('❌ Test execution failed:', error);
    }
}

// Generate comprehensive test report
function generateTestReport() {
    console.log('\n=== TEST EXECUTION COMPLETE ===\n');

    const successfulTests = TEST_RESULTS.filter(r => r.success);
    const failedTests = TEST_RESULTS.filter(r => !r.success);

    console.log(`✅ Successful Tests: ${successfulTests.length}`);
    console.log(`❌ Failed Tests: ${failedTests.length}`);
    console.log(`📊 Total Tests: ${TEST_RESULTS.length}`);
    console.log(`📈 Success Rate: ${((successfulTests.length / TEST_RESULTS.length) * 100).toFixed(2)}%\n`);

    if (failedTests.length > 0) {
        console.log('❌ FAILED TESTS:');
        failedTests.forEach(test => {
            console.log(`   - ${test.test}: ${test.status} ${test.error || ''}`);
        });
        console.log('');
    }

    // Write detailed results to file
    const reportData = {
        summary: {
            total_tests: TEST_RESULTS.length,
            successful_tests: successfulTests.length,
            failed_tests: failedTests.length,
            success_rate: ((successfulTests.length / TEST_RESULTS.length) * 100).toFixed(2),
            execution_time: new Date().toISOString()
        },
        user_tokens: Object.keys(USER_TOKENS),
        user_ids: USER_IDS,
        detailed_results: TEST_RESULTS
    };

    fs.writeFileSync('test-results.json', JSON.stringify(reportData, null, 2));
    console.log('📄 Detailed test results saved to test-results.json');

    // Update testAll.md with results
    updateTestDocumentation(reportData);
}

// Update the testAll.md file with actual results
function updateTestDocumentation(reportData) {
    let docContent = fs.readFileSync('testAll.md', 'utf8');

    // Update the test execution results section
    const successSection = reportData.detailed_results
        .filter(r => r.success)
        .map(r => `- [x] ${r.test}`)
        .join('\n');

    const failedSection = reportData.detailed_results
        .filter(r => !r.success)
        .map(r => `- [ ] ${r.test} (Status: ${r.status})`)
        .join('\n');

    // Replace the results sections
    docContent = docContent.replace(
        /### ✅ Successful Tests[\s\S]*?### ❌ Failed Tests/,
        `### ✅ Successful Tests\n${successSection}\n\n### ❌ Failed Tests`
    );

    docContent = docContent.replace(
        /### ❌ Failed Tests[\s\S]*?### ⚠️ Issues Found/,
        `### ❌ Failed Tests\n${failedSection}\n\n### ⚠️ Issues Found`
    );

    // Update status and timestamp
    docContent = docContent.replace(
        /\*\*Status:\*\* In Progress/,
        `**Status:** Completed (${reportData.summary.success_rate}% success rate)`
    );

    docContent = docContent.replace(
        /\*\*Last Updated:\*\* \[Current Date\]/,
        `**Last Updated:** ${new Date().toISOString()}`
    );

    fs.writeFileSync('testAll.md', docContent);
    console.log('📝 testAll.md updated with test results');
}

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}

export { runAllTests, TEST_USERS, USER_TOKENS, USER_IDS }; 