import sequelize from '../database/db.js';
import { Op } from 'sequelize';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import GameSession from '../model/game-sessions.model.js';
import GameHistory from '../model/game-history.model.js';

// Import and setup associations
import setupAssociations from '../model/associations.js';
setupAssociations();

async function testDifficultyBasedStats() {
    try {
        console.log('🧪 Testing difficulty-based UserStatistics functionality...\n');

        // 1. Show current UserStatistics
        console.log('📊 Current UserStatistics (grouped by difficulty):');
        const allStats = await UserStatistics.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'full_name']
            }],
            order: [['user_id', 'ASC'], ['difficulty_level', 'ASC']]
        });

        const statsByUser = {};
        allStats.forEach(stat => {
            const username = stat.user.username;
            if (!statsByUser[username]) {
                statsByUser[username] = {};
            }
            statsByUser[username][stat.difficulty_level] = {
                games_played: stat.games_played,
                best_score: stat.best_score,
                total_score: stat.total_score
            };
        });

        for (const [username, difficulties] of Object.entries(statsByUser)) {
            console.log(`\n👤 ${username}:`);
            for (const [difficulty, stats] of Object.entries(difficulties)) {
                console.log(`   Difficulty ${difficulty}: ${stats.games_played} games, best: ${stats.best_score}, total: ${stats.total_score}`);
            }
        }

        // 2. Test querying stats for specific difficulty
        console.log('\n🎯 Testing difficulty-specific queries:');

        for (const difficulty of [1, 2, 3]) {
            console.log(`\n🎲 Difficulty ${difficulty} leaderboard:`);
            const difficultyStats = await UserStatistics.findAll({
                where: {
                    difficulty_level: difficulty,
                    best_score: { [Op.gt]: 0 }
                },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['username', 'full_name'],
                    where: { is_active: true }
                }],
                order: [['best_score', 'DESC']],
                limit: 5
            });

            if (difficultyStats.length === 0) {
                console.log('   (No players with scores)');
            } else {
                difficultyStats.forEach((stat, index) => {
                    console.log(`   ${index + 1}. ${stat.user.username} - ${stat.best_score} points (${stat.games_played} games)`);
                });
            }
        }

        // 3. Test getting all stats for a specific user
        console.log('\n👤 Testing user-specific stats across all difficulties:');
        const user = await User.findOne({ where: { username: 'johndoe' } });
        if (user) {
            const userStats = await UserStatistics.findAll({
                where: { user_id: user.id },
                order: [['difficulty_level', 'ASC']]
            });

            console.log(`\n📊 Stats for ${user.username}:`);
            userStats.forEach(stat => {
                console.log(`   Difficulty ${stat.difficulty_level}: ${stat.games_played} games, best: ${stat.best_score}, total: ${stat.total_score}`);
            });
        }

        // 4. Show recent game sessions to verify data source
        console.log('\n🎮 Recent completed game sessions:');
        const recentSessions = await GameSession.findAll({
            where: { completed: true },
            include: [{
                model: User,
                as: 'user',
                attributes: ['username']
            }],
            order: [['updatedAt', 'DESC']],
            limit: 5
        });

        recentSessions.forEach(session => {
            console.log(`   ${session.user.username}: ${session.score} points, difficulty ${session.difficulty_level}, completed: ${session.completed_at || session.updatedAt}`);
        });

        // 5. Summary
        console.log('\n📈 Summary:');
        const totalRecords = await UserStatistics.count();
        const activeUsers = await User.count({ where: { is_active: true } });
        console.log(`   Total UserStatistics records: ${totalRecords}`);
        console.log(`   Active users: ${activeUsers}`);
        console.log(`   Expected records: ${activeUsers * 3} (3 difficulties per user)`);

        if (totalRecords === activeUsers * 3) {
            console.log('   ✅ All users have stats for all difficulty levels');
        } else {
            console.log('   ⚠️  Some users missing stats for some difficulty levels');
        }

        console.log('\n🎉 Test completed successfully!');

    } catch (error) {
        console.error('❌ Test error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await sequelize.close();
    }
}

testDifficultyBasedStats(); 