# Quick Reference: Code Changes Checklist

## 1. CORS Configuration Fix

**File**: `BACKEND/src/app.js` (Line 20)  
**Change**:
```javascript
// BEFORE:
app.use(cors({
    origin:  "http://localhost:3000",
    credentials: true,
}));

// AFTER:
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin.trim())) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'Range'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    exposedHeaders: ['x-access-token', 'Content-Type', 'Authorization', 'Content-Range', 'Accept-Ranges', 'Content-Length'],
    maxAge: 86400
}));
```

---

## 2. Environment Variable Validation

**File**: `BACKEND/src/index.js` (Add before connectDB())

```javascript
// Validate required environment variables
const requiredEnvVars = {
    'ACCESS_TOKEN_SECRET': 'JWT access token secret (min 32 chars)',
    'REFRESH_TOKEN_SECRET': 'JWT refresh token secret (min 32 chars)',
    'MONGODB_URL': 'MongoDB connection string',
    'CLOUDINARY_CLOUD_NAME': 'Cloudinary cloud name',
    'CLOUDINARY_API_KEY': 'Cloudinary API key',
    'CLOUDINARY_API_SECRET': 'Cloudinary API secret'
};

const missingVars = Object.keys(requiredEnvVars).filter(v => !process.env[v]);

if (missingVars.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missingVars.forEach(v => {
        console.error(`  - ${v}: ${requiredEnvVars[v]}`);
    });
    process.exit(1);
}

// Validate token secret strength
const validateSecretStrength = (secret, name) => {
    if (!secret || secret.length < 32) {
        console.error(`❌ ${name} must be at least 32 characters long`);
        process.exit(1);
    }
};

validateSecretStrength(process.env.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET');
validateSecretStrength(process.env.REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET');

console.log('✅ All required environment variables are configured');
```

---

## 3. Error Handler Middleware

**File**: `BACKEND/src/middlewares/errorHandler.middleware.js` (NEW FILE)

```javascript
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const isDev = process.env.NODE_ENV !== 'production';

    // Log all errors
    logger.error({
        status,
        message,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?._id,
        stack: err.stack
    });

    // Don't leak error details in production
    const responseMessage = isDev ? message : 'Internal Server Error';
    const responseError = isDev ? err : undefined;

    res.status(status).json({
        success: false,
        status,
        message: responseMessage,
        ...(isDev && { stack: err.stack })
    });
};

// Catch-all for undefined routes
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        status: 404,
        message: 'Route not found'
    });
};

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
```

---

## 4. Rate Limiting Middleware

**File**: `BACKEND/src/middlewares/rateLimiter.js` (NEW FILE)

```javascript
import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/ping',
});

// Strict limiter for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.AUTH_RATE_LIMIT_MAX || 5,
    message: 'Too many login attempts',
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false, // Count all failed attempts
});

// Video upload limiter (more lenient)
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.UPLOAD_RATE_LIMIT_MAX || 10,
    message: 'Too many videos uploaded, try again later'
});

// Search limiter
export const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.SEARCH_RATE_LIMIT_MAX || 30,
    message: 'Too many search requests'
});
```

---

## 5. Logger Setup

**File**: `BACKEND/src/utils/logger.js` (NEW FILE)

```javascript
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'video-streaming-backend' },
    transports: [
        // Error logs
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 10,
        }),
        // All logs
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 10,
        }),
    ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return `${timestamp} [${level}]: ${message} ${
                    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                }`;
            })
        ),
    }));
}

export default logger;
```

---

## 6. Input Sanitization & Validation

**File**: `BACKEND/src/app.js` (Update middleware section)

```javascript
import helmet from 'helmet';
import mongoSanitize from 'mongo-sanitize';
import xss from 'xss-clean';

// Security middleware
app.use(helmet()); // Set various HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

// Body size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

---

## 7. MongoDB Secure Connection

**File**: `BACKEND/src/db/index.js` (Replace entire file)

```javascript
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import logger from '../utils/logger.js';

const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL;
        
        if (!mongoUrl) {
            throw new Error('MONGODB_URL environment variable is not set');
        }

        const dbName = process.env.NODE_ENV === 'test' 
            ? `${DB_NAME}-test` 
            : DB_NAME;

        const options = {
            ssl: true, // Enforce SSL/TLS
            retryWrites: true,
            w: 'majority', // Write concern
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10,
            minPoolSize: 5,
        };

        const connectionInstance = await mongoose.connect(`${mongoUrl}/${dbName}`, options);
        
        logger.info(`MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        return connectionInstance;
    } catch (error) {
        logger.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;
```

---

## 8. Updated Dockerfile

**File**: `BACKEND/Dockerfile` (Replace entire file)

```dockerfile
FROM node:lts-alpine

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    dumb-init \
    curl

# Copy package files
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

# Install dependencies
RUN npm ci --only=production --silent && \
    npm cache clean --force && \
    mv node_modules ../

# Copy application
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app /usr/src/node_modules

# Create logs directory
RUN mkdir -p /usr/src/app/logs && chown nodejs:nodejs /usr/src/app/logs

USER nodejs

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ping || exit 1

ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["node", "src/index.js"]
```

---

## 9. NPM Packages to Install

```bash
# Security & Validation
npm install helmet express-rate-limit mongo-sanitize xss-clean

# Logging
npm install winston

# Utilities (if not already installed)
npm install dotenv

# Development/Testing
npm install --save-dev nodemon jest supertest
```

---

## 10. .env.example (Template)

**File**: `BACKEND/.env.example` (NEW FILE)

```bash
# Environment
NODE_ENV=production
PORT=8000
LOG_LEVEL=info

# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net

# JWT Secrets (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ACCESS_TOKEN_SECRET=<your-secret-here-min-32-chars>
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<your-secret-here-min-32-chars>
REFRESH_TOKEN_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Kafka (if used)
KAFKA_BROKERS=kafka:9092

# Rate Limiting
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
UPLOAD_RATE_LIMIT_MAX=10
SEARCH_RATE_LIMIT_MAX=30
```

---

## 11. docker-compose.yml Update

Replace `docker-compose-BACKEND.yml` with:

```yaml
version: '3.9'

services:
  backend:
    build:
      context: ./BACKEND
      dockerfile: ./Dockerfile
    image: video-streaming-backend:latest
    container_name: backend-app
    ports:
      - "8000:8000"
    environment:
      NODE_ENV: production
      MONGODB_URL: ${MONGODB_URL}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      ACCESS_TOKEN_SECRET: ${ACCESS_TOKEN_SECRET}
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS:-http://localhost:3000}
      KAFKAJS_NO_PARTITIONER_WARNING: 1
    depends_on:
      redis:
        condition: service_healthy
      mongo:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

  redis:
    image: redis:7-alpine
    container_name: redis-cache
    ports:
      - "6379:6379"
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongo:
    image: mongo:7
    container_name: mongo-db
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
    volumes:
      - mongo-data:/data/db
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mongo-data:

networks:
  app-network:
    driver: bridge
```

---

## Implementation Order:
1. **Install packages** first
2. **Create new files** (logger, error handler, rate limiter)
3. **Update existing files** (CORS, validation, Docker)
4. **Test locally** with new .env
5. **Commit to git** with .env.example

---

Generated: March 30, 2026
