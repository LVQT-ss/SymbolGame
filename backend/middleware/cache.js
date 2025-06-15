import Redis from 'ioredis';
import process from 'process';

// Redis client for caching
let redis = null;
const useRedis = process.env.REDIS_URL || process.env.NODE_ENV === 'production';

if (useRedis) {
    try {
        redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        console.log('Cache using Redis');
    } catch (error) {
        console.log('Redis cache not available, using memory cache');
    }
}

// In-memory cache fallback
const memoryCache = new Map();
const MEMORY_CACHE_MAX_SIZE = 1000;

// Memory cache cleanup
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
        if (now > value.expires) {
            memoryCache.delete(key);
        }
    }
}, 60000); // Clean every minute

// Cache wrapper functions
const cacheGet = async (key) => {
    if (redis) {
        try {
            const value = await redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Redis GET error:', error);
            return null;
        }
    } else {
        const item = memoryCache.get(key);
        if (item && Date.now() < item.expires) {
            return item.data;
        } else if (item) {
            memoryCache.delete(key);
        }
        return null;
    }
};

const cacheSet = async (key, value, ttlSeconds = 300) => {
    if (redis) {
        try {
            await redis.setex(key, ttlSeconds, JSON.stringify(value));
        } catch (error) {
            console.error('Redis SET error:', error);
        }
    } else {
        // Memory cache size management
        if (memoryCache.size >= MEMORY_CACHE_MAX_SIZE) {
            const firstKey = memoryCache.keys().next().value;
            memoryCache.delete(firstKey);
        }

        memoryCache.set(key, {
            data: value,
            expires: Date.now() + (ttlSeconds * 1000)
        });
    }
};

const cacheDel = async (key) => {
    if (redis) {
        try {
            await redis.del(key);
        } catch (error) {
            console.error('Redis DEL error:', error);
        }
    } else {
        memoryCache.delete(key);
    }
};

// Generic cache middleware
export const cacheMiddleware = (options = {}) => {
    const {
        ttl = 300, // 5 minutes default
        keyGenerator = (req) => `cache:${req.method}:${req.originalUrl}`,
        condition = () => true // Function to determine if request should be cached
    } = options;

    return async (req, res, next) => {
        // Skip caching for non-GET requests by default
        if (req.method !== 'GET' && !condition(req, res)) {
            return next();
        }

        const cacheKey = keyGenerator(req);

        try {
            const cachedData = await cacheGet(cacheKey);

            if (cachedData) {
                console.log(`Cache HIT: ${cacheKey}`);
                return res.json(cachedData);
            }

            // Cache miss - continue to route handler
            console.log(`Cache MISS: ${cacheKey}`);

            // Override res.json to cache the response
            const originalJson = res.json.bind(res);
            res.json = function (data) {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cacheSet(cacheKey, data, ttl).catch(err => {
                        console.error('Cache set error:', err);
                    });
                }
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

// Specific cache middleware for different endpoints
export const gameHistoryCache = cacheMiddleware({
    ttl: 180, // 3 minutes - game history changes frequently
    keyGenerator: (req) => `game_history:${req.userId}:${req.query.page || 1}:${req.query.limit || 10}`
});

export const leaderboardCache = cacheMiddleware({
    ttl: 60, // 1 minute - leaderboard changes frequently
    keyGenerator: (req) => `leaderboard:${req.query.period || 'weekly'}:${req.query.page || 1}`
});

export const userStatsCache = cacheMiddleware({
    ttl: 300, // 5 minutes
    keyGenerator: (req) => `user_stats:${req.userId}`
});

export const achievementCache = cacheMiddleware({
    ttl: 600, // 10 minutes - achievements don't change often
    keyGenerator: (req) => `achievements:${req.userId || 'all'}`
});

export const gameListCache = cacheMiddleware({
    ttl: 120, // 2 minutes
    keyGenerator: (req) => `available_games:${req.userId}:${JSON.stringify(req.query)}`
});

// Cache invalidation helpers
export const invalidateUserCache = async (userId) => {
    const patterns = [
        `user_stats:${userId}`,
        `game_history:${userId}:*`,
        `achievements:${userId}`,
        `available_games:${userId}:*`
    ];

    for (const pattern of patterns) {
        if (redis) {
            try {
                const keys = await redis.keys(pattern);
                if (keys.length > 0) {
                    await redis.del(...keys);
                }
            } catch (error) {
                console.error('Cache invalidation error:', error);
            }
        } else {
            // For memory cache, we need to manually check each key
            for (const key of memoryCache.keys()) {
                if (key.startsWith(pattern.replace('*', ''))) {
                    memoryCache.delete(key);
                }
            }
        }
    }
};

export const invalidateLeaderboardCache = async () => {
    if (redis) {
        try {
            const keys = await redis.keys('leaderboard:*');
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            console.error('Leaderboard cache invalidation error:', error);
        }
    } else {
        for (const key of memoryCache.keys()) {
            if (key.startsWith('leaderboard:')) {
                memoryCache.delete(key);
            }
        }
    }
};

// Cache statistics
export const getCacheStats = async () => {
    if (redis) {
        try {
            const info = await redis.info('memory');
            return {
                type: 'redis',
                info: info
            };
        } catch (error) {
            return { type: 'redis', error: error.message };
        }
    } else {
        return {
            type: 'memory',
            size: memoryCache.size,
            maxSize: MEMORY_CACHE_MAX_SIZE
        };
    }
};

export { cacheGet, cacheSet, cacheDel }; 