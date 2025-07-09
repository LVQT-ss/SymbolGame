import cron from 'node-cron';
import RedisLeaderboardService from './redisLeaderboardService.js';

class MonthlyLeaderboardJob {
    static isJobRunning = false;
    static lastRun = null;
    static nextRun = null;
    static cronJob = null;

    // Initialize the monthly job scheduler
    static initialize() {
        try {
            // Run on the 1st day of every month at 2:00 AM
            // Format: "minute hour day month dayOfWeek"
            const cronPattern = '0 2 1 * *'; // 2:00 AM on the 1st of every month

            this.cronJob = cron.schedule(cronPattern, async () => {
                console.log('🗓️ Monthly leaderboard persistence job triggered automatically');
                await this.runMonthlyPersistence();
            }, {
                scheduled: false, // Don't start immediately
                timezone: process.env.TIMEZONE || 'UTC'
            });

            // Calculate next run time
            this.updateNextRunTime();

            console.log('📅 Monthly leaderboard job scheduler initialized');
            console.log(`⏰ Next scheduled run: ${this.nextRun}`);

            // Start the cron job
            this.cronJob.start();

            return {
                success: true,
                message: 'Monthly leaderboard job scheduler initialized',
                nextRun: this.nextRun,
                pattern: cronPattern
            };
        } catch (error) {
            console.error('Error initializing monthly leaderboard job:', error);
            throw error;
        }
    }

    // Run the monthly persistence process
    static async runMonthlyPersistence() {
        if (this.isJobRunning) {
            console.log('⚠️ Monthly persistence job is already running, skipping...');
            return {
                success: false,
                message: 'Job already in progress'
            };
        }

        this.isJobRunning = true;
        const startTime = new Date();

        try {
            console.log('🚀 Starting monthly leaderboard persistence and rewards process...');

            // Run the persistence and reward distribution
            const result = await RedisLeaderboardService.persistMonthlyLeaderboard();

            this.lastRun = new Date();
            this.updateNextRunTime();

            const duration = new Date() - startTime;
            console.log(`✅ Monthly persistence completed in ${duration}ms`);
            console.log(`💎 Rewarded ${result.rewardedUsers.length} users with coins`);

            // Log reward details
            result.rewardedUsers.forEach(user => {
                console.log(`  💰 ${user.username} (Rank ${user.rank}, Difficulty ${user.difficulty}): +${user.coins_awarded} coins`);
            });

            return {
                success: true,
                message: 'Monthly persistence and rewards completed successfully',
                rewardedUsers: result.rewardedUsers,
                duration: `${duration}ms`,
                lastRun: this.lastRun,
                nextRun: this.nextRun
            };
        } catch (error) {
            console.error('❌ Error in monthly persistence job:', error);
            return {
                success: false,
                message: 'Monthly persistence failed',
                error: error.message,
                lastRun: this.lastRun,
                nextRun: this.nextRun
            };
        } finally {
            this.isJobRunning = false;
        }
    }

    // Manually trigger the monthly persistence (for testing or manual runs)
    static async runManually() {
        console.log('🔧 Manually triggering monthly leaderboard persistence...');
        return await this.runMonthlyPersistence();
    }

    // Update next run time calculation
    static updateNextRunTime() {
        if (this.cronJob) {
            // Calculate next first day of the month at 2:00 AM
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 2, 0, 0);

            // If we're already past the 1st of this month at 2 AM, use next month
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 2, 0, 0);
            if (now > thisMonth) {
                this.nextRun = nextMonth;
            } else {
                this.nextRun = thisMonth;
            }
        }
    }

    // Get job status
    static getStatus() {
        return {
            isRunning: this.isJobRunning,
            lastRun: this.lastRun,
            nextRun: this.nextRun,
            jobActive: this.cronJob ? this.cronJob.running : false,
            timezone: process.env.TIMEZONE || 'UTC'
        };
    }

    // Stop the scheduled job
    static stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            console.log('🛑 Monthly leaderboard job scheduler stopped');
            return true;
        }
        return false;
    }

    // Restart the scheduled job
    static restart() {
        this.stop();
        return this.initialize();
    }

    // Test function to simulate end of month (for development)
    static async testEndOfMonth() {
        console.log('🧪 Testing end-of-month scenario...');
        console.log('⚠️ This is a test run - rewards will be distributed to top 3 global players!');

        const result = await this.runManually();

        console.log('🧪 Test completed:', result);
        return result;
    }
}

export default MonthlyLeaderboardJob; 