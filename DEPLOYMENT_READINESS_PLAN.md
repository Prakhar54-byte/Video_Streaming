# Video Streaming Platform - Deployment Readiness Plan

**Status**: Pre-Production Audit  
**Date**: March 30, 2026  
**Priority**: CRITICAL - Multiple security and configuration issues identified

---

## 📋 Executive Summary

Your video streaming platform has **3 critical security issues**, **8 high-priority deployment issues**, and **12 medium-priority improvements** that need to be addressed before production deployment. This document provides a step-by-step remediation plan organized by priority and impact.

---

## 🚨 CRITICAL PRIORITY (Must Fix Before Deployment)

### 1. **Exposed API Keys in Repository** ⚠️ SECURITY CRITICAL
**Impact**: Data breach, unauthorized access to APIs  
**Location**: `.env` file committed to repository  
**Issue**: `GEMINI_API_KEY` is visible in plaintext

**Remediation Steps**:
- [ ] Revoke the exposed API key immediately in Google Cloud Console
- [ ] Create `.env.example` template without secrets
- [ ] Ensure `.env` is in `.gitignore` (verify this)
- [ ] Use environment-specific secrets management:
  - Development: `.env.local` (git-ignored)
  - Staging: AWS Secrets Manager / Environment variables
  - Production: Container secrets / GitHub Secrets / Vault

**Timeline**: Within 24 hours

---

### 2. **Hardcoded CORS Origin** ⚠️ SECURITY CRITICAL
**Impact**: CSRF attacks, cross-site vulnerabilities  
**Location**: `BACKEND/src/app.js:20`  
**Issue**: CORS origin hardcoded to `http://localhost:3000`

```javascript
// Current (VULNERABLE):
app.use(cors({
    origin:  "http://localhost:3000" ,  // ❌ Should be environment variable
    credentials: true, 
    // ...
}));
```

**Remediation**:
```javascript
// Secure approach:
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'Range'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    exposedHeaders: ['x-access-token', 'Content-Type', 'Authorization', 'Content-Range', 'Accept-Ranges', 'Content-Length'],
    maxAge: 86400 // 24 hours
}));
```

**Timeline**: Immediate

---

### 3. **Missing JWT Secret Validation** ⚠️ SECURITY CRITICAL
**Impact**: JWT token validation will fail silently if env vars missing  
**Locations**: 
- `BACKEND/src/models/user.model.js:77, 89`
- `BACKEND/src/middlewares/authMiddleware.js:30`

**Issue**: No validation that `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` exist

**Remediation**:
```javascript
// Add to BACKEND/src/index.js (before server start):
const requiredEnvVars = [
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'MONGODB_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}
```

**Timeline**: Immediate

---

## ⚠️ HIGH PRIORITY (Must Fix Before Production)

### 4. **No Error Handling Middleware** 🔴 DEPLOYMENT CRITICAL
**Impact**: Unhandled errors crash server, poor debugging  
**Status**: Missing global error handler

**Create**: `BACKEND/src/middlewares/errorHandler.middleware.js`
```javascript
export const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message;
    
    // Log errors (use proper logging service in production)
    console.error(`[${new Date().toISOString()}] ${status} - ${message}`, err);
    
    res.status(status).json({
        success: false,
        status,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

// Add to app.js AFTER all routes:
app.use(errorHandler);
```

**Timeline**: Before deployment

---

### 5. **No Rate Limiting** 🔴 DEPLOYMENT CRITICAL
**Impact**: DDoS vulnerability, API abuse  

**Install & Implement**:
```bash
npm install express-rate-limit
```

**Create**: `BACKEND/src/middlewares/rateLimiter.js`
```javascript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => req.path === '/health' // Skip health checks
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Stricter limit for auth endpoints
    message: 'Too many login attempts'
});
```

**Apply in app.js**:
```javascript
import { apiLimiter, authLimiter } from './middlewares/rateLimiter.js';

app.use('/api/', apiLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
```

**Timeline**: Before deployment

---

