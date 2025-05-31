import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import initDB from './database/init.js';
import swaggerDocs from './utils/swagger.js';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import dotenv from 'dotenv';
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

// Initialize and synchronize the database
initDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
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
