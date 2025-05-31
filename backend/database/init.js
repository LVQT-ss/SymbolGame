// src/database/init.js
import sequelize from './db.js';
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

        // Synchronize all models with the database
        await sequelize.sync({ alter: true });
        console.log('Database synchronized.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

export default initDB;
