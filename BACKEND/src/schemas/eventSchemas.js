/**
 * Event Schema Definitions & Validation
 * Standardized event types for video processing and analytics
 */

import Joi from 'joi';

// ==================== EVENT TYPE ENUMS ====================
export const VIDEO_EVENT_TYPES = {
  // Video Lifecycle Events
  UPLOADED: 'video.uploaded',
  PROCESSING_STARTED: 'video.processing.started',
  PROCESSING_COMPLETED: 'video.processing.completed',
  PROCESSING_FAILED: 'video.processing.failed',
  READY: 'video.ready',
};

export const PLAYBACK_EVENT_TYPES = {
  // User Playback Analytics
  STARTED: 'video_started',
  BUFFERING_STARTED: 'buffering_started',
  BUFFERING_ENDED: 'buffering_ended',
  QUALITY_CHANGED: 'quality_changed',
  WATCH_PROGRESS: 'watch_progress',
  COMPLETED: 'video_completed',
  SEEK: 'seek',
  ERROR: 'playback_error',
};

// ==================== VIDEO EVENT SCHEMA ====================
export const videoEventSchema = Joi.object({
  eventType: Joi.string()
    .valid(...Object.values(VIDEO_EVENT_TYPES))
    .required()
    .description('Type of video processing event'),

  videoId: Joi.string()
    .required()
    .description('Unique video identifier'),

  userId: Joi.string()
    .required()
    .description('ID of user who owns the video'),

  timestamp: Joi.date()
    .iso()
    .required()
    .default(() => new Date())
    .description('Event timestamp in ISO format'),

  duration: Joi.number()
    .optional()
    .min(0)
    .description('Video duration in seconds'),

  processingTimeMs: Joi.number()
    .optional()
    .min(0)
    .description('Time taken to process video in milliseconds'),

  quality: Joi.object({
    format: Joi.string().valid('240p', '480p', '720p', '1080p').required(),
    duration: Joi.number().required(),
    fileSizeMb: Joi.number().optional(),
    bitrate: Joi.string().optional(),
  }).optional()
    .description('Output quality information'),

  errorMessage: Joi.string()
    .optional()
    .max(500)
    .description('Error message if processing failed'),

  errorCode: Joi.string()
    .optional()
    .description('Standardized error code'),

  retryCount: Joi.number()
    .optional()
    .min(0)
    .description('Number of retry attempts'),

  metadata: Joi.object({
    requestId: Joi.string().required().description('Unique request identifier'),
    jobId: Joi.string().optional().description('Job queue ID'),
    workerInstance: Joi.string().optional().description('Worker that processed this'),
  }).required()
    .description('Correlation and tracking metadata'),
});

// ==================== PLAYBACK EVENT SCHEMA ====================
export const playbackEventSchema = Joi.object({
  eventType: Joi.string()
    .valid(...Object.values(PLAYBACK_EVENT_TYPES))
    .required()
    .description('Type of playback event'),

  sessionId: Joi.string()
    .required()
    .description('Unique session identifier for this playback'),

  videoId: Joi.string()
    .required()
    .description('Video being watched'),

  userId: Joi.string()
    .required()
    .description('User watching the video'),

  timestamp: Joi.date()
    .iso()
    .required()
    .default(() => new Date())
    .description('Event timestamp'),

  data: Joi.object({
    watchPercent: Joi.number().optional().min(0).max(100).description('Watched percentage'),
    qualitySelected: Joi.string().optional().valid('240p', '480p', '720p', '1080p'),
    bufferingDurationMs: Joi.number().optional().min(0),
    rebufferCount: Joi.number().optional().min(0),
    errorMessage: Joi.string().optional(),
    seekFromPercent: Joi.number().optional().min(0).max(100),
    seekToPercent: Joi.number().optional().min(0).max(100),
    fps: Joi.number().optional(),
    droppedFrames: Joi.number().optional(),
  }).required()
    .description('Event-specific data'),

  deviceInfo: Joi.object({
    userAgent: Joi.string().optional(),
    platform: Joi.string().optional(),
    deviceType: Joi.string().optional().valid('mobile', 'tablet', 'desktop'),
    browserName: Joi.string().optional(),
    browserVersion: Joi.string().optional(),
  }).optional()
    .description('Device information'),

  networkInfo: Joi.object({
    bandwidth: Joi.number().optional().description('Bandwidth in Mbps'),
    connectionType: Joi.string().optional().valid('wifi', 'cellular', '4g', '5g', 'ethernet'),
    latency: Joi.number().optional().description('Network latency in ms'),
  }).optional()
    .description('Network information'),

  metadata: Joi.object({
    sessionId: Joi.string().required(),
    requestId: Joi.string().optional(),
  }).required()
    .description('Correlation metadata'),
});

