import rateLimit from 'express-rate-limit';

// Create rate limiter middleware
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Store configuration
    store: new rateLimit.MemoryStore({
        prefix: 'rl:', // Prefix for keys
        cleanupInterval: 15 * 60 * 1000 // Clean up expired entries every 15 minutes
    })
});

// Create stricter rate limiter for authentication endpoints
const authRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    store: new rateLimit.MemoryStore({
        prefix: 'auth_rl:',
        cleanupInterval: 60 * 60 * 1000
    })
});

export { rateLimiter, authRateLimiter }; 