// src/database/init.js
import sequelize from './db.js';
// Import all models to register them with Sequelize
// eslint-disable-next-line no-unused-vars
import User from '../model/user.model.js';
// eslint-disable-next-line no-unused-vars
import UserStatistics from '../model/user-statistics.model.js';
// eslint-disable-next-line no-unused-vars
import FollowerRelationship from '../model/follower-relationships.model.js';
// eslint-disable-next-line no-unused-vars
import GameSession from '../model/game-sessions.model.js';
// eslint-disable-next-line no-unused-vars
import RoundDetail from '../model/round-details.model.js';
// eslint-disable-next-line no-unused-vars
import GameSessionLike from '../model/game-session-likes.model.js';
// eslint-disable-next-line no-unused-vars
import GameSessionComment from '../model/game-session-comments.model.js';
// eslint-disable-next-line no-unused-vars
import LeaderboardEntry from '../model/leaderboard-entries.model.js';
// eslint-disable-next-line no-unused-vars
import Achievement from '../model/achievements.model.js';
// eslint-disable-next-line no-unused-vars
import UserAchievement from '../model/user-achievements.model.js';
// eslint-disable-next-line no-unused-vars
import Notification from '../model/notifications.model.js';
// eslint-disable-next-line no-unused-vars
import PaymentTransaction from '../model/payment-transactions.model.js';

const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Check if tables exist, if not create them
        // This avoids the ENUM alteration issues
        await sequelize.sync({ alter: false });
        console.log('Database synchronized.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

export default initDB;
