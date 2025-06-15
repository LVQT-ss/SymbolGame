// src/database/sequelize.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
    // CRITICAL: Connection pooling for high load
    pool: {
        max: 100,          // Maximum 100 connections (adjust based on your DB limits)
        min: 10,           // Minimum 10 connections always ready
        acquire: 30000,    // Maximum time to get connection (30s)
        idle: 10000,       // Connection idle time before release (10s)
        evict: 10000,      // Check for idle connections every 10s
        handleDisconnects: true,
        maxUses: Infinity  // No limit on connection reuse
    },
    // Query optimization
    query: {
        raw: false,        // Keep ORM benefits but can set to true for performance
        nest: false,       // Reduce object nesting overhead
        benchmark: process.env.NODE_ENV === 'development' // Log query times in dev
    },
    // Connection optimization
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
        // Keep connections alive
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        // Optimize statement timeout
        statement_timeout: 30000,
        // Connection timeout
        connectionTimeoutMillis: 30000,
        // Idle timeout
        idleTimeoutMillis: 30000
    },
    // Retry logic for connection failures
    retry: {
        max: 3,
        timeout: 5000,
        match: [
            /ETIMEDOUT/,
            /EHOSTUNREACH/,
            /ECONNRESET/,
            /ECONNREFUSED/,
            /ENOTFOUND/,
            /EAI_AGAIN/
        ]
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    // Performance optimizations
    benchmark: false,
    minifyAliases: true,
});

// Health check function for connection monitoring
export const checkDatabaseHealth = async () => {
    try {
        await sequelize.authenticate();
        const poolInfo = sequelize.connectionManager.pool;
        return {
            status: 'healthy',
            pool: {
                used: poolInfo.used || 0,
                available: poolInfo.available || 0,
                pending: poolInfo.pending || 0
            }
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
};

// Graceful shutdown function
export const closeDatabaseConnection = async () => {
    try {
        await sequelize.close();
        console.log('Database connection closed gracefully.');
    } catch (error) {
        console.error('Error closing database connection:', error);
    }
};

export default sequelize;
