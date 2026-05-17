/**
 * Session Manager
 * Manages user session tracking and context
 */

import { v4 as uuidv4 } from 'uuid';

interface SessionInfo {
  sessionId: string;
  userId?: string;
  videoId?: string;
  startTime: number;
  lastActivity: number;
}

class SessionManager {
  private session: SessionInfo;
  private inactivityTimeout: NodeJS.Timeout | null = null;
  private readonly INACTIVITY_TTL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.session = {
      sessionId: uuidv4(),
      startTime: Date.now(),
      lastActivity: Date.now(),
    };

    this.setupInactivityTimer();
  }

  /**
   * Set user ID
   */
  setUserId(userId: string) {
    this.session.userId = userId;
    this.updateActivity();
  }

  /**
   * Set video ID
   */
  setVideoId(videoId: string) {
    this.session.videoId = videoId;
    this.updateActivity();
  }

  /**
   * Update last activity timestamp
   */
  updateActivity() {
    this.session.lastActivity = Date.now();
  }

  /**
   * Setup inactivity timer
   */
  private setupInactivityTimer() {
    if (typeof window === 'undefined') return;

    const resetTimer = () => {
      if (this.inactivityTimeout) {
        clearTimeout(this.inactivityTimeout);
      }

      this.inactivityTimeout = setTimeout(() => {
        this.resetSession();
      }, this.INACTIVITY_TTL);
    };

    // Reset timer on user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();
  }

  /**
   * Get current session
   */
  getSession(): SessionInfo {
    return { ...this.session };
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.session.sessionId;
  }

  /**
   * Get duration in milliseconds
   */
  getDuration(): number {
    return Date.now() - this.session.startTime;
  }

  /**
   * Reset session
   */
  resetSession() {
    this.session = {
      sessionId: uuidv4(),
      userId: this.session.userId,
      startTime: Date.now(),
      lastActivity: Date.now(),
    };
  }
}

// Singleton instance
let instance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!instance) {
    instance = new SessionManager();
  }
  return instance;
}

export default SessionManager;
