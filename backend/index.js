import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { createServer } from 'http';
import initDB, { checkDatabaseHealth, closeDatabaseConnection } from './database/init.js';
import swaggerDocs from './utils/swagger.js';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import socialRoutes from './routes/social.route.js';
import gameRoutes from './routes/game.route.js';
import adminRoutes from './routes/admin.route.js';
import commentRoutes from './routes/comment.route.js';
import transactionRoutes from './routes/transaction.route.js';
import battleRoutes from './routes/battle.route.js';
import leaderboardRoutes from './routes/leaderboard.route.js';
import { getCacheStats } from './middleware/cache.js';
import socketService from './services/socketService.js';
import dotenv from 'dotenv';
import process from 'process';
import setupAssociations from './model/associations.js';

// Call this before starting your server
setupAssociations();
dotenv.config();
const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;

// Security and performance middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Register the routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', socialRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

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
    // Initialize Socket.IO
    socketService.initialize(server);

    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
        console.log(`Socket.IO server ready for real-time battle communication`);
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
