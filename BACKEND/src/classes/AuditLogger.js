import { AuditLog } from "../models/auditLog.model.js";
import { SecurityEvent } from "../models/securityEvent.model.js";

/**
 * AuditLogger Class - Comprehensive event logging
 * Logs all important actions for compliance and debugging
 * 
 * Usage:
 *   const logger = new AuditLogger();
 *   await logger.logUserLogin(userId, ipAddress, "SUCCESS");
 *   await logger.logVideoUpload(userId, videoId, adminId);
 *   const logs = await logger.getLogsForUser(userId);
 */
export class AuditLogger {
    constructor() {
        this.LOG_ACTIONS = {
            LOGIN: "LOGIN",
            LOGOUT: "LOGOUT",
            OAUTH_LOGIN: "OAUTH_LOGIN",
            PASSWORD_CHANGE: "PASSWORD_CHANGE",
            FAILED_LOGIN: "FAILED_LOGIN",
            VIDEO_UPLOAD: "VIDEO_UPLOAD",
            VIDEO_DELETE: "VIDEO_DELETE",
            USER_CREATED: "USER_CREATED",
            USER_UPDATED: "USER_UPDATED",
            USER_BANNED: "USER_BANNED",
            CONTENT_FLAGGED: "CONTENT_FLAGGED",
            API_KEY_CREATED: "API_KEY_CREATED",
            API_KEY_DELETED: "API_KEY_DELETED",
            ADMIN_ACTION: "ADMIN_ACTION",
            PERMISSION_DENIED: "PERMISSION_DENIED",
            RATE_LIMIT_HIT: "RATE_LIMIT_HIT"
        };
    }

