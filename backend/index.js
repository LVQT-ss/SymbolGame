import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import initDB, { checkDatabaseHealth, closeDatabaseConnection } from './database/init.js';
import swaggerDocs from './utils/swagger.js';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import socialRoutes from './routes/social.route.js';
import gameRoutes from './routes/game.route.js';
import leaderboardRoutes from './routes/leaderboard.route.js';
import notificationRoutes from './routes/notification.route.js';
import achievementRoutes from './routes/achievement.route.js';
import adminRoutes from './routes/admin.route.js';
import commentRoutes from './routes/comment.route.js';
import transactionRoutes from './routes/transaction.route.js';
import { generalLimiter, authLimiter, gameLimiter, burstProtection } from './middleware/rateLimiter.js';
import { getCacheStats } from './middleware/cache.js';
import dotenv from 'dotenv';
import process from 'process';
import setupAssociations from './model/associations.js';

// Call this before starting your server
setupAssociations();
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Security and performance middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(burstProtection); // Anti-DDoS protection
app.use(generalLimiter); // General rate limiting

// Basic middleware
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Register the routes with specific rate limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', socialRoutes);
app.use('/api/game', gameLimiter, gameRoutes);
app.use('/api/game', commentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transaction', transactionRoutes);

// Health check endpoint with system stats
app.get('/api/health', async (req, res) => {
    try {
        const dbHealth = await checkDatabaseHealth();
        const cacheStats = await getCacheStats();

        res.status(200).json({
            message: 'SmartKid Math Game API is running!',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                database: dbHealth,
                cache: cacheStats
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Health check failed',
            error: error.message
        });
    }
});

// Initialize and synchronize the database
initDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
        // Initialize Swagger docs
        swaggerDocs(app, port);
    });
}).catch(error => {
    console.error('Invalid database connection:', error);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    try {
        await closeDatabaseConnection();
        console.log('Database connections closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    try {
        await closeDatabaseConnection();
        console.log('Database connections closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});
