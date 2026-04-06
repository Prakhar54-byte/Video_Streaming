import connectDB from "./db/index.js";
import { app } from './app.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { DB_NAME } from './constants.js';

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

logger.info(`Server starting in ${NODE_ENV} mode`);

// Global Security for Cookies
// Note: In production, secure should be true (requires HTTPS)
const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax'
};

// ... existing queue handlers if any ...
import videoProcessingQueue from './queues/videoProcessing.queue.js';
videoProcessingQueue?.on?.('completed', (job) => logger.info(`Job ${job.id} completed`));
videoProcessingQueue?.on?.('failed', (job, err) => logger.error(`Job ${job.id} failed: ${err.message}`));

const requiredEnvVars = [
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'MONGODB_URL'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    logger.error('Missing required environment variables:', missingVars);
    process.exit(1);
}

connectDB()
    .then(() => {
        const server = app.listen(PORT, () => {
            logger.info(`SERVER running at port ${PORT}`);
            logger.info(`CONNECTED TO DB: ${DB_NAME}`);
        });

        server.on('error', (err) => {
            if (err?.code === 'EADDRINUSE') {
                logger.error(`Port ${PORT} is already in use. Stop the other process.`);
                process.exit(1);
            }
            logger.error('Server execution error:', err);
            process.exit(1);
        });
    })
    .catch((e) => {
        logger.error("MONGODB CONNECTION FAILED", e);
        process.exit(1);
    });