    // ==================== LOGIN/LOGOUT ====================
    /**
     * Log user login
     */
    async logUserLogin(userId, ipAddress, userAgent = "", status = "SUCCESS") {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.LOGIN,
                userId,
                resourceType: "SECURITY",
                description: `User login${status === "SUCCESS" ? "" : " attempt failed"}`,
                ipAddress,
                userAgent,
                status,
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log login:", error.message);
        }
    }

    /**
     * Log user logout
     */
    async logUserLogout(userId, ipAddress) {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.LOGOUT,
                userId,
                resourceType: "SECURITY",
                description: "User logout",
                ipAddress,
                status: "SUCCESS",
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log logout:", error.message);
        }
    }

    /**
     * Log OAuth login
     */
    async logOAuthLogin(userId, provider, ipAddress) {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.OAUTH_LOGIN,
                userId,
                resourceType: "SECURITY",
                description: `OAuth login via ${provider}`,
                ipAddress,
                details: { provider },
                status: "SUCCESS",
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log OAuth login:", error.message);
        }
    }

    /**
     * Log failed login attempt
     */
    async logFailedLogin(email, ipAddress, userAgent = "", reason = "Invalid credentials") {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.FAILED_LOGIN,
                resourceType: "SECURITY",
                description: `Failed login attempt for ${email}`,
                details: { email, reason },
                ipAddress,
                userAgent,
                status: "FAILED",
                severity: "MEDIUM",
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log failed login:", error.message);
        }
    }

    // ==================== VIDEO OPERATIONS ====================
    /**
     * Log video upload
     */
    async logVideoUpload(userId, videoId, filename, size, ipAddress) {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.VIDEO_UPLOAD,
                userId,
                resourceType: "VIDEO",
                resourceId: videoId,
                description: `Video uploaded: ${filename}`,
                details: { filename, fileSize: size },
                ipAddress,
                status: "SUCCESS",
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log video upload:", error.message);
        }
    }

    /**
     * Log video deletion
     */
    async logVideoDelete(videoId, userId, adminId = null) {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.VIDEO_DELETE,
                userId,
                adminId,
                resourceType: "VIDEO",
                resourceId: videoId,
                description: `Video deleted ${adminId ? "(by admin)" : ""}`,
                status: "SUCCESS",
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log video delete:", error.message);
        }
    }

    // ==================== USER MANAGEMENT ====================
    /**
     * Log user creation
     */
    async logUserCreated(userId, adminId, method = "email") {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.USER_CREATED,
                userId,
                adminId: adminId || null,
                resourceType: "USER",
                resourceId: userId,
                description: `New user created via ${method}`,
                details: { method },
                status: "SUCCESS",
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log user creation:", error.message);
        }
    }

    /**
     * Log user ban
     */
    async logUserBan(userId, adminId, reason = "") {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.USER_BANNED,
                userId,
                adminId,
                resourceType: "USER",
                resourceId: userId,
                description: `User banned: ${reason}`,
                details: { reason },
                status: "SUCCESS",
                severity: "HIGH",
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log user ban:", error.message);
        }
    }

    /**
     * Log password change
     */
    async logPasswordChange(userId, ipAddress) {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.PASSWORD_CHANGE,
                userId,
                resourceType: "SECURITY",
                description: "Password changed",
                ipAddress,
                status: "SUCCESS",
                severity: "HIGH",
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log password change:", error.message);
        }
    }

    // ==================== CONTENT MODERATION ====================
    /**
     * Log content flag
     */
    async logContentFlagged(videoId, reportedBy, reason, adminId = null) {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.CONTENT_FLAGGED,
                userId: reportedBy,
                adminId,
                resourceType: "VIDEO",
                resourceId: videoId,
                description: `Video flagged: ${reason}`,
                details: { reason },
                status: "SUCCESS",
                severity: "MEDIUM",
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log content flag:", error.message);
        }
    }

    // ==================== ADMIN OPERATIONS ====================
    /**
     * Log admin action
     */
    async logAdminAction(adminId, action, resourceType, resourceId, description, details = {}) {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.ADMIN_ACTION,
                adminId,
                resourceType,
                resourceId,
                description,
                details,
                status: "SUCCESS",
                severity: "HIGH",
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log admin action:", error.message);
        }
    }

    /**
     * Log permission denied
     */
    async logPermissionDenied(userId, action, resource, reason, ipAddress) {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.PERMISSION_DENIED,
                userId,
                resourceType: resource,
                description: `Permission denied: ${action} on ${resource} (${reason})`,
                details: { action, resource, reason },
                ipAddress,
                status: "FAILED",
                severity: "MEDIUM",
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log permission denied:", error.message);
        }
    }

    /**
     * Log rate limit hit
     */
    async logRateLimitHit(userId, ipAddress, endpoint, limit, window) {
        try {
            const auditLog = new AuditLog({
                action: this.LOG_ACTIONS.RATE_LIMIT_HIT,
                userId: userId || null,
                resourceType: "API",
                description: `Rate limit exceeded: ${limit} requests in ${window}s on ${endpoint}`,
                details: { endpoint, limit, window },
                ipAddress,
                status: "FAILED",
                severity: "LOW",
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to log rate limit hit:", error.message);
        }
    }

    // ==================== QUERY OPERATIONS ====================
    /**
     * Get audit logs for user
     */
    async getLogsForUser(userId, limit = 50, skip = 0) {
        try {
            const logs = await AuditLog.find({ userId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .skip(skip);
            const total = await AuditLog.countDocuments({ userId });
            return { logs, total };
        } catch (error) {
            console.error("Failed to get user logs:", error.message);
            return { logs: [], total: 0 };
        }
    }

    /**
     * Get audit logs by action
     */
    async getLogsByAction(action, limit = 50, skip = 0) {
        try {
            const logs = await AuditLog.find({ action })
                .sort({ timestamp: -1 })
                .limit(limit)
                .skip(skip);
            const total = await AuditLog.countDocuments({ action });
            return { logs, total };
        } catch (error) {
            console.error("Failed to get logs by action:", error.message);
            return { logs: [], total: 0 };
        }
    }

    /**
     * Get recent security events
     */
    async getSecurityEvents(severity = null, limit = 50) {
        try {
            const query = severity ? { severity } : {};
            const events = await SecurityEvent.find(query)
                .sort({ timestamp: -1 })
                .limit(limit);
            return events;
        } catch (error) {
            console.error("Failed to get security events:", error.message);
            return [];
        }
    }

    /**
     * Get failed logins for IP
     */
    async getFailedLoginsForIP(ipAddress, timeWindowMinutes = 60) {
        try {
            const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
            const logs = await AuditLog.find({
                action: this.LOG_ACTIONS.FAILED_LOGIN,
                ipAddress,
                timestamp: { $gte: timeWindow }
            }).sort({ timestamp: -1 });
            return logs;
        } catch (error) {
            console.error("Failed to get login attempts:", error.message);
            return [];
        }
    }

    /**
     * Export audit logs to CSV (admin feature)
     */
    async exportLogsToCSV(filters = {}, limit = 10000) {
        try {
            const logs = await AuditLog.find(filters).limit(limit);
            
            // Convert to CSV format
            const csvHeader = "Timestamp,Action,User ID,Admin ID,Resource Type,Description,IP Address,Status\n";
            const csvRows = logs.map(log => 
                `"${log.timestamp}","${log.action}","${log.userId || ""}","${log.adminId || ""}","${log.resourceType}","${log.description}","${log.ipAddress}","${log.status}"`
            ).join("\n");
            
            return csvHeader + csvRows;
        } catch (error) {
            console.error("Failed to export logs:", error.message);
            return null;
        }
    }
}
