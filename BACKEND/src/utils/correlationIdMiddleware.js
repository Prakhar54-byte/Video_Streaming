/**
 * Correlation ID Middleware
 * Generates and tracks correlation IDs for request tracing
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate correlation ID middleware
 * Attaches correlation IDs to each request for tracking
 */
export const correlationIdMiddleware = (req, res, next) => {
  // Initialize correlation IDs object
  req.correlationIds = {
    requestId: req.headers['x-request-id'] || uuidv4(),
    videoId: req.params.videoId || req.body?.videoId || null,
    userId: req.user?._id?.toString() || null,
    sessionId: req.headers['x-session-id'] || req.cookies?.sessionId || null,
    jobId: null,
  };

  // Set request ID in response header for client tracking
  res.setHeader('x-request-id', req.correlationIds.requestId);

  // Add helper methods to request
  req.setVideoId = (videoId) => {
    req.correlationIds.videoId = videoId;
  };

  req.setJobId = (jobId) => {
    req.correlationIds.jobId = jobId;
  };

  req.setSessionId = (sessionId) => {
    req.correlationIds.sessionId = sessionId;
  };

  next();
};

/**
 * Request logging middleware
 * Logs all requests with correlation IDs
 */
export const requestLoggingMiddleware = (logger) => (req, res, next) => {
  const startTime = Date.now();

  // Log request start
  logger.info(`${req.method} ${req.path}`, req.correlationIds, {
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length ? req.query : undefined,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  // Hook into response to log completion
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;
    const status = res.statusCode;

    logger.info(`${req.method} ${req.path} completed`, req.correlationIds, {
      method: req.method,
      path: req.path,
      status,
      duration: `${duration}ms`,
      responseSize: JSON.stringify(data).length,
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Error correlation middleware
 * Attaches correlation IDs to errors
 */
export const errorCorrelationMiddleware = (logger) => (err, req, res, next) => {
  const correlationIds = req.correlationIds || { requestId: uuidv4() };

  // Attach to error for logging
  err.correlationIds = correlationIds;

  // Log error with correlation
  logger.error(`Request error: ${err.message}`, correlationIds, {
    errorCode: err.code || 'INTERNAL_ERROR',
    status: err.status || 500,
    stack: err.stack,
  });

  next(err);
};

export default {
  correlationIdMiddleware,
  requestLoggingMiddleware,
  errorCorrelationMiddleware,
};
