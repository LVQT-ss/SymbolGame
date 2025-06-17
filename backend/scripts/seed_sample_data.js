import bcrypt from 'bcryptjs';
import User from '../model/user.model.js';
import Achievement from '../model/achievements.model.js';
import UserAchievement from '../model/user-achievements.model.js';
import LeaderboardEntry from '../model/leaderboard-entries.model.js';
import sequelize from '../database/db.js';

const sampleUsers = [
    {
        username: 'mathmaster2024',
        usertype: 'Customer',
        email: 'mathmaster@example.com',
        password: 'Math123456',
        full_name: 'Nguyễn Văn Minh',
        coins: 2500,
        experience_points: 8750,
        current_level: 15,
        level_progress: 65.5,
        followers_count: 45,
        following_count: 32
    },
    {
        username: 'speedcalculator',
        usertype: 'Customer',
        email: 'speedcalc@example.com',
        password: 'Speed123456',
        full_name: 'Trần Thị Hoa',
        coins: 3200,
        experience_points: 12300,
        current_level: 20,
        level_progress: 80.2,
        followers_count: 67,
        following_count: 28
    },
    {
        username: 'numberwizard',
        usertype: 'Customer',
        email: 'wizard@example.com',
        password: 'Wizard123456',
        full_name: 'Lê Quang Huy',
        coins: 1800,
        experience_points: 6200,
        current_level: 12,
        level_progress: 45.8,
        followers_count: 23,
        following_count: 41
    },
    {
        username: 'mathhero',
        usertype: 'Customer',
        email: 'hero@example.com',
        password: 'Hero123456',
        full_name: 'Phạm Thu Lan',
        coins: 4100,
        experience_points: 15600,
        current_level: 25,
        level_progress: 92.3,
        followers_count: 89,
        following_count: 15
    },
    {
        username: 'quickthinker',
        usertype: 'Customer',
        email: 'quick@example.com',
        password: 'Quick123456',
        full_name: 'Hoàng Minh Tuấn',
        coins: 2900,
        experience_points: 9800,
        current_level: 17,
        level_progress: 55.1,
        followers_count: 34,
        following_count: 52
    },
    {
        username: 'brainiac',
        usertype: 'Customer',
        email: 'brain@example.com',
        password: 'Brain123456',
        full_name: 'Đặng Thị Mai',
        coins: 3800,
        experience_points: 14200,
        current_level: 23,
        level_progress: 78.9,
        followers_count: 76,
        following_count: 19
    },
    {
        username: 'calculusking',
        usertype: 'Customer',
        email: 'calculus@example.com',
        password: 'King123456',
        full_name: 'Vũ Đức Thành',
        coins: 2200,
        experience_points: 7400,
        current_level: 14,
        level_progress: 38.7,
        followers_count: 18,
        following_count: 61
    },
    {
        username: 'mathgenius',
        usertype: 'Customer',
        email: 'genius@example.com',
        password: 'Genius123456',
        full_name: 'Bùi Thị Thảo',
        coins: 5200,
        experience_points: 18900,
        current_level: 28,
        level_progress: 95.6,
        followers_count: 112,
        following_count: 8
    },
    {
        username: 'admin_symbol',
        usertype: 'Admin',
        email: 'admin@symbol.com',
        password: 'Admin123456',
        full_name: 'Quản trị viên Symbol',
        coins: 10000,
        experience_points: 50000,
        current_level: 50,
        level_progress: 100,
        followers_count: 0,
        following_count: 0
    }
];

const sampleAchievements = [
    {
        name: 'First Steps',
        description: 'Hoàn thành game đầu tiên của bạn',
        category: 'progress',
        points: 100,
        coin_reward: 50,
        experience_reward: 100,
        condition_value: 1,
        unlock_message: 'Chào mừng bạn đến với thế giới toán học!'
    },
    {
        name: 'Speed Demon',
        description: 'Giải 10 bài toán trong vòng 60 giây',
        category: 'performance',
        points: 300,
        coin_reward: 150,
        experience_reward: 300,
        condition_value: 10,
        unlock_message: 'Tốc độ tính toán của bạn thật ấn tượng!'
    },
    {
        name: 'Math Master',
        description: 'Đạt điểm số hoàn hảo trong 5 game liên tiếp',
        category: 'performance',
        points: 500,
        coin_reward: 250,
        experience_reward: 500,
        condition_value: 5,
        unlock_message: 'Bạn là bậc thầy toán học thực thụ!'
    },
    {
        name: 'Social Butterfly',
        description: 'Có 20 người theo dõi',
        category: 'social',
        points: 200,
        coin_reward: 100,
        experience_reward: 200,
        condition_value: 20,
        unlock_message: 'Bạn đã trở thành ngôi sao trong cộng đồng!'
    },
    {
        name: 'Consistent Player',
        description: 'Chơi game mỗi ngày trong 7 ngày liên tiếp',
        category: 'consistency',
        points: 400,
        coin_reward: 200,
        experience_reward: 400,
        condition_value: 7,
        time_frame: 'daily',
        unlock_message: 'Sự kiên trì của bạn thật đáng ngưỡng mộ!'
    },
    {
        name: 'Level Up Champion',
        description: 'Đạt level 15',
        category: 'progress',
        points: 600,
        coin_reward: 300,
        experience_reward: 600,
        condition_value: 15,
        unlock_message: 'Chúc mừng! Bạn đã đạt được cấp độ cao!'
    },
    {
        name: 'Accuracy Expert',
        description: 'Đạt độ chính xác 95% trong 20 game',
        category: 'performance',
        points: 450,
        coin_reward: 225,
        experience_reward: 450,
        condition_value: 20,
        unlock_message: 'Độ chính xác của bạn thật xuất sắc!'
    },
    {
        name: 'Community Leader',
        description: 'Có 50 người theo dõi',
        category: 'social',
        points: 350,
        coin_reward: 175,
        experience_reward: 350,
        condition_value: 50,
        unlock_message: 'Bạn là một nhà lãnh đạo trong cộng đồng!'
    }
];

async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

async function createUsers() {
    console.log('🔄 Creating sample users...');

    for (const userData of sampleUsers) {
        try {
            const hashedPassword = await hashPassword(userData.password);
            await User.create({
                ...userData,
                password: hashedPassword,
                age: new Date(2005 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
            });
            console.log(`✅ Created user: ${userData.username}`);
        } catch (error) {
            console.log(`❌ Error creating user ${userData.username}:`, error.message);
        }
    }
}

async function createAchievements() {
    console.log('\n🔄 Creating sample achievements...');

    for (const achievementData of sampleAchievements) {
        try {
            await Achievement.create(achievementData);
            console.log(`✅ Created achievement: ${achievementData.name}`);
        } catch (error) {
            console.log(`❌ Error creating achievement ${achievementData.name}:`, error.message);
        }
    }
}

async function createUserAchievements() {
    console.log('\n🔄 Creating user achievements...');

    const users = await User.findAll({ where: { usertype: 'Customer' } });
    const achievements = await Achievement.findAll();

    for (const user of users) {
        // Random number of achievements per user (2-6)
        const numAchievements = Math.floor(Math.random() * 5) + 2;
        const userAchievements = achievements.sort(() => 0.5 - Math.random()).slice(0, numAchievements);

        for (const achievement of userAchievements) {
            try {
                const isCompleted = Math.random() > 0.3; // 70% chance to be completed
                const currentProgress = isCompleted ? achievement.condition_value : Math.floor(Math.random() * achievement.condition_value);

                await UserAchievement.create({
                    user_id: user.id,
                    achievement_id: achievement.id,
                    current_progress: currentProgress,
                    max_progress: achievement.condition_value,
                    is_completed: isCompleted,
                    completion_percentage: (currentProgress / achievement.condition_value) * 100,
                    acquired_at: isCompleted ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
                    is_showcased: isCompleted && Math.random() > 0.7 // 30% chance to showcase
                });

                console.log(`✅ Added achievement "${achievement.name}" to user ${user.username}`);
            } catch (error) {
                console.log(`❌ Error adding achievement to user:`, error.message);
            }
        }
    }
}

async function createLeaderboardEntries() {
    console.log('\n🔄 Creating leaderboard entries...');

    const users = await User.findAll({ where: { usertype: 'Customer' } });
    const leaderboardTypes = [
        'overall_score', 'best_single_game', 'speed_masters', 'accuracy_kings',
        'experience_leaders', 'level_champions', 'most_followed', 'most_liked'
    ];
    const timePeriods = ['weekly', 'monthly', 'all_time'];

    for (const leaderboardType of leaderboardTypes) {
        for (const timePeriod of timePeriods) {
            // Sort users by appropriate criteria for each leaderboard type
            let sortedUsers;
            switch (leaderboardType) {
                case 'experience_leaders':
                    sortedUsers = [...users].sort((a, b) => b.experience_points - a.experience_points);
                    break;
                case 'level_champions':
                    sortedUsers = [...users].sort((a, b) => b.current_level - a.current_level);
                    break;
                case 'most_followed':
                    sortedUsers = [...users].sort((a, b) => b.followers_count - a.followers_count);
                    break;
                default:
                    // Random score for other types
                    sortedUsers = [...users].sort(() => 0.5 - Math.random());
                    break;
            }

            // Create entries for top users only
            const topUsers = sortedUsers.slice(0, Math.min(users.length, 8));

            for (let i = 0; i < topUsers.length; i++) {
                const user = topUsers[i];
                let scoreValue;

                switch (leaderboardType) {
                    case 'experience_leaders':
                        scoreValue = user.experience_points;
                        break;
                    case 'level_champions':
                        scoreValue = user.current_level;
                        break;
                    case 'most_followed':
                        scoreValue = user.followers_count;
                        break;
                    default:
                        scoreValue = Math.floor(Math.random() * 10000) + 1000;
                        break;
                }

                try {
                    await LeaderboardEntry.create({
                        user_id: user.id,
                        leaderboard_type: leaderboardType,
                        time_period: timePeriod,
                        rank_position: i + 1,
                        score_value: scoreValue,
                        tier: i === 0 ? 'diamond' : i < 3 ? 'gold' : i < 5 ? 'silver' : 'bronze',
                        games_count: Math.floor(Math.random() * 50) + 10,
                        last_game_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
                        points_change: Math.floor(Math.random() * 200) - 100,
                        rank_change: Math.floor(Math.random() * 6) - 3,
                        is_personal_best: Math.random() > 0.8,
                        period_start: timePeriod === 'weekly' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) :
                            timePeriod === 'monthly' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : null,
                        period_end: timePeriod !== 'all_time' ? new Date() : null
                    });

                    console.log(`✅ Added ${user.username} to ${leaderboardType} (${timePeriod}) at rank ${i + 1}`);
                } catch (error) {
                    console.log(`❌ Error creating leaderboard entry:`, error.message);
                }
            }
        }
    }
}

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...\n');

        // Ensure database is connected
        await sequelize.authenticate();
        console.log('✅ Database connection established\n');

        await createUsers();
        await createAchievements();
        await createUserAchievements();
        await createLeaderboardEntries();

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('📊 Summary:');
        console.log(`   Users created: ${sampleUsers.length}`);
        console.log(`   Achievements created: ${sampleAchievements.length}`);
        console.log('   User achievements and leaderboard entries generated');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await sequelize.close();
    }
}

export default seedDatabase;

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    seedDatabase();
} 