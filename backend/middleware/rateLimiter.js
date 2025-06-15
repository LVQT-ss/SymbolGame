import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import process from 'process';

// Redis client for distributed rate limiting (optional - can use memory if no Redis)
let redisClient = null;
try {
    if (process.env.REDIS_URL) {
        redisClient = new Redis(process.env.REDIS_URL);
        console.log('Rate limiter using Redis store');
    }
} catch (error) {
    console.log('Redis not available, using memory store for rate limiting');
}

// General API rate limiter - 1000 requests per 15 minutes
export const generalLimiter = rateLimit({
    store: redisClient ? new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }) : undefined, // Use memory store if no Redis
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60 // 15 minutes
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip successful requests from rate limiting
    skip: (req, res) => res.statusCode < 400,
    // Custom key generator for more granular control
    keyGenerator: (req) => {
        return req.ip + ':' + (req.headers['user-agent'] || 'unknown');
    }
});

// Strict rate limiter for auth endpoints - 20 requests per 15 minutes
export const authLimiter = rateLimit({
    store: redisClient ? new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }) : undefined,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 auth requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Custom key for auth endpoints
    keyGenerator: (req) => {
        return 'auth:' + req.ip;
    }
});

// Game API rate limiter - 500 requests per 15 minutes
export const gameLimiter = rateLimit({
    store: redisClient ? new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }) : undefined,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 game requests per windowMs
    message: {
        error: 'Too many game requests, please slow down.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return 'game:' + req.ip;
    }
});

// Heavy operations limiter - 50 requests per hour
export const heavyOperationsLimiter = rateLimit({
    store: redisClient ? new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }) : undefined,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 heavy operations per hour
    message: {
        error: 'Too many resource-intensive requests, please try again later.',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return 'heavy:' + req.ip;
    }
});

// Burst protection - very short window, high frequency protection
export const burstProtection = rateLimit({
    store: redisClient ? new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }) : undefined,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Max 100 requests per minute
    message: {
        error: 'Request rate too high, please slow down.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return 'burst:' + req.ip;
    }
});

// Per-user rate limiter (requires authentication)
export const perUserLimiter = rateLimit({
    store: redisClient ? new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }) : undefined,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Higher limit per authenticated user
    message: {
        error: 'Too many requests for this user account.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return 'user:' + (req.userId || req.ip);
    },
    // Skip if user is not authenticated
    skip: (req) => !req.userId
});

export default {
    generalLimiter,
    authLimiter,
    gameLimiter,
    heavyOperationsLimiter,
    burstProtection,
    perUserLimiter
}; 