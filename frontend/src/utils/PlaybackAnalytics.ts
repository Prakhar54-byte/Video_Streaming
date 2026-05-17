/**
 * Playback Analytics Collector
 * Collects and buffers playback events from video player
 */

import { v4 as uuidv4 } from 'uuid';

type AnalyticsEventData = Record<string, string | number | boolean | null | undefined>;

interface PlaybackEvent {
  sessionId: string;
  eventType: string;
  videoId: string;
  userId: string;
  timestamp: string;
  data: AnalyticsEventData;
  deviceInfo: {
    userAgent: string;
    platform: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
  };
  metadata: {
    sessionId: string;
    requestId: string;
  };
}

class PlaybackAnalytics {
  private sessionId: string;
  private events: PlaybackEvent[];
  private flushInterval: number;
  private flushSize: number;
  private isEnabled: boolean;
  private endpoint: string;
  private isProcessing: boolean;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.sessionId = uuidv4();
    this.events = [];
    this.flushInterval = parseInt(process.env.NEXT_PUBLIC_ANALYTICS_BATCH_INTERVAL || '10000', 10);
    this.flushSize = parseInt(process.env.NEXT_PUBLIC_ANALYTICS_BATCH_SIZE || '50', 10);
    this.isEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false';
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1';
    this.endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || `${backendBase.replace(/\/$/, '')}/analytics/track`;
    this.isProcessing = false;

    if (this.isEnabled) {
      this.startAutoFlush();
    }
  }

  /**
   * Start periodic flush of events
   */
  startAutoFlush() {
    if (typeof window === 'undefined' || this.flushTimer) return;
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  /**
   * Track a playback event
   */
  trackEvent(eventType: string, videoId: string, userId: string, data: AnalyticsEventData = {}) {
    if (!this.isEnabled) return;

    const event = {
      sessionId: this.sessionId,
      eventType,
      videoId,
      userId,
      timestamp: new Date().toISOString(),
      data,
      deviceInfo: this.getDeviceInfo(),
      metadata: {
        sessionId: this.sessionId,
        requestId: uuidv4(),
      },
    };

    this.events.push(event);

    // Flush if buffer exceeds size
    if (this.events.length >= this.flushSize) {
      this.flush();
    }
  }

  /**
   * Flush buffered events to server
   */
  async flush() {
    if (this.events.length === 0 || this.isProcessing) return;

    this.isProcessing = true;
    const eventsToSend = [...this.events];
    this.events = [];

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId,
        },
        body: JSON.stringify({ events: eventsToSend }),
      });

      if (!response.ok) {
        // Re-queue events on error
        this.events = [...eventsToSend, ...this.events];
      }
    } catch (error) {
      // Network error: re-queue events
      this.events = [...eventsToSend, ...this.events];
      console.error('Analytics flush failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get current session ID
   */
  getSessionId() {
    return this.sessionId;
  }

  /**
   * Reset session (for logout or new session)
   */
  resetSession() {
    this.flush();
    this.sessionId = uuidv4();
  }

  /**
   * Build backend-compatible device info
   */
  private getDeviceInfo(): PlaybackEvent['deviceInfo'] {
    if (typeof navigator === 'undefined') {
      return {
        userAgent: 'unknown',
        platform: 'unknown',
        deviceType: 'desktop',
      };
    }

    const userAgent = navigator.userAgent;
    const isTablet = /ipad|tablet/i.test(userAgent);
    const isMobile = !isTablet && /mobi|android|iphone|ipod/i.test(userAgent);

    return {
      userAgent,
      platform: navigator.platform || 'unknown',
      deviceType: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
    };
  }
}

// Singleton instance
let instance: PlaybackAnalytics | null = null;

export function getPlaybackAnalytics() {
  if (!instance) {
    instance = new PlaybackAnalytics();
  }
  return instance;
}

export default PlaybackAnalytics;
