/**
 * Processing Metrics Collector
 * Tracks FFmpeg processing performance and health metrics
 */

import redis from 'ioredis';
import structuredLogger from '../utils/structuredLogger.js';

class ProcessingMetricsCollector {
  constructor(redisConnection) {
    this.redis = redisConnection;
    this.metrics = new Map();
  }

  /**
   * Start tracking a processing job
   */
  async startJobTracking(jobId, videoId, userId, videoDuration) {
    const jobMetrics = {
      jobId,
      videoId,
      userId,
      videoDuration, // in seconds
      startTime: Date.now(),
      status: 'processing',
      stages: {},
      errors: [],
      retries: 0,
    };

    // Store in memory for fast access
    this.metrics.set(jobId, jobMetrics);

    // Store in Redis for dashboard access
    await this.redis.setex(
      `job:${jobId}`,
      3600, // 1 hour TTL
      JSON.stringify(jobMetrics)
    );

    structuredLogger.debug(`Job tracking started`, { jobId }, {
      videoDuration,
      userId,
    });

    return jobMetrics;
  }

  /**
   * Record a processing stage completion
   */
  async recordStage(jobId, stageName, durationMs, data = {}) {
    const jobMetrics = this.metrics.get(jobId);

    if (!jobMetrics) {
      structuredLogger.warn(`Job metrics not found for stage recording`, { jobId }, {
        stage: stageName,
      });
      return;
    }

    // Record stage
    jobMetrics.stages[stageName] = {
      name: stageName,
      duration: durationMs,
      completedAt: Date.now(),
      ...data,
    };

    // Update Redis
    await this.redis.setex(
      `job:${jobId}`,
      3600,
      JSON.stringify(jobMetrics)
    );

    structuredLogger.logProcessingStage(jobMetrics.videoId, stageName, durationMs, 'completed', {
      stage: stageName,
      ...data,
    });
  }

  /**
   * Record an error during processing
   */
  async recordError(jobId, stageName, error, isRetryable = true) {
    const jobMetrics = this.metrics.get(jobId);

    if (!jobMetrics) {
      return;
    }

    jobMetrics.errors.push({
      stage: stageName,
      message: error.message,
      code: error.code,
      timestamp: Date.now(),
      isRetryable,
    });

    if (!isRetryable) {
      jobMetrics.status = 'failed';
    } else {
      jobMetrics.retries++;
    }

    await this.redis.setex(
      `job:${jobId}`,
      3600,
      JSON.stringify(jobMetrics)
    );

    structuredLogger.error(`Processing error in ${stageName}`, { jobId }, {
      stage: stageName,
      errorMessage: error.message,
      isRetryable,
      retryCount: jobMetrics.retries,
    });
  }

  /**
   * Mark job as completed and calculate final metrics
   */
  async completeJob(jobId, status = 'completed', finalData = {}) {
    const jobMetrics = this.metrics.get(jobId);

    if (!jobMetrics) {
      return null;
    }

    const endTime = Date.now();
    const totalDuration = endTime - jobMetrics.startTime;

    // Calculate metrics
    const processingSpeedRatio = totalDuration / (jobMetrics.videoDuration * 1000);
    const totalQueueWait = jobMetrics.stages['queued']?.duration || 0;
    const totalProcessing = totalDuration - totalQueueWait;

    const finalMetrics = {
      ...jobMetrics,
      status,
      endTime,
      totalDuration, // in ms
      totalDurationSeconds: Math.round(totalDuration / 1000),
      processingSpeedRatio: Math.round(processingSpeedRatio * 100) / 100,
      queueueWaitTime: totalQueueWait,
      effectiveProcessingTime: totalProcessing,
      stageCount: Object.keys(jobMetrics.stages).length,
      errorCount: jobMetrics.errors.length,
      successfulStages: Object.keys(jobMetrics.stages).length,
      ...finalData,
    };

    // Update status
    finalMetrics.healthStatus = this.calculateHealthStatus(finalMetrics);

    // Store in memory (short TTL)
    this.metrics.set(jobId, finalMetrics);

    // Store in Redis (1 day)
    await this.redis.setex(
      `job:${jobId}`,
      86400,
      JSON.stringify(finalMetrics)
    );

    // Store summary for dashboard
    await this.redis.setex(
      `job:${jobId}:summary`,
      86400,
      JSON.stringify(this.extractSummary(finalMetrics))
    );

    // Add to recent jobs list (for dashboard)
    await this.redis.lpush(`recent_jobs`, jobId);
    await this.redis.ltrim(`recent_jobs`, 0, 99); // Keep last 100

    // Record in aggregated metrics
    await this.recordAggregateMetrics(finalMetrics);

    structuredLogger.info(`Processing job completed`, { jobId }, {
      status,
      totalDuration: `${finalMetrics.totalDurationSeconds}s`,
      processingSpeedRatio: finalMetrics.processingSpeedRatio,
      errorCount: finalMetrics.errorCount,
      healthStatus: finalMetrics.healthStatus,
    });

    return finalMetrics;
  }

  /**
   * Calculate health status based on metrics
   */
  calculateHealthStatus(metrics) {
    if (metrics.status === 'failed') return 'failing';
    if (metrics.processingSpeedRatio > 2.5) return 'degraded';
    if (metrics.errorCount > 0) return 'degraded';
    if (metrics.processingSpeedRatio > 1.5) return 'slow';
    return 'healthy';
  }

  /**
   * Extract key metrics for dashboard
   */
  extractSummary(metrics) {
    return {
      jobId: metrics.jobId,
      videoId: metrics.videoId,
      status: metrics.status,
      totalDuration: metrics.totalDuration,
      processingSpeedRatio: metrics.processingSpeedRatio,
      healthStatus: metrics.healthStatus,
      errorCount: metrics.errorCount,
      timestamp: metrics.endTime,
    };
  }

  /**
   * Record aggregate metrics for monitoring
   */
  async recordAggregateMetrics(finalMetrics) {
    const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDHH

    // Increment counters
    await this.redis.incr(`metrics:jobs:total:${hour}`);
    await this.redis.incr(`metrics:jobs:${finalMetrics.status}:${hour}`);

    // Store ratio in sorted set for averaging
    await this.redis.zadd(
      `metrics:speed_ratio:${hour}`,
      Date.now(),
      finalMetrics.processingSpeedRatio
    );

    // Track processing time
    await this.redis.zadd(
      `metrics:processing_time:${hour}`,
      Date.now(),
      finalMetrics.totalDuration
    );

    // Track errors
    if (finalMetrics.errorCount > 0) {
      await this.redis.incr(`metrics:errors:total:${hour}`);
    }

    // Set TTL on hourly metrics (keep 7 days)
    await this.redis.expire(`metrics:jobs:total:${hour}`, 604800);
    await this.redis.expire(`metrics:jobs:${finalMetrics.status}:${hour}`, 604800);
    await this.redis.expire(`metrics:speed_ratio:${hour}`, 604800);
  }

  /**
   * Get job metrics
   */
  async getJobMetrics(jobId) {
    // Try memory first
    if (this.metrics.has(jobId)) {
      return this.metrics.get(jobId);
    }

    // Try Redis
    const data = await this.redis.get(`job:${jobId}`);
    if (data) {
      return JSON.parse(data);
    }

    return null;
  }

  /**
   * Get all active jobs
   */
  async getActiveJobs() {
    const jobs = [];
    for (const [jobId, metrics] of this.metrics) {
      if (metrics.status === 'processing') {
        jobs.push(metrics);
      }
    }
    return jobs;
  }

  /**
   * Get recent jobs
   */
  async getRecentJobs(limit = 10) {
    const jobIds = await this.redis.lrange(`recent_jobs`, 0, limit - 1);
    const jobs = [];

    for (const jobId of jobIds) {
      const data = await this.redis.get(`job:${jobId}:summary`);
      if (data) {
        jobs.push(JSON.parse(data));
      }
    }

    return jobs;
  }

  /**
   * Get aggregated metrics for hour
   */
  async getHourlyMetrics(hour) {
    const total = await this.redis.get(`metrics:jobs:total:${hour}`);
    const completed = await this.redis.get(`metrics:jobs:completed:${hour}`);
    const failed = await this.redis.get(`metrics:jobs:failed:${hour}`);
    const errors = await this.redis.get(`metrics:errors:total:${hour}`);

    return {
      hour,
      total: parseInt(total) || 0,
      completed: parseInt(completed) || 0,
      failed: parseInt(failed) || 0,
      errors: parseInt(errors) || 0,
      successRate: total ? Math.round(((parseInt(completed) || 0) / parseInt(total)) * 100) : 0,
    };
  }

  /**
   * Clean up old job data
   */
  async cleanup(olderThanMinutes = 1440) {
    const cutoff = Date.now() - olderThanMinutes * 60 * 1000;

    for (const [jobId, metrics] of this.metrics) {
      if (metrics.endTime && metrics.endTime < cutoff) {
        this.metrics.delete(jobId);
      }
    }

    structuredLogger.debug(`Metrics cleanup completed`, {}, {
      removedCount: this.metrics.size,
    });
  }
}

// Export singleton
let metricsCollector = null;

export function initializeMetricsCollector(redisConnection) {
  if (!metricsCollector) {
    metricsCollector = new ProcessingMetricsCollector(redisConnection);
  }
  return metricsCollector;
}

export function getMetricsCollector() {
  if (!metricsCollector) {
    throw new Error('Metrics collector not initialized. Call initializeMetricsCollector first.');
  }
  return metricsCollector;
}

export default ProcessingMetricsCollector;