### 6. **Missing Request Validation & Sanitization** 🔴 DEPLOYMENT CRITICAL
**Impact**: SQL injection, XSS, malformed data attacks  
**Status**: Basic Joi validation exists but inconsistently applied

**Actions**:
- [ ] Create validation schemas for all endpoints
- [ ] Apply Input Sanitization middleware:

```bash
npm install express-validator helmet xss-clean
```

**Update**: `BACKEND/src/app.js`
```javascript
import helmet from 'helmet';
import mongoSanitize from 'mongo-sanitize';

app.use(helmet()); // Secure HTTP headers
app.use(mongoSanitize()); // Data sanitization against NoSQL injection
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

**Timeline**: Before deployment

---

### 7. **Missing Environment Variables in Production** 🔴 DEPLOYMENT CRITICAL
**Impact**: Services won't start, undefined behavior  

**Required Env Vars for Production**:
```bash
# Database
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net
NODE_ENV=production

# JWT Secrets (must be strong random strings, min 32 chars)
ACCESS_TOKEN_SECRET=<generate-random-string>
REFRESH_TOKEN_SECRET=<generate-random-string>
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Kafka (if applicable)
KAFKA_BROKERS=kafka:9092

# Port
PORT=8000

# Optional: Logging
LOG_LEVEL=info
```

**Setup**: Use Docker secrets or GitHub Actions environment variables  
**Timeline**: Immediate

---

### 8. **Insecure Dockerfile & Security Issues** 🔴 DEPLOYMENT CRITICAL
**Current Issues in** `BACKEND/Dockerfile`:
- Missing HEALTHCHECK
- Exposing wrong port (3000 vs 8000)
- No non-root user (though chown exists)
- No labels for metadata

**Replace with**:
```dockerfile
FROM node:lts-alpine

# Build arguments
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Setup working directory
WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache ffmpeg python3 dumb-init

# Copy package files
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

# Install dependencies (production only)
RUN npm ci --only=production --silent && \
    npm cache clean --force && \
    mv node_modules ../

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

# Use non-root user
USER nodejs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/ping', (r) => {r.statusCode===200 ? process.exit(0) : process.exit(1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["node", "src/index.js"]
```

**Timeline**: Immediate

---

### 9. **No Logging Strategy** 🔴 DEPLOYMENT CRITICAL
**Impact**: Cannot debug production issues  

**Install Winston/Pino**:
```bash
npm install winston
# OR
npm install pino
```

**Create**: `BACKEND/src/utils/logger.js`
```javascript
import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        ...(process.env.NODE_ENV !== 'production' && [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        ])
    ]
});

