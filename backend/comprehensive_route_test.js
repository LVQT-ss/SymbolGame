import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
let adminToken = null;
let userToken = null;

// Test results tracker
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    routes: []
};

function logTest(route, method, status, message) {
    testResults.total++;
    const success = status === 'PASS';
    if (success) testResults.passed++;
    else testResults.failed++;

    testResults.routes.push({
        route: `${method} ${route}`,
        status,
        message
    });

    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${method} ${route} - ${message}`);
}

async function setupAuth() {
    console.log('\n🔐 === SETTING UP AUTHENTICATION ===');

    try {
        // Create admin if not exists
        try {
            await axios.post(`${BASE_URL}/auth/register`, {
                username: 'testadmin',
                usertype: 'Admin',
                email: 'testadmin@test.com',
                password: 'Admin123456',
                full_name: 'Test Admin'
            });
        } catch (error) {
            // Admin may already exist
        }

        // Login admin
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'testadmin',
            password: 'Admin123456'
        });
        adminToken = adminLogin.data.token;
        logTest('/auth/login', 'POST', 'PASS', 'Admin login successful');

        // Create regular user if not exists
        try {
            await axios.post(`${BASE_URL}/auth/register`, {
                username: 'testuser',
                usertype: 'Customer',
                email: 'testuser@test.com',
                password: 'User123456',
                full_name: 'Test User'
            });
        } catch (error) {
            // User may already exist
        }

        // Login user
        const userLogin = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'testuser',
            password: 'User123456'
        });
        userToken = userLogin.data.token;
        logTest('/auth/login', 'POST', 'PASS', 'User login successful');

    } catch (error) {
        logTest('/auth/setup', 'POST', 'FAIL', `Auth setup failed: ${error.message}`);
        throw error;
    }
}

async function testHealthCheck() {
    console.log('\n🏥 === HEALTH CHECK ===');

    try {
        const response = await axios.get(`${BASE_URL}/health`);
        logTest('/health', 'GET', 'PASS', `Server running: ${response.data.message}`);
    } catch (error) {
        logTest('/health', 'GET', 'FAIL', `Health check failed: ${error.message}`);
    }
}

async function testAuthRoutes() {
    console.log('\n🔑 === AUTHENTICATION ROUTES ===');

    // Test register
    try {
        await axios.post(`${BASE_URL}/auth/register`, {
            username: `testuser${Date.now()}`,
            usertype: 'Customer',
            email: `test${Date.now()}@test.com`,
            password: 'Test123456',
            full_name: 'Test New User'
        });
        logTest('/auth/register', 'POST', 'PASS', 'User registration successful');
    } catch (error) {
        logTest('/auth/register', 'POST', 'FAIL', `Registration failed: ${error.response?.data?.message || error.message}`);
    }

    // Test forgot password
    try {
        await axios.post(`${BASE_URL}/auth/forgot-password`, {
            email: 'testuser@test.com'
        });
        logTest('/auth/forgot-password', 'POST', 'PASS', 'Forgot password request sent');
    } catch (error) {
        logTest('/auth/forgot-password', 'POST', 'FAIL', `Forgot password failed: ${error.response?.data?.message || error.message}`);
    }
}

async function testUserRoutes() {
    console.log('\n👥 === USER ROUTES ===');

    const routes = [
        { path: '/user/getalluser', method: 'GET', auth: adminToken },
        { path: '/user/getallcustomer', method: 'GET', auth: adminToken }
    ];

    for (const route of routes) {
        try {
            const headers = route.auth ? { Authorization: `Bearer ${route.auth}` } : {};
            await axios.get(`${BASE_URL}${route.path}`, { headers });
            logTest(route.path, route.method, 'PASS', 'Request successful');
        } catch (error) {
            logTest(route.path, route.method, 'FAIL', `Failed: ${error.response?.data?.message || error.message}`);
        }
    }
}

async function testGameRoutes() {
    console.log('\n🎮 === GAME ROUTES ===');

    const routes = [
        { path: '/game/available', method: 'GET', auth: userToken },
        { path: '/game/assigned', method: 'GET', auth: userToken },
        { path: '/game/history', method: 'GET', auth: userToken }
    ];

    for (const route of routes) {
        try {
            const headers = route.auth ? { Authorization: `Bearer ${route.auth}` } : {};
            await axios.get(`${BASE_URL}${route.path}`, { headers });
            logTest(route.path, route.method, 'PASS', 'Request successful');
        } catch (error) {
            logTest(route.path, route.method, 'FAIL', `Failed: ${error.response?.data?.message || error.message}`);
        }
    }

    // Test game start (Admin only)
    try {
        await axios.post(`${BASE_URL}/game/start`, {
            difficulty: 'easy',
            operation: 'addition',
            time_limit: 60
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        logTest('/game/start', 'POST', 'PASS', 'Game start successful');
    } catch (error) {
        logTest('/game/start', 'POST', 'FAIL', `Game start failed: ${error.response?.data?.message || error.message}`);
    }
}





async function testSocialRoutes() {
    console.log('\n👥 === SOCIAL ROUTES ===');

    // Get user ID from token (simplified - in real app, decode JWT)
    try {
        const users = await axios.get(`${BASE_URL}/user/getallcustomer`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        if (users.data.users && users.data.users.length > 0) {
            const userId = users.data.users[0].id;

            const routes = [
                { path: `/users/${userId}/stats`, method: 'GET', auth: userToken },
                { path: `/users/${userId}/followers`, method: 'GET', auth: userToken },
                { path: `/users/${userId}/following`, method: 'GET', auth: userToken }
            ];

            for (const route of routes) {
                try {
                    const headers = route.auth ? { Authorization: `Bearer ${route.auth}` } : {};
                    await axios.get(`${BASE_URL}${route.path}`, { headers });
                    logTest(route.path, route.method, 'PASS', 'Request successful');
                } catch (error) {
                    logTest(route.path, route.method, 'FAIL', `Failed: ${error.response?.data?.message || error.message}`);
                }
            }
        }
    } catch (error) {
        logTest('/users/social', 'GET', 'FAIL', 'Social routes test setup failed');
    }
}

async function testAdminRoutes() {
    console.log('\n👨‍💼 === ADMIN ROUTES ===');

    try {
        await axios.get(`${BASE_URL}/admin/customers/count`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        logTest('/admin/customers/count', 'GET', 'PASS', 'Admin route successful');
    } catch (error) {
        logTest('/admin/customers/count', 'GET', 'FAIL', `Admin route failed: ${error.response?.data?.message || error.message}`);
    }
}



async function generateReport() {
    console.log('\n📊 === COMPREHENSIVE ROUTE TEST REPORT ===');
    console.log(`\n📈 Test Summary:`);
    console.log(`   Total Tests: ${testResults.total}`);
    console.log(`   ✅ Passed: ${testResults.passed}`);
    console.log(`   ❌ Failed: ${testResults.failed}`);
    console.log(`   📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    console.log('\n📋 Failed Routes:');
    const failedRoutes = testResults.routes.filter(r => r.status === 'FAIL');
    if (failedRoutes.length === 0) {
        console.log('   🎉 No failed routes!');
    } else {
        failedRoutes.forEach(route => {
            console.log(`   ❌ ${route.route} - ${route.message}`);
        });
    }

    console.log('\n🎯 Route Coverage Analysis:');
    console.log('   ✅ Health Check - Covered');
    console.log('   ✅ Authentication - Covered');
    console.log('   ✅ User Management - Covered');
    console.log('   ✅ Game System - Covered');


    console.log('   ✅ Social Features - Covered');
    console.log('   ✅ Admin Functions - Covered');

    console.log('   ⚠️ Transaction Routes - NOT IMPLEMENTED');

    console.log('\n🔧 Missing Route in index.js:');
    console.log('   ❌ transaction.route.js is in /routes but not imported in index.js');

    console.log('\n📊 Overall System Status:');
    const successRate = (testResults.passed / testResults.total) * 100;
    if (successRate >= 90) {
        console.log('   🟢 EXCELLENT - Production Ready');
    } else if (successRate >= 75) {
        console.log('   🟡 GOOD - Minor issues to fix');
    } else {
        console.log('   🔴 NEEDS WORK - Major issues found');
    }
}

async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive Route Testing...\n');

    try {
        await testHealthCheck();
        await setupAuth();
        await testAuthRoutes();
        await testUserRoutes();
        await testGameRoutes();


        await testSocialRoutes();
        await testAdminRoutes();


        await generateReport();

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
}

runComprehensiveTest(); 