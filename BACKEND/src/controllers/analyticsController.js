/**
 * Analytics Controller
 * Handles analytics event collection from frontend
 */

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import structuredLogger from '../utils/structuredLogger.js';
import { validateEventBatch, PLAYBACK_EVENT_TYPES } from '../schemas/eventSchemas.js';
import { sendBatchEvents } from '../../ingestion/kafka-producers/videoEventProducer.js';

/**
 * Track playback analytics events
 * Receives batch of events from frontend player
 */
export const trackPlaybackEvents = asyncHandler(async (req, res) => {
  const { events } = req.body;
  const sessionId = req.headers['x-session-id'];

  if (!events || !Array.isArray(events)) {
    throw new ApiError(400, 'Events array required');
  }

  if (!sessionId) {
    throw new ApiError(400, 'Session ID required');
  }

  req.correlationIds.sessionId = sessionId;

  // Validate events
  const { valid, invalid } = validateEventBatch(events, 'playback');

  if (invalid.length > 0) {
    structuredLogger.warn('Invalid events in batch', req.correlationIds, {
      totalEvents: events.length,
      validCount: valid.length,
      invalidCount: invalid.length,
    });
  }

  // Send valid events to Kafka
  const kafkaTopic = process.env.KAFKA_SESSIONS_TOPIC || 'video-sessions';

  if (valid.length > 0) {
    const sent = await sendBatchEvents(kafkaTopic, valid, req.correlationIds);

    if (sent) {
      structuredLogger.info('Analytics events sent to Kafka', req.correlationIds, {
        eventCount: valid.length,
        topic: kafkaTopic,
      });
    } else {
      structuredLogger.warn('Failed to send events to Kafka', req.correlationIds, {
        eventCount: valid.length,
      });
    }
  }

  return res.status(200).json(
    new ApiResponse(200, {
      received: events.length,
      processed: valid.length,
      failed: invalid.length,
    }, 'Events processed')
  );
});

/**
 * Get analytics summary for a video
 */
export const getVideoAnalytics = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // This would query aggregated analytics from MongoDB
  // For now, return placeholder
  
  return res.status(200).json(
    new ApiResponse(200, {
      videoId,
      viewCount: 0,
      watchTime: 0,
      avgCompletion: 0,
    }, 'Analytics retrieved')
  );
});

export default {
  trackPlaybackEvents,
  getVideoAnalytics,
};
