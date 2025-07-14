// Script to check PostgreSQL leaderboard data and test additional endpoints
import fetch from 'node-fetch';
import LeaderboardCache from './model/leaderboard-cache.model.js';
import UserStatistics from './model/user-statistics.model.js';
import './database/db.js';

const BASE_URL = 'http://localhost:3000';

async function checkLeaderboardDatabase() {
    console.log('🗄️ CHECKING LEADERBOARD DATABASE STATUS');
    console.log('='.repeat(60));

    try {
        // Check PostgreSQL LeaderboardCache table
        console.log('\n1️⃣ POSTGRESQL LEADERBOARD CACHE TABLE');
        const leaderboardCacheCount = await LeaderboardCache.count();
        console.log(`Total records in LeaderboardCache: ${leaderboardCacheCount}`);

        if (leaderboardCacheCount > 0) {
            const sampleCache = await LeaderboardCache.findAll({
                limit: 5,
                order: [['score', 'DESC']]
            });
            console.log('Sample records:');
            sampleCache.forEach((record, index) => {
                console.log(`  ${index + 1}. ${record.full_name} - Score: ${record.score}, Region: ${record.region}, Difficulty: ${record.difficulty_level}`);
            });
        } else {
            console.log('  ❌ No records in LeaderboardCache table');
        }

        // Check UserStatistics table  
        console.log('\n2️⃣ USER STATISTICS TABLE');
        const userStatsCount = await UserStatistics.count();
        console.log(`Total records in UserStatistics: ${userStatsCount}`);

        if (userStatsCount > 0) {
            const sampleStats = await UserStatistics.findAll({
                limit: 5,
                order: [['best_score', 'DESC']],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['username', 'full_name']
                    }
                ]
            });
            console.log('Sample records:');
            sampleStats.forEach((record, index) => {
                console.log(`  ${index + 1}. ${record.user?.username || 'Unknown'} - Best Score: ${record.best_score}, Difficulty: ${record.difficulty_level}, Games: ${record.games_played}`);
            });
        } else {
            console.log('  ❌ No records in UserStatistics table');
        }

        // Test available months endpoint
        console.log('\n3️⃣ AVAILABLE MONTHS ENDPOINT');
        const monthsResponse = await fetch(`${BASE_URL}/api/leaderboard/available-months`);
        const monthsData = await monthsResponse.json();
        console.log('Status:', monthsResponse.status);
        console.log('JSON Output:');
        console.log(JSON.stringify(monthsData, null, 2));

        // Test specific month leaderboard
        console.log('\n4️⃣ SPECIFIC MONTH LEADERBOARD (2025-07)');
        const specificMonthResponse = await fetch(`${BASE_URL}/api/leaderboard?difficulty_level=1&region=global&time_period=monthly&month_year=2025-07&limit=10`);
        const specificMonthData = await specificMonthResponse.json();
        console.log('Status:', specificMonthResponse.status);
        console.log('JSON Output:');
        console.log(JSON.stringify(specificMonthData, null, 2));

        // Test leaderboard stats endpoint
        console.log('\n5️⃣ LEADERBOARD STATS ENDPOINT');
        const statsResponse = await fetch(`${BASE_URL}/api/leaderboard/stats`);
        const statsData = await statsResponse.json();
        console.log('Status:', statsResponse.status);
        console.log('JSON Output:');
        console.log(JSON.stringify(statsData, null, 2));

    } catch (error) {
        console.error('❌ Error checking leaderboard database:', error.message);
    }
}

// Import User model for associations
import User from './model/user.model.js';

// Run the check
checkLeaderboardDatabase(); 