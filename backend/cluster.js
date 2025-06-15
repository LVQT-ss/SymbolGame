import cluster from 'cluster';
import os from 'os';
import process from 'process';

const numCPUs = os.cpus().length;
const maxWorkers = process.env.CLUSTER_WORKERS || numCPUs;

if (cluster.isPrimary) {
    console.log(`🚀 Master process ${process.pid} is running`);
    console.log(`🔥 Starting ${maxWorkers} workers for ${numCPUs} CPUs`);

    // Fork workers
    for (let i = 0; i < maxWorkers; i++) {
        const worker = cluster.fork();
        console.log(`👷 Worker ${worker.process.pid} started`);
    }

    // Handle worker events
    cluster.on('online', (worker) => {
        console.log(`✅ Worker ${worker.process.pid} is online`);
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`❌ Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);

        // Restart worker if it wasn't killed intentionally
        if (!worker.exitedAfterDisconnect) {
            console.log('🔄 Starting a new worker...');
            const newWorker = cluster.fork();
            console.log(`👷 New worker ${newWorker.process.pid} started`);
        }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('🛑 Master received SIGTERM, shutting down gracefully...');

        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }

        // Give workers time to shut down gracefully
        setTimeout(() => {
            console.log('🔚 Forcing shutdown...');
            process.exit(0);
        }, 10000);
    });

    process.on('SIGINT', () => {
        console.log('🛑 Master received SIGINT, shutting down gracefully...');

        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }

        setTimeout(() => {
            console.log('🔚 Forcing shutdown...');
            process.exit(0);
        }, 10000);
    });

    // Performance monitoring
    setInterval(() => {
        const workers = Object.values(cluster.workers);
        const aliveWorkers = workers.filter(worker => !worker.isDead()).length;
        console.log(`📊 Workers alive: ${aliveWorkers}/${maxWorkers}`);

        // Log memory usage
        const usage = process.memoryUsage();
        console.log(`💾 Master memory usage: ${Math.round(usage.rss / 1024 / 1024)}MB`);
    }, 60000); // Every minute

} else {
    // Worker process - start the actual application
    import('./index.js').then(() => {
        console.log(`🎯 Worker ${process.pid} started successfully`);
    }).catch((error) => {
        console.error(`❌ Worker ${process.pid} failed to start:`, error);
        process.exit(1);
    });

    // Worker-specific graceful shutdown
    process.on('SIGTERM', () => {
        console.log(`🛑 Worker ${process.pid} received SIGTERM, shutting down...`);
        // Add any cleanup logic here
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log(`🛑 Worker ${process.pid} received SIGINT, shutting down...`);
        process.exit(0);
    });
} 