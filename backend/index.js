import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { createServer } from 'http';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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
import { verifyToken } from './middleware/verifyUser.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Security and performance middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads', 'profile-pictures');
const videoUploadDir = path.join(__dirname, 'uploads', 'game-recordings');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(videoUploadDir)) {
    fs.mkdirSync(videoUploadDir, { recursive: true });
}

// Configure multer for video recording uploads
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, videoUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `game-recording-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const videoUpload = multer({
    storage: videoStorage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Accept only video files
        if (!file.mimetype.startsWith('video/')) {
            return cb(new Error('Only video files are allowed!'));
        }

        // Get duration from request body
        const duration = parseInt(req.body.duration) || 5;
        if (duration > 10) {
            return cb(new Error('Video duration cannot exceed 10 seconds!'));
        }

        cb(null, true);
    }
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register the routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', socialRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Direct video recording URL endpoint - receives Firebase URL instead of file
app.post('/api/record-video-url', verifyToken, async (req, res) => {
    try {
        console.log('🔥 Video URL storage request received');
        console.log('📝 Body:', req.body);
        console.log('👤 User ID:', req.userId);

        const { recording_url, recording_duration } = req.body;

        if (!recording_url) {
            return res.status(400).json({ message: 'Recording URL is required' });
        }

        // Validate that it's a Firebase Storage URL
        if (!recording_url.includes('firebase') && !recording_url.includes('googleapis')) {
            return res.status(400).json({ message: 'Invalid Firebase Storage URL' });
        }

        const duration = parseInt(recording_duration) || 10;
        if (duration > 15) {
            return res.status(400).json({
                message: 'Video duration cannot exceed 15 seconds'
            });
        }

        console.log('✅ Firebase video URL received successfully:', recording_url);

        // Return the URL to confirm storage
        return res.status(200).json({
            message: 'Video URL stored successfully',
            recording_url: recording_url,
            recording_duration: duration,
            storage_type: 'firebase'
        });
    } catch (error) {
        console.error('Error storing video URL:', error);
        return res.status(500).json({
            message: 'Failed to store video URL',
            error: error.message
        });
    }
});

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
