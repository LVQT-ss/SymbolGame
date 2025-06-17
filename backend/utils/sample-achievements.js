// Sample achievements for SmartKid Math Game
// These can be used to populate the database with initial achievement data

export const sampleAchievements = [
    // PERFORMANCE ACHIEVEMENTS - Speed & Accuracy
    {
        name: "Lightning Calculator",
        description: "Complete 10 problems in under 30 seconds",
        category: "performance",
        rarity: "common",
        condition_type: "speed_average",
        condition_value: 3.0, // 3 seconds per problem
        condition_threshold: 10, // 10 problems
        points: 50,
        coins: 25,
        experience: 100,
        icon: "⚡",
        badge_color: "#FFD700",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },
    {
        name: "Perfect Precision",
        description: "Achieve 100% accuracy on 20 consecutive problems",
        category: "performance",
        rarity: "rare",
        condition_type: "accuracy_streak",
        condition_value: 100,
        condition_threshold: 20,
        points: 150,
        coins: 75,
        experience: 300,
        icon: "🎯",
        badge_color: "#00FF00",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },
    {
        name: "Speed Demon",
        description: "Answer a problem in under 1 second",
        category: "performance",
        rarity: "epic",
        condition_type: "fastest_answer",
        condition_value: 1.0,
        condition_threshold: 1,
        points: 300,
        coins: 150,
        experience: 500,
        icon: "🔥",
        badge_color: "#FF4500",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },

    // SCORE ACHIEVEMENTS
    {
        name: "First Steps",
        description: "Score your first 100 points",
        category: "performance",
        rarity: "common",
        condition_type: "total_score",
        condition_value: 100,
        condition_threshold: 1,
        points: 25,
        coins: 10,
        experience: 50,
        icon: "👶",
        badge_color: "#87CEEB",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },
    {
        name: "High Scorer",
        description: "Reach 10,000 total points",
        category: "performance",
        rarity: "rare",
        condition_type: "total_score",
        condition_value: 10000,
        condition_threshold: 1,
        points: 200,
        coins: 100,
        experience: 400,
        icon: "🎊",
        badge_color: "#9370DB",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },
    {
        name: "Math Millionaire",
        description: "Accumulate 1,000,000 total points",
        category: "performance",
        rarity: "legendary",
        condition_type: "total_score",
        condition_value: 1000000,
        condition_threshold: 1,
        points: 1000,
        coins: 500,
        experience: 2000,
        icon: "💰",
        badge_color: "#FFD700",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },

    // PROGRESS ACHIEVEMENTS
    {
        name: "Getting Started",
        description: "Complete your first 10 games",
        category: "progress",
        rarity: "common",
        condition_type: "games_played",
        condition_value: 10,
        condition_threshold: 1,
        points: 50,
        coins: 25,
        experience: 100,
        icon: "🎮",
        badge_color: "#32CD32",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },
    {
        name: "Dedicated Player",
        description: "Play 100 games",
        category: "progress",
        rarity: "rare",
        condition_type: "games_played",
        condition_value: 100,
        condition_threshold: 1,
        points: 150,
        coins: 75,
        experience: 300,
        icon: "🏆",
        badge_color: "#FF6347",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },
    {
        name: "Level Up Master",
        description: "Reach level 10",
        category: "progress",
        rarity: "rare",
        condition_type: "level_reached",
        condition_value: 10,
        condition_threshold: 1,
        points: 200,
        coins: 100,
        experience: 400,
        icon: "📈",
        badge_color: "#4169E1",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },

    // SOCIAL ACHIEVEMENTS
    {
        name: "Popular Player",
        description: "Get 10 followers",
        category: "social",
        rarity: "common",
        condition_type: "followers_count",
        condition_value: 10,
        condition_threshold: 1,
        points: 75,
        coins: 40,
        experience: 150,
        icon: "👥",
        badge_color: "#FF69B4",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },
    {
        name: "Like Magnet",
        description: "Receive 50 likes on your games",
        category: "social",
        rarity: "rare",
        condition_type: "total_likes_received",
        condition_value: 50,
        condition_threshold: 1,
        points: 125,
        coins: 60,
        experience: 250,
        icon: "❤️",
        badge_color: "#DC143C",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },
    {
        name: "Community Leader",
        description: "Get 100 followers and give 100 likes",
        category: "social",
        rarity: "epic",
        condition_type: "combined_social",
        condition_value: 100,
        condition_threshold: 2, // Both conditions must be met
        points: 400,
        coins: 200,
        experience: 800,
        icon: "👑",
        badge_color: "#FFD700",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },

    // CONSISTENCY ACHIEVEMENTS
    {
        name: "Daily Dedication",
        description: "Play for 7 consecutive days",
        category: "consistency",
        rarity: "common",
        condition_type: "daily_streak",
        condition_value: 7,
        condition_threshold: 1,
        points: 100,
        coins: 50,
        experience: 200,
        icon: "🗓️",
        badge_color: "#20B2AA",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },
    {
        name: "Monthly Champion",
        description: "Play every day for a month",
        category: "consistency",
        rarity: "epic",
        condition_type: "daily_streak",
        condition_value: 30,
        condition_threshold: 1,
        points: 500,
        coins: 250,
        experience: 1000,
        icon: "📅",
        badge_color: "#8A2BE2",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },

    // SPECIAL/TIME-BASED ACHIEVEMENTS
    {
        name: "Night Owl",
        description: "Play 10 games between 10 PM and 6 AM",
        category: "special",
        rarity: "rare",
        condition_type: "time_based",
        condition_value: 10,
        condition_threshold: 1,
        time_start: "22:00",
        time_end: "06:00",
        points: 150,
        coins: 75,
        experience: 300,
        icon: "🦉",
        badge_color: "#191970",
        is_hidden: true,
        is_secret: false,
        is_progressive: false
    },
    {
        name: "Early Bird",
        description: "Play 15 games between 5 AM and 8 AM",
        category: "special",
        rarity: "rare",
        condition_type: "time_based",
        condition_value: 15,
        condition_threshold: 1,
        time_start: "05:00",
        time_end: "08:00",
        points: 175,
        coins: 85,
        experience: 350,
        icon: "🐦",
        badge_color: "#FFE4B5",
        is_hidden: true,
        is_secret: false,
        is_progressive: false
    },

    // DIFFICULTY ACHIEVEMENTS
    {
        name: "Challenge Accepted",
        description: "Complete 5 expert-level games",
        category: "difficulty",
        rarity: "epic",
        condition_type: "difficulty_completed",
        condition_value: 5,
        condition_threshold: 1,
        difficulty_level: "expert",
        points: 300,
        coins: 150,
        experience: 600,
        icon: "💪",
        badge_color: "#B22222",
        is_hidden: false,
        is_secret: false,
        is_progressive: false
    },

    // SECRET ACHIEVEMENTS
    {
        name: "Lucky Seven",
        description: "Score exactly 777 points in a single game",
        category: "special",
        rarity: "epic",
        condition_type: "exact_score",
        condition_value: 777,
        condition_threshold: 1,
        points: 777,
        coins: 77,
        experience: 777,
        icon: "🍀",
        badge_color: "#32CD32",
        is_hidden: false,
        is_secret: true,
        is_progressive: false
    },
    {
        name: "The Chosen One",
        description: "Be the first player to discover this secret achievement",
        category: "special",
        rarity: "legendary",
        condition_type: "first_to_discover",
        condition_value: 1,
        condition_threshold: 1,
        points: 1000,
        coins: 500,
        experience: 2000,
        icon: "✨",
        badge_color: "#DAA520",
        is_hidden: false,
        is_secret: true,
        is_progressive: false
    },

    // PROGRESSIVE ACHIEVEMENTS
    {
        name: "Math Explorer",
        description: "Complete games in different categories",
        category: "progress",
        rarity: "rare",
        condition_type: "categories_explored",
        condition_value: 5,
        condition_threshold: 1,
        points: 200,
        coins: 100,
        experience: 400,
        icon: "🗺️",
        badge_color: "#4682B4",
        is_hidden: false,
        is_secret: false,
        is_progressive: true,
        progressive_steps: [1, 3, 5], // Show progress at 1, 3, and complete at 5
        progressive_rewards: [
            { points: 50, coins: 25, experience: 100 },
            { points: 100, coins: 50, experience: 200 },
            { points: 200, coins: 100, experience: 400 }
        ]
    },
    {
        name: "Streak Master",
        description: "Build your winning streak",
        category: "consistency",
        rarity: "epic",
        condition_type: "win_streak",
        condition_value: 20,
        condition_threshold: 1,
        points: 400,
        coins: 200,
        experience: 800,
        icon: "🔥",
        badge_color: "#FF4500",
        is_hidden: false,
        is_secret: false,
        is_progressive: true,
        progressive_steps: [5, 10, 15, 20],
        progressive_rewards: [
            { points: 50, coins: 25, experience: 100 },
            { points: 100, coins: 50, experience: 200 },
            { points: 200, coins: 100, experience: 400 },
            { points: 400, coins: 200, experience: 800 }
        ]
    },

    // LEGENDARY ACHIEVEMENTS
    {
        name: "Math Prodigy",
        description: "Achieve perfection: 1000 games, 95%+ accuracy, level 25+",
        category: "performance",
        rarity: "legendary",
        condition_type: "combined_mastery",
        condition_value: 1000,
        condition_threshold: 3, // All conditions must be met
        points: 2000,
        coins: 1000,
        experience: 5000,
        icon: "🧠",
        badge_color: "#9400D3",
        is_hidden: false,
        is_secret: false,
        is_progressive: false,
        special_conditions: {
            games_played: 1000,
            accuracy_percentage: 95,
            level_required: 25
        }
    }
];

