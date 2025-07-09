import Redis from 'ioredis';
import dotenv from 'dotenv';
import process from 'process';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve('.env') });

// Debug: Log what Redis config is being used
console.log('🔧 Redis Configuration Debug:');
console.log(`   REDIS_HOST: ${process.env.REDIS_HOST || 'localhost (default)'}`);
console.log(`   REDIS_PORT: ${process.env.REDIS_PORT || '6379 (default)'}`);
console.log(`   REDIS_PASSWORD: ${process.env.REDIS_PASSWORD ? '[SET]' : '[NOT SET]'}`);
console.log(`   REDIS_DB: ${process.env.REDIS_DB || '0 (default)'}`);

// Redis Configuration
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: false, // Changed to false for immediate connection
    keepAlive: 30000,
    connectionTimeout: 10000,
    commandTimeout: 5000,
    // Connection pool settings
    family: 4,
    // Enhanced retry strategy for cloud connections
    retryStrategy: (times) => {
        if (times > 10) {
            console.log(`❌ Redis max retries exceeded (${times})`);
            return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 3000);
        console.log(`🔄 Redis connection retry attempt ${times}, delay: ${delay}ms`);
        return delay;
    },
    // Reconnect on error for Redis Cloud
    reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED'];
        return targetErrors.some(targetError => err.message.includes(targetError));
    }
};

// Create Redis client instance
const redis = new Redis(redisConfig);

// Redis event handlers with enhanced logging
redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
    console.log(`🌐 Connected to: ${redisConfig.host}:${redisConfig.port}`);
});

redis.on('ready', () => {
    console.log('🚀 Redis ready for operations');
    console.log(`📊 Redis Status: ${redis.status}`);
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
    console.error(`🔗 Attempting to connect to: ${redisConfig.host}:${redisConfig.port}`);
    console.error(`🔑 Password configured: ${redisConfig.password ? 'Yes' : 'No'}`);
});

redis.on('close', () => {
    console.log('🔴 Redis connection closed');
});

redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
    console.log(`🎯 Target: ${redisConfig.host}:${redisConfig.port}`);
});

// Health check function
export const checkRedisHealth = async () => {
    try {
        const start = Date.now();
        await redis.ping();
        const latency = Date.now() - start;

        return {
            status: 'healthy',
            latency: `${latency}ms`,
            connection: redis.status,
            memory: await redis.memory('usage'),
            keyspace: await redis.info('keyspace')
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            connection: redis.status
        };
    }
};

// Graceful shutdown function
export const closeRedisConnection = async () => {
    try {
        await redis.quit();
        console.log('Redis connection closed gracefully.');
    } catch (error) {
        console.error('Error closing Redis connection:', error);
        redis.disconnect();
    }
};

// Get Redis client
export const getRedisClient = () => redis;

export default redis; 