/**
 * React Hook for Playback Analytics
 */

import { useEffect, useRef, useCallback } from 'react';
import { getPlaybackAnalytics } from '../utils/PlaybackAnalytics';
import { getSessionManager } from '../utils/SessionManager';

interface UsePlaybackAnalyticsProps {
  videoId: string;
  userId?: string;
  onEventTracked?: (eventType: string) => void;
}

export function usePlaybackAnalytics({
  videoId,
  userId,
  onEventTracked,
}: UsePlaybackAnalyticsProps) {
  const analyticsRef = useRef(getPlaybackAnalytics());
  const sessionRef = useRef(getSessionManager());
  const userIdRef = useRef(userId || 'anonymous');
  const progressMilestonesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    userIdRef.current = userId || 'anonymous';

    // Set context
    if (userId) {
      sessionRef.current.setUserId(userId);
    }
    sessionRef.current.setVideoId(videoId);
    progressMilestonesRef.current.clear();

    // Track video started
    analyticsRef.current.trackEvent('video_started', videoId, userIdRef.current, {});

    onEventTracked?.('video_started');

    // Cleanup: flush on unmount
    return () => {
      analyticsRef.current.flush();
    };
  }, [videoId, userId, onEventTracked]);

  /**
   * Track playback event
   */
  const trackEvent = useCallback(
    (eventType: string, data: Record<string, any> = {}) => {
      sessionRef.current.updateActivity();
      analyticsRef.current.trackEvent(eventType, videoId, userIdRef.current, data);
      onEventTracked?.(eventType);
    },
    [videoId, onEventTracked]
  );

  /**
   * Track buffering
   */
  const trackBuffering = useCallback(
    (bufferingMs: number) => {
      trackEvent('buffering_started', {
        bufferingDurationMs: bufferingMs,
      });
    },
    [trackEvent]
  );

  /**
   * Track quality change
   */
  const trackQualityChange = useCallback(
    (quality: string) => {
      if (!['240p', '480p', '720p', '1080p'].includes(quality)) {
        return;
      }

      trackEvent('quality_changed', {
        qualitySelected: quality,
      });
    },
    [trackEvent]
  );

  /**
   * Track watch progress
   */
  const trackProgress = useCallback(
    (watchPercent: number, currentTime: number) => {
      const milestone = Math.floor(watchPercent / 10) * 10;
      if (milestone <= 0 || milestone >= 100 || progressMilestonesRef.current.has(milestone)) {
        return;
      }
      progressMilestonesRef.current.add(milestone);
      trackEvent('watch_progress', {
        watchPercent: milestone,
        currentTime,
      });
    },
    [trackEvent]
  );

  /**
   * Track completion
   */
  const trackCompletion = useCallback(
    (watchPercent: number) => {
      trackEvent('video_completed', {
        watchPercent,
        sessionDuration: sessionRef.current.getDuration(),
      });
    },
    [trackEvent]
  );

  /**
   * Track error
   */
  const trackError = useCallback(
    (errorMessage: string) => {
      trackEvent('playback_error', {
        errorMessage,
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackBuffering,
    trackQualityChange,
    trackProgress,
    trackCompletion,
    trackError,
    sessionId: sessionRef.current.getSessionId(),
  };
}

export default usePlaybackAnalytics;
