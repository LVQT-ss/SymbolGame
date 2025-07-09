// src/database/init.js
import sequelize, { checkDatabaseHealth, closeDatabaseConnection } from './db.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import FollowerRelationship from '../model/follower-relationships.model.js';
import GameSession from '../model/game-sessions.model.js';
import RoundDetail from '../model/round-details.model.js';
import GameSessionLike from '../model/game-session-likes.model.js';
import GameSessionComment from '../model/game-session-comments.model.js';
import PaymentTransaction from '../model/payment-transactions.model.js';
import GameHistory from '../model/game-history.model.js';
import LeaderboardCache from '../model/leaderboard-cache.model.js';
import BattleSession from '../model/battle-sessions.model.js';
import BattleRoundDetail from '../model/battle-round-details.model.js';
import UserRoundResponse from '../model/user-round-responses.model.js';

const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // First, import all models to ensure they are registered
        const models = [
            User,
            UserStatistics,
            FollowerRelationship,
            GameSession,
            RoundDetail,
            GameSessionLike,
            GameSessionComment,
            PaymentTransaction,
            GameHistory,
            LeaderboardCache,
            BattleSession,
            BattleRoundDetail,
            UserRoundResponse
        ];

        console.log(`Loaded ${models.length} models`);

        // Try to synchronize models with database
        try {
            await sequelize.sync({ force: false, alter: false });
            console.log('Database synchronized successfully.');
        } catch (syncError) {
            console.warn('Database sync encountered issues, trying individual model sync...');

            // Models that might need schema updates
            const modelsNeedingAlter = [];

            // Try to sync models individually to identify problematic ones
            for (const model of models) {
                try {
                    const syncOptions = modelsNeedingAlter.includes(model.name)
                        ? { force: false, alter: true }
                        : { force: false, alter: false };

                    await model.sync(syncOptions);
                    console.log(`✓ ${model.name} synced successfully${syncOptions.alter ? ' (with schema update)' : ''}`);
                } catch (modelError) {
                    console.warn(`⚠ ${model.name} sync failed:`, modelError.message);
                    // Continue with other models
                }
            }
            console.log('Individual model sync completed.');
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};

export default initDB;
export { checkDatabaseHealth, closeDatabaseConnection };
