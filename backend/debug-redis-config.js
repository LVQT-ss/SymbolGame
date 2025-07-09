// Debug Redis Configuration and Connection
import dotenv from 'dotenv';
import Redis from 'ioredis';

// Load environment variables
dotenv.config();

async function debugRedisConfig() {
    console.log('🔍 REDIS CONFIGURATION DEBUG\n');

    // 1. Check Environment Variables
    console.log('1️⃣ Environment Variables:');
    console.log(`   REDIS_HOST: ${process.env.REDIS_HOST || 'NOT SET'}`);
    console.log(`   REDIS_PORT: ${process.env.REDIS_PORT || 'NOT SET'}`);
    console.log(`   REDIS_PASSWORD: ${process.env.REDIS_PASSWORD ? '***SET***' : 'NOT SET'}`);
    console.log(`   REDIS_DB: ${process.env.REDIS_DB || 'NOT SET'}`);
    console.log(`   REDIS_URL: ${process.env.REDIS_URL ? '***SET***' : 'NOT SET'}`);
    console.log('');

    // 2. Show Current Redis Config
    console.log('2️⃣ Computed Redis Configuration:');
    const config = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0
    };

    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Password: ${config.password ? '***SET***' : 'None'}`);
    console.log(`   Database: ${config.db}`);
    console.log('');

    // 3. Test Connection with Current Config
    console.log('3️⃣ Testing Connection...');

    // Test with REDIS_URL if available
    if (process.env.REDIS_URL) {
        console.log('   📡 Using REDIS_URL connection...');
        try {
            const redisFromUrl = new Redis(process.env.REDIS_URL);
            const ping = await redisFromUrl.ping();
            console.log('   ✅ REDIS_URL Connection: SUCCESS!', ping);
            await redisFromUrl.quit();
        } catch (error) {
            console.log('   ❌ REDIS_URL Connection Failed:', error.message);
        }
    }

    // Test with individual config
    console.log('   📡 Using individual config variables...');
    try {
        const redis = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            db: config.db,
            connectTimeout: 10000,
            commandTimeout: 5000,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true
        });

        const ping = await redis.ping();
        console.log('   ✅ Individual Config Connection: SUCCESS!', ping);

        // Test basic operations
        await redis.set('test:debug', 'working');
        const value = await redis.get('test:debug');
        console.log('   ✅ Redis Operations: WORKING', value);
        await redis.del('test:debug');

        await redis.quit();

    } catch (error) {
        console.log('   ❌ Individual Config Connection Failed:', error.message);

        if (error.message.includes('ECONNREFUSED')) {
            console.log('   💡 Connection refused - Redis server not reachable');
        } else if (error.message.includes('ENOTFOUND')) {
            console.log('   💡 Host not found - Check REDIS_HOST');
        } else if (error.message.includes('WRONGPASS')) {
            console.log('   💡 Authentication failed - Check REDIS_PASSWORD');
        } else if (error.message.includes('ETIMEDOUT')) {
            console.log('   💡 Connection timeout - Check network/firewall');
        }
    }

    console.log('');
    console.log('4️⃣ Troubleshooting Tips:');
    console.log('');

    if (!process.env.REDIS_HOST || process.env.REDIS_HOST === 'localhost') {
        console.log('❌ ISSUE: Redis still pointing to localhost');
        console.log('   Create .env file with your cloud Redis details:');
        console.log('   REDIS_HOST=your-redis-host.com');
        console.log('   REDIS_PORT=6379');
        console.log('   REDIS_PASSWORD=your-password');
        console.log('   REDIS_DB=0');
        console.log('');
    }

    if (process.env.REDIS_URL) {
        console.log('✅ Using REDIS_URL - Good for cloud providers');
        console.log('   Make sure format is: redis://[:password@]host[:port][/db]');
        console.log('');
    }

    console.log('📋 Common Cloud Redis Examples:');
    console.log('   Render Redis: REDIS_URL=redis://red-xxxxx:password@xxx.render.com:6379');
    console.log('   Upstash: REDIS_URL=rediss://default:password@xxx.upstash.io:6379');
    console.log('   Railway: REDIS_URL=redis://default:password@xxx.railway.app:6379');
    console.log('');

    console.log('🔧 Next Steps:');
    console.log('1. Create/update .env file with correct Redis credentials');
    console.log('2. Restart the server after updating .env');
    console.log('3. Check if cloud Redis allows connections from your IP');
    console.log('4. Verify Redis service is running in your cloud provider');
}

// Run debug
debugRedisConfig().catch(console.error); 