/**
 * Structured Logger Wrapper
 * Enhances Winston with structured logging and correlation IDs
 */

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

// ==================== STRUCTURED LOG FORMAT ====================
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, correlationIds, context, service, ...rest }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      service: service || 'video-streaming-backend',
      correlationIds: correlationIds || {},
      context: context || {},
      ...rest,
    };
    return JSON.stringify(logEntry);
  })
);

// ==================== CREATE BASE LOGGER ====================
const baseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'video-streaming-backend',
  },
  transports: [
    // Error logs only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: structuredFormat,
    }),

    // All logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 20,
      format: structuredFormat,
    }),

    // Warning logs
    new winston.transports.File({
      filename: path.join(logsDir, 'warn.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: structuredFormat,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  baseLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, correlationIds, context }) => {
          const ids = correlationIds
            ? `[${correlationIds.requestId?.substring(0, 8)}]`
            : '';
          const ctx = context && Object.keys(context).length
            ? ` | ${JSON.stringify(context)}`
            : '';
          return `${timestamp} ${ids} [${level}]: ${message}${ctx}`;
        })
      ),
    })
  );
}

// ==================== STRUCTURED LOGGER CLASS ====================
class StructuredLogger {
  constructor(baseWinstonLogger) {
    this.logger = baseWinstonLogger;
  }

  /**
   * Log with correlation IDs and context
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} message - Log message
   * @param {object} correlationIds - { requestId, videoId, userId, sessionId, jobId }
   * @param {object} context - Additional context data
   */
  log(level, message, correlationIds = {}, context = {}) {
    this.logger[level](message, {
      correlationIds,
      context,
    });
  }

  /**
   * Info level log
   */
  info(message, correlationIds, context) {
    this.log('info', message, correlationIds, context);
  }

  /**
   * Warn level log
   */
  warn(message, correlationIds, context) {
    this.log('warn', message, correlationIds, context);
  }

  /**
   * Error level log
   */
  error(message, correlationIds, context) {
    this.log('error', message, correlationIds, context);
  }

  /**
   * Debug level log
   */
  debug(message, correlationIds, context) {
    this.log('debug', message, correlationIds, context);
  }

  /**
   * Log with automatic correlation ID extraction from request
   */
  logFromRequest(level, message, req, context = {}) {
    const correlationIds = req.correlationIds || {};
    this.log(level, message, correlationIds, context);
  }

  /**
   * Log API request
   */
  logRequest(req, res, duration) {
    const correlationIds = req.correlationIds || {};
    this.info(`${req.method} ${req.path}`, correlationIds, {
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
    });
  }

  /**
   * Log job lifecycle
   */
  logJobEvent(jobId, event, data = {}) {
    this.info(`Job ${event}`, { jobId }, {
      event,
      ...data,
    });
  }

  /**
   * Log metric
   */
  logMetric(metricName, value, correlationIds, tags = {}) {
    this.debug(`METRIC: ${metricName}`, correlationIds, {
      metric: metricName,
      value,
      tags,
    });
  }

  /**
   * Log error with stack trace
   */
  logError(message, error, correlationIds, context = {}) {
    this.error(message, correlationIds, {
      errorMessage: error?.message,
      errorCode: error?.code,
      errorStack: error?.stack,
      ...context,
    });
  }

  /**
   * Log processing stage
   */
  logProcessingStage(videoId, stage, duration, status = 'completed', data = {}) {
    const correlationIds = { videoId };
    this.info(`Processing stage: ${stage}`, correlationIds, {
      stage,
      duration,
      status,
      ...data,
    });
  }

  /**
   * Log Kafka event
   */
  logKafkaEvent(topic, eventType, correlationIds, data = {}) {
    this.info(`Kafka event published`, correlationIds, {
      topic,
      eventType,
      ...data,
    });
  }

  /**
   * Log analytics event
   */
  logAnalyticsEvent(sessionId, eventType, userId, data = {}) {
    this.debug(`Analytics event`, { sessionId }, {
      eventType,
      userId,
      ...data,
    });
  }
}

// ==================== EXPORT INSTANCES ====================
const structuredLogger = new StructuredLogger(baseLogger);

export default structuredLogger;
export { StructuredLogger, baseLogger };
