// Production configuration for high load scenarios
import process from 'process';
import os from 'os';

export const productionConfig = {
    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        // Enable cluster mode for multi-core utilization
        cluster: process.env.CLUSTER_MODE === 'true',
        workers: process.env.CLUSTER_WORKERS || os.cpus().length,
    },

    // Database optimizations for high load
    database: {
        pool: {
            max: parseInt(process.env.DB_POOL_MAX) || 100,
            min: parseInt(process.env.DB_POOL_MIN) || 20,
            acquire: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
            idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000,
            evict: parseInt(process.env.DB_EVICT_INTERVAL) || 10000,
        },
        // Enable read replicas for better performance
        replication: {
            read: process.env.DB_READ_HOSTS ?
                process.env.DB_READ_HOSTS.split(',').map(host => ({
                    host: host.trim(),
                    username: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_NAME
                })) : null,
            write: {
                host: process.env.DB_HOST,
                username: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            }
        }
    },

    // Cache configuration
    cache: {
        enabled: true,
        type: 'memory',
        memory: {
            maxSize: 1000,
            ttl: 3600, // 1 hour default TTL
            cleanupInterval: 60000 // Clean up expired items every minute
        }
    },

    // Rate limiting configuration
    rateLimiting: {
        // Adjust these based on your actual traffic patterns
        general: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: process.env.RATE_LIMIT_GENERAL || 2000, // Higher for production
        },
        auth: {
            windowMs: 15 * 60 * 1000,
            max: process.env.RATE_LIMIT_AUTH || 50,
        },
        game: {
            windowMs: 15 * 60 * 1000,
            max: process.env.RATE_LIMIT_GAME || 1000,
        },
        burst: {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: process.env.RATE_LIMIT_BURST || 200,
        }
    },

    // Logging configuration for production
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: 'json', // Structured logging for better analysis
        // Log rotation settings
        maxSize: '100m',
        maxFiles: 10,
        // Performance logging
        logSlowQueries: true,
        slowQueryThreshold: 1000, // Log queries > 1 second
    },

    // Security settings
    security: {
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        },
        // JWT settings
        jwt: {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            algorithm: 'HS256',
        }
    },

    // Performance monitoring
    monitoring: {
        // Enable performance metrics collection
        collectMetrics: true,
        metricsInterval: 30000, // 30 seconds
        // Health check intervals
        healthCheckInterval: 60000, // 1 minute
        // Memory usage alerts
        memoryThreshold: 0.8, // Alert at 80% memory usage
        // Database connection monitoring
        monitorConnections: true,
    }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
    // Production-specific settings
    productionConfig.logging.level = 'warn'; // Less verbose logging
    productionConfig.database.pool.max = 150; // More connections for production
    productionConfig.rateLimiting.general.max = 3000; // Higher limits
}

export default productionConfig; 