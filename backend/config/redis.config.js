import Redis from 'ioredis';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

// Redis Configuration
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectionTimeout: 10000,
    commandTimeout: 5000,
    // Connection pool settings
    family: 4,
    // Retry strategy
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
        return delay;
    },
    // Reconnect on error
    reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
    }
};

// Create Redis client instance
const redis = new Redis(redisConfig);

// Redis event handlers
redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
    console.log('🚀 Redis ready for operations');
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
});

redis.on('close', () => {
    console.log('🔴 Redis connection closed');
});

redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
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