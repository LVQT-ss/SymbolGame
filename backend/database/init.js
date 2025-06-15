// src/database/init.js
import sequelize, { checkDatabaseHealth, closeDatabaseConnection } from './db.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import FollowerRelationship from '../model/follower-relationships.model.js';
import GameSession from '../model/game-sessions.model.js';
import RoundDetail from '../model/round-details.model.js';
import GameSessionLike from '../model/game-session-likes.model.js';
import GameSessionComment from '../model/game-session-comments.model.js';
import LeaderboardEntry from '../model/leaderboard-entries.model.js';
import Achievement from '../model/achievements.model.js';
import UserAchievement from '../model/user-achievements.model.js';
import Notification from '../model/notifications.model.js';
import PaymentTransaction from '../model/payment-transactions.model.js';

const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // First, import all models to ensure they are registered
        const models = [
            User, UserStatistics, FollowerRelationship, GameSession,
            RoundDetail, GameSessionLike, GameSessionComment,
            LeaderboardEntry, Achievement, UserAchievement,
            Notification, PaymentTransaction
        ];

        console.log(`Loaded ${models.length} models`);

        // Synchronize models with database - safe mode to avoid constraint errors
        await sequelize.sync({ force: false, alter: false });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};

export default initDB;
export { checkDatabaseHealth, closeDatabaseConnection };