// ==================== FACTORY FUNCTIONS ====================

/**
 * Create and validate a video event
 * @param {string} eventType - Type of event
 * @param {object} data - Event data
 * @returns {object} Validated video event
 * @throws {Error} If validation fails
 */
export function createVideoEvent(eventType, data) {
  const event = {
    eventType,
    timestamp: new Date().toISOString(),
    metadata: {
      requestId: data.metadata?.requestId || generateUUID(),
      ...data.metadata,
    },
    ...data,
  };

  const { error, value } = videoEventSchema.validate(event, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const err = new Error(`Invalid video event: ${error.details[0].message}`);
    err.code = 'INVALID_VIDEO_EVENT';
    err.details = error.details;
    throw err;
  }

  return value;
}

/**
 * Create and validate a playback event
 * @param {string} eventType - Type of event
 * @param {object} data - Event data
 * @returns {object} Validated playback event
 * @throws {Error} If validation fails
 */
export function createPlaybackEvent(eventType, data) {
  const event = {
    eventType,
    timestamp: new Date().toISOString(),
    ...data,
  };

  const { error, value } = playbackEventSchema.validate(event, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const err = new Error(`Invalid playback event: ${error.details[0].message}`);
    err.code = 'INVALID_PLAYBACK_EVENT';
    err.details = error.details;
    throw err;
  }

  return value;
}

/**
 * Validate batch of events
 * @param {array} events - Array of events to validate
 * @param {string} type - 'video' or 'playback'
 * @returns {object} { valid: array, invalid: array }
 */
export function validateEventBatch(events, type = 'playback') {
  const schema = type === 'video' ? videoEventSchema : playbackEventSchema;
  const valid = [];
  const invalid = [];

  for (const event of events) {
    const { error, value } = schema.validate(event, {
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      invalid.push({ event, error: error.details[0].message });
    } else {
      valid.push(value);
    }
  }

  return { valid, invalid };
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate UUID v4
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get all event types
 */
export function getAllEventTypes() {
  return {
    video: Object.values(VIDEO_EVENT_TYPES),
    playback: Object.values(PLAYBACK_EVENT_TYPES),
  };
}

/**
 * Check if event type is valid
 */
export function isValidEventType(eventType, type = null) {
  if (type === 'video') {
    return Object.values(VIDEO_EVENT_TYPES).includes(eventType);
  }
  if (type === 'playback') {
    return Object.values(PLAYBACK_EVENT_TYPES).includes(eventType);
  }
  return (
    Object.values(VIDEO_EVENT_TYPES).includes(eventType) ||
    Object.values(PLAYBACK_EVENT_TYPES).includes(eventType)
  );
}

export default {
  VIDEO_EVENT_TYPES,
  PLAYBACK_EVENT_TYPES,
  videoEventSchema,
  playbackEventSchema,
  createVideoEvent,
  createPlaybackEvent,
  validateEventBatch,
  generateUUID,
  getAllEventTypes,
  isValidEventType,
};