export default logger;
```

**Replace console.log with logger.info()** throughout codebase  
**Timeline**: Before deployment

---

### 10. **MongoDB Connection String Not Secured** 🔴 DEPLOYMENT CRITICAL
**Current**: Uses plain `MONGODB_URL` environment variable  
**Risk**: If compromised, entire database exposed

**Add Connection Security**:
```javascript
// BACKEND/src/db/index.js
const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL;
        
        if (!mongoUrl) {
            throw new Error('MONGODB_URL is not defined');
        }

        const options = {
            // SSL/TLS for secure connections
            ssl: true,
            retryWrites: true,
            w: "majority",
            // Connection pooling
            maxPoolSize: 10,
            minPoolSize: 5,
            socketTimeoutMS: 45000,
            // Timeout settings
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        };

        const dbName = process.env.NODE_ENV === 'test' ? `${DB_NAME}-test` : DB_NAME;
        const connectionInstance = await mongoose.connect(mongoUrl, options);
        
        console.log(`MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        return connectionInstance;
    } catch (error) {
        console.error("MONGODB connection FAILED", error.message);
        process.exit(1);
    }
};
```

**Timeline**: Immediate

---

## 📊 MEDIUM PRIORITY (Should Fix Before Production)

### 11. **No HTTPS/TLS Configuration** 
**Impact**: Man-in-the-middle attacks  
**Action**: Configure HTTPS in production (use reverse proxy like Nginx)

### 12. **Missing API Documentation**
**Action**: Add OpenAPI/Swagger documentation
```bash
npm install swagger-jsdoc swagger-ui-express
```

### 13. **No Input Size Limits Beyond Request Body**
**Action**: Add limits for file uploads in multer middleware

### 14. **Database Indexing Not Verified**
**Action**: Verify indexes on frequently queried fields (username, email, userId)

### 15. **No Database Backups Strategy**
**Action**: Set up automated MongoDB backups (MongoDB Atlas auto-backup recommended)

### 16. **Missing CSRF Protection** (if using cookies)
**Action**: Implement CSRF tokens for state-changing operations

### 17. **No Database Connection Pooling Optimization**
**Action**: Tune MongoDB connection pool settings

### 18. **Environment-Specific Configurations**
**Action**: Create separate configs for dev/staging/production

### 19. **Missing Performance Monitoring**
**Action**: Add APM tools (New Relic, DataDog, or similar)

### 20. **No API Versioning Strategy**
**Action**: Implement API versioning (/api/v1/ vs /api/v2/)

### 21. **Frontend Security: Missing Security Headers**
**Action**: Configure proper security headers in Next.js

### 22. **Redis Connection Not Hardened**
**Action**: Add authentication to Redis in production

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Security (Week 1)
- [ ] 1. Revoke exposed API key
- [ ] 2. Create .env.example template
- [ ] 3. Fix CORS configuration (environment variable)
- [ ] 4. Add JWT secret validation
- [ ] 5. Implement global error handler
- [ ] 6. Add rate limiting
- [ ] 7. Add request validation & sanitization
- [ ] 8. Update Dockerfile to production standards
- [ ] 9. Setup logging (Winston/Pino)
- [ ] 10. Secure MongoDB connections

### Phase 2: Deployment Infrastructure (Week 2)
- [ ] Prepare environment variable management system
- [ ] Setup Docker Compose with proper networking
- [ ] Test Docker build and run processes
- [ ] Configure health checks
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Configure reverse proxy (Nginx/Caddy)
- [ ] Setup SSL/TLS certificates
- [ ] Test all critical endpoints

### Phase 3: Monitoring & Operations (Week 3)
- [ ] Setup logging aggregation
- [ ] Configure monitoring & alerting
- [ ] Setup automated backups
- [ ] Document runbooks for common issues
- [ ] Conduct security audit/penetration testing
- [ ] Performance testing & load testing
- [ ] Disaster recovery plan

### Phase 4: Go-Live (Week 4)
- [ ] Final security review
- [ ] Production environment setup
- [ ] Health check all services
- [ ] Monitor for 24-48 hours
- [ ] Document deployment steps
- [ ] Team training on operations

---

## 🔧 Quick Start Implementation Order

**Today (Critical)**:
1. Revoke GEMINI_API_KEY
2. Fix CORS origin to use env var
3. Add JWT secret validation
4. Create .env.example

**This Week**:
5. Implement error handler middleware
6. Add rate limiting
7. Add request sanitization
8. Update Dockerfile
9. Add comprehensive logging
10. Secure MongoDB connection

**Next Week**:
11-22. Medium priority improvements

---

## 🚀 Deployment Target Checklist

Before going to production, ensure:

- [ ] All environment variables are set correctly
- [ ] Database backups are configured
- [ ] Logging system is working
- [ ] Health check endpoints respond
- [ ] Rate limiting is active
- [ ] Error handling is comprehensive
- [ ] CORS is properly restricted
- [ ] JWT secrets are strong and random
- [ ] SSL/TLS is enforced
- [ ] CI/CD pipeline is configured
- [ ] Monitoring & alerting is active
- [ ] API documentation is complete
- [ ] Security headers are set
- [ ] Database indexes are created
- [ ] Disaster recovery plan is documented

---

## 📞 Next Steps

1. **Review this plan** with your team
2. **Start Phase 1** implementations immediately
3. **Use the TODO items** as your daily checklist
4. **Set deadline**: Target production deployment in 3-4 weeks

---

**Document Version**: 1.0  
**Last Updated**: March 30, 2026  
**Next Review**: Daily during implementation phase
