import connectDB from "./db/index.js";
import { app } from './app.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import structuredLogger from './utils/structuredLogger.js';
import { DB_NAME } from './constants.js';
import IORedis from 'ioredis';
import { initializeMetricsCollector } from './services/processingMetrics.js';
import { connectProducer } from '../ingestion/kafka-producers/videoEventProducer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment Configuration
const envPath = process.env.NODE_ENV === 'development' 
  ? path.resolve(__dirname, '../.env.local')
  : path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

structuredLogger.info(`Server starting in ${NODE_ENV} mode`, {}, {
  port: PORT,
  nodeVersion: process.version,
});

// Global Security for Cookies
const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax'
};

// Initialize Redis for metrics
let redisClient = null;
if (process.env.REDIS_DISABLED !== 'true') {
    try {
        const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
        redisClient = new IORedis(redisUrl, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            enableOfflineQueue: true,
            connectTimeout: 10000,
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });

        redisClient.on('error', (err) => {
            structuredLogger.error('Redis connection error', {}, {
                errorMessage: err.message,
            });
        });

        redisClient.on('connect', () => {
            structuredLogger.info('Redis connected', {});
        });
    } catch (error) {
        structuredLogger.error('Failed to initialize Redis', {}, {
            errorMessage: error.message,
        });
    }
}

// Initialize metrics collector
if (redisClient) {
    initializeMetricsCollector(redisClient);
    structuredLogger.info('Metrics collector initialized', {});
}

// Import queue handlers
import videoProcessingQueue from './queues/videoProcessing.queue.js';
videoProcessingQueue?.on?.('completed', (job) => 
    structuredLogger.info(`Job completed`, { jobId: job.id }, { status: 'completed' })
);
videoProcessingQueue?.on?.('failed', (job, err) => 
    structuredLogger.error(`Job failed`, { jobId: job.id }, { errorMessage: err.message })
);

const requiredEnvVars = [
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'MONGODB_URL'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    structuredLogger.error('Missing required environment variables', {}, {
        missingVars,
    });
    process.exit(1);
}

connectDB()
    .then(async () => {
        const server = app.listen(PORT, () => {
            structuredLogger.info(`SERVER running at port ${PORT}`, {}, {
                database: DB_NAME,
                environment: NODE_ENV,
            });
        });

        // Connect Kafka producer in the background so a missing local broker
        // never blocks HTTP startup during development.
        if (process.env.KAFKA_ENABLED !== 'false') {
            connectProducer().catch((error) => {
                structuredLogger.error('Kafka connection failed', {}, {
                    errorMessage: error.message,
                    severity: 'warning',
                });
            });
        }

        server.on('error', (err) => {
            if (err?.code === 'EADDRINUSE') {
                structuredLogger.error(`Port ${PORT} is already in use`, {}, {
                    port: PORT,
                });
                process.exit(1);
            }
            structuredLogger.error('Server execution error', {}, {
                errorMessage: err.message,
            });
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            structuredLogger.info('Shutting down server', {});
            server.close(() => {
                if (redisClient) {
                    redisClient.disconnect();
                }
                process.exit(0);
            });
        });
    })
    .catch((e) => {
        structuredLogger.error("MONGODB CONNECTION FAILED", {}, {
            errorMessage: e.message,
            stack: e.stack,
        });
        process.exit(1);
    });