// Helper function to create achievements in database
export const createSampleAchievements = async (Achievement) => {
    try {
        console.log('Creating sample achievements...');

        for (const achievementData of sampleAchievements) {
            // Check if achievement already exists
            const existingAchievement = await Achievement.findOne({
                where: { name: achievementData.name }
            });

            if (!existingAchievement) {
                await Achievement.create(achievementData);
                console.log(`✓ Created achievement: ${achievementData.name}`);
            } else {
                console.log(`- Achievement already exists: ${achievementData.name}`);
            }
        }

        console.log(`Sample achievements creation completed. Total: ${sampleAchievements.length}`);
        return true;
    } catch (error) {
        console.error('Error creating sample achievements:', error);
        return false;
    }
};

// Function to get achievements by category
export const getAchievementsByCategory = (category) => {
    return sampleAchievements.filter(achievement => achievement.category === category);
};

// Function to get achievements by rarity
export const getAchievementsByRarity = (rarity) => {
    return sampleAchievements.filter(achievement => achievement.rarity === rarity);
};

// Achievement statistics
export const achievementStats = {
    total: sampleAchievements.length,
    by_category: {
        performance: sampleAchievements.filter(a => a.category === 'performance').length,
        progress: sampleAchievements.filter(a => a.category === 'progress').length,
        social: sampleAchievements.filter(a => a.category === 'social').length,
        consistency: sampleAchievements.filter(a => a.category === 'consistency').length,
        special: sampleAchievements.filter(a => a.category === 'special').length,
        difficulty: sampleAchievements.filter(a => a.category === 'difficulty').length
    },
    by_rarity: {
        common: sampleAchievements.filter(a => a.rarity === 'common').length,
        rare: sampleAchievements.filter(a => a.rarity === 'rare').length,
        epic: sampleAchievements.filter(a => a.rarity === 'epic').length,
        legendary: sampleAchievements.filter(a => a.rarity === 'legendary').length
    },
    hidden: sampleAchievements.filter(a => a.is_hidden).length,
    secret: sampleAchievements.filter(a => a.is_secret).length,
    progressive: sampleAchievements.filter(a => a.is_progressive).length
};

export default sampleAchievements; 