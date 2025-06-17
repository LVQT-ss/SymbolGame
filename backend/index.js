import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import initDB from './database/init.js';
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
import dotenv from 'dotenv';
import process from 'process';
import setupAssociations from './model/associations.js';

// Call this before starting your server
setupAssociations();
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Register the routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', socialRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/game', commentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        message: 'SmartKid Math Game API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
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
process.on('SIGINT', () => {
    console.log('Closing PostgreSQL connection');
    process.exit();
});
