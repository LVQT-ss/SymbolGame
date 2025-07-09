#!/usr/bin/env node

import dotenv from 'dotenv';
import Redis from 'ioredis';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve('.env') });

console.log('🧪 REDIS CLOUD CONNECTION TEST\n');

// Display current environment variables
console.log('📋 Environment Variables:');
console.log(`   REDIS_HOST: ${process.env.REDIS_HOST || 'NOT SET'}`);
console.log(`   REDIS_PORT: ${process.env.REDIS_PORT || 'NOT SET'}`);
console.log(`   REDIS_PASSWORD: ${process.env.REDIS_PASSWORD ? 'SET ✅' : 'NOT SET ❌'}`);
console.log(`   REDIS_DB: ${process.env.REDIS_DB || 'NOT SET'}\n`);

// Check if Redis Cloud credentials are configured
if (!process.env.REDIS_HOST || process.env.REDIS_HOST === 'localhost') {
    console.log('⚠️  WARNING: REDIS_HOST is not set or still set to localhost');
    console.log('   Your .env file should have something like:');
    console.log('   REDIS_HOST=redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com');
    console.log('   REDIS_PORT=12345');
    console.log('   REDIS_PASSWORD=your-redis-password\n');
}

async function testRedisConnection() {
    console.log('🔌 Testing Redis Cloud Connection...\n');

    const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        connectTimeout: 10000,
        commandTimeout: 5000,
        retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 100, 1000);
        }
    };

    console.log(`🎯 Connecting to: ${redisConfig.host}:${redisConfig.port}`);
    console.log(`🔑 Password: ${redisConfig.password ? 'Yes' : 'No'}`);
    console.log(`🗃️  Database: ${redisConfig.db}\n`);

    const redis = new Redis(redisConfig);

    try {
        // Test connection
        console.log('⏳ Testing connection...');
        const pong = await redis.ping();
        console.log(`✅ Connection successful! Response: ${pong}`);

        // Test basic operations
        console.log('\n⏳ Testing basic operations...');

        // Set a test key
        await redis.set('test:connection', `Connected at ${new Date().toISOString()}`);
        console.log('✅ SET operation successful');

        // Get the test key
        const value = await redis.get('test:connection');
        console.log(`✅ GET operation successful: ${value}`);

        // Delete the test key
        await redis.del('test:connection');
        console.log('✅ DEL operation successful');

        // Test Redis info
        const info = await redis.info('server');
        const version = info.match(/redis_version:([^\r\n]+)/);
        console.log(`✅ Redis version: ${version ? version[1] : 'Unknown'}`);

        console.log('\n🎉 Redis Cloud connection is working perfectly!');
        console.log('✅ Your application should now connect to Redis Cloud instead of localhost');

    } catch (error) {
        console.error('\n❌ Redis Cloud connection failed:');
        console.error(`   Error: ${error.message}`);

        if (error.message.includes('ENOTFOUND')) {
            console.log('\n🔧 Troubleshooting:');
            console.log('   • Check your REDIS_HOST is correct');
            console.log('   • Verify your Redis Cloud instance is running');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 Troubleshooting:');
            console.log('   • Check your REDIS_PORT is correct');
            console.log('   • Verify your Redis Cloud instance is accessible');
        } else if (error.message.includes('AUTH')) {
            console.log('\n🔧 Troubleshooting:');
            console.log('   • Check your REDIS_PASSWORD is correct');
            console.log('   • Verify password in your Redis Cloud dashboard');
        }
    } finally {
        await redis.quit();
    }
}

// Run the test
testRedisConnection().catch(console.error); 