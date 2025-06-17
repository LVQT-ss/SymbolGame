import process from 'process';

// In-memory cache store
const cacheStore = new Map();

// Cache configuration
const CACHE_TTL = 3600; // 1 hour default TTL
const MAX_CACHE_SIZE = 1000;

// Cache wrapper functions
const cacheGet = async (key) => {
    const cached = cacheStore.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
        cacheStore.delete(key);
        return null;
    }

    return cached.value;
};

const cacheSet = async (key, value, ttl = CACHE_TTL) => {
    // Implement LRU-like behavior
    if (cacheStore.size >= MAX_CACHE_SIZE) {
        const oldestKey = cacheStore.keys().next().value;
        cacheStore.delete(oldestKey);
    }

    cacheStore.set(key, {
        value,
        expiry: Date.now() + (ttl * 1000)
    });
};

const cacheDel = async (key) => {
    cacheStore.delete(key);
};

// Cache middleware factory
const cacheMiddleware = (ttl = CACHE_TTL) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl}`;
        const cached = await cacheGet(key);

        if (cached) {
            return res.json(cached);
        }

        res.sendResponse = res.json;
        res.json = (body) => {
            cacheSet(key, body, ttl);
            res.sendResponse(body);
        };

        next();
    };
};

// Cache invalidation helper
const invalidateCache = async (pattern) => {
    for (const key of cacheStore.keys()) {
        if (key.includes(pattern)) {
            cacheStore.delete(key);
        }
    }
};

// Get cache statistics
const getCacheStats = () => {
    return {
        size: cacheStore.size,
        maxSize: MAX_CACHE_SIZE,
        ttl: CACHE_TTL
    };
};

// Export cache functions
export {
    cacheGet,
    cacheSet,
    cacheDel,
    cacheMiddleware,
    invalidateCache,
    getCacheStats
};

// Specific cache middleware for different endpoints
export const gameHistoryCache = cacheMiddleware(180); // 3 minutes - game history changes frequently
export const leaderboardCache = cacheMiddleware(60); // 1 minute - leaderboard changes frequently
export const userStatsCache = cacheMiddleware(300); // 5 minutes
export const achievementCache = cacheMiddleware(600); // 10 minutes - achievements don't change often
export const gameListCache = cacheMiddleware(120); // 2 minutes

// Cache invalidation helpers
export const invalidateUserCache = async (userId) => {
    const patterns = [
        `user_stats:${userId}`,
        `game_history:${userId}:*`,
        `achievements:${userId}`,
        `available_games:${userId}:*`
    ];

    for (const pattern of patterns) {
        invalidateCache(pattern);
    }
};

export const invalidateLeaderboardCache = async () => {
    invalidateCache('leaderboard:*');
}; 