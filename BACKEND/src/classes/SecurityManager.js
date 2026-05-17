import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AuditLog } from "../models/auditLog.model.js";
import { SecurityEvent } from "../models/securityEvent.model.js";

/**
 * SecurityManager Class - Enterprise-grade security operations
 * Handles JWT, permissions, encryption, audit logging, threat detection
 * 
 * Usage:
 *   const secMgr = new SecurityManager();
 *   const token = secMgr.generateAccessToken(userId);
 *   const isValid = secMgr.verifyToken(token);
 */
export class SecurityManager {
    constructor() {
        this.ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
        this.REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
        this.JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || "your-secret-key";
        this.ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || "default-key", "salt", 32);
    }

    // ==================== JWT OPERATIONS ====================
    /**
     * Generate access token (short-lived, 15min default)
     */
    generateAccessToken(userId, role = "user") {
        const payload = {
            _id: userId,
            role: role,
            type: "access"
        };
        return jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.ACCESS_TOKEN_EXPIRY,
            issuer: "VideoLearningPlatform"
        });
    }

    /**
     * Generate refresh token (long-lived, 7d default)
     */
    generateRefreshToken(userId) {
        const payload = {
            _id: userId,
            type: "refresh"
        };
        return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || this.JWT_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRY,
            issuer: "VideoLearningPlatform"
        });
    }

    /**
     * Verify JWT token and return decoded payload
     */
    verifyToken(token, isRefresh = false) {
        try {
            const secret = isRefresh 
                ? (process.env.REFRESH_TOKEN_SECRET || this.JWT_SECRET)
                : this.JWT_SECRET;
            return jwt.verify(token, secret);
        } catch (error) {
            console.error("Token verification failed:", error.message);
            return null;
        }
    }

    /**
     * Decode token without verification (for debugging)
     */
    decodeToken(token) {
        return jwt.decode(token);
    }

    // ==================== ENCRYPTION OPERATIONS ====================
    /**
     * Encrypt sensitive string (used for API keys, tokens)
     */
    encryptData(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv("aes-256-cbc", this.ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(data, "utf8", "hex");
        encrypted += cipher.final("hex");
        return `${iv.toString("hex")}:${encrypted}`;
    }

    /**
     * Decrypt encrypted data
     */
    decryptData(encryptedData) {
        try {
            const [iv, encrypted] = encryptedData.split(":");
            const decipher = crypto.createDecipheriv(
                "aes-256-cbc",
                this.ENCRYPTION_KEY,
                Buffer.from(iv, "hex")
            );
            let decrypted = decipher.update(encrypted, "hex", "utf8");
            decrypted += decipher.final("utf8");
            return decrypted;
        } catch (error) {
            console.error("Decryption failed:", error.message);
            return null;
        }
    }

    /**
     * Generate random API key
     */
    generateApiKey() {
        return crypto.randomBytes(32).toString("hex");
    }

    // ==================== PERMISSION OPERATIONS ====================
    /**
     * Check if user has required role
     */
    hasRole(userRole, requiredRole) {
        const roleHierarchy = {
            admin: 3,
            moderator: 2,
            creator: 1,
            user: 0
        };
        return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(userRole, resource, action) {
        const permissions = {
            admin: {
                users: ["create", "read", "update", "delete", "ban"],
                videos: ["create", "read", "update", "delete", "moderate", "flag"],
                admin: ["read", "update", "settings"],
                audit: ["read"]
            },
            moderator: {
                videos: ["read", "flag", "moderate"],
                comments: ["read", "delete", "flag"]
            },
            creator: {
                videos: ["create", "read", "update", "delete"],
                comments: ["read"]
            },
            user: {
                videos: ["read"],
                comments: ["create", "read"]
            }
        };

        const userPerms = permissions[userRole] || {};
        return userPerms[resource]?.includes(action) || false;
    }

    // ==================== AUDIT LOGGING ====================
    /**
     * Log admin action to audit trail
     */
    async logAuditEvent(
        action,
        userId,
        resourceType,
        resourceId,
        description,
        { adminId = null, ipAddress = "unknown", userAgent = "", details = {}, status = "SUCCESS" } = {}
    ) {
        try {
            const auditLog = new AuditLog({
                action,
                userId,
                adminId,
                resourceType,
                resourceId,
                description,
                details,
                ipAddress,
                userAgent,
                status,
                timestamp: new Date()
            });
            await auditLog.save();
            return auditLog;
        } catch (error) {
            console.error("Failed to create audit log:", error.message);
        }
    }

    /**
     * Get audit logs with filtering
     */
    async getAuditLogs(filters = {}, limit = 100, skip = 0) {
        try {
            const query = {};
            if (filters.action) query.action = filters.action;
            if (filters.userId) query.userId = filters.userId;
            if (filters.severity) query.severity = filters.severity;
            if (filters.startDate || filters.endDate) {
                query.timestamp = {};
                if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
                if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
            }

            const logs = await AuditLog.find(query)
                .sort({ timestamp: -1 })
                .limit(limit)
                .skip(skip)
                .populate("userId", "username email")
                .populate("adminId", "username email");
            
            const total = await AuditLog.countDocuments(query);
            return { logs, total };
        } catch (error) {
            console.error("Failed to retrieve audit logs:", error.message);
            return { logs: [], total: 0 };
        }
    }

    // ==================== SECURITY EVENT TRACKING ====================
    /**
     * Log security incident
     */
    async logSecurityEvent(
        eventType,
        { userId = null, ipAddress = "unknown", userAgent = "", description = "", details = {}, severity = "MEDIUM" } = {}
    ) {
        try {
            const secEvent = new SecurityEvent({
                eventType,
                userId,
                ipAddress,
                userAgent,
                description,
                details,
                severity,
                timestamp: new Date()
            });
            await secEvent.save();

            // Alert if CRITICAL
            if (severity === "CRITICAL") {
                console.warn(`🚨 CRITICAL SECURITY EVENT: ${eventType} from ${ipAddress}`);
                // TODO: Send email to admins
            }
            return secEvent;
        } catch (error) {
            console.error("Failed to log security event:", error.message);
        }
    }

    /**
     * Detect brute force attack (multiple failed logins)
     */
    async detectBruteForce(ipAddress, maxAttempts = 5, timeWindowMinutes = 15) {
        try {
            const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
            const recentFailedLogins = await AuditLog.countDocuments({
                action: "FAILED_LOGIN",
                ipAddress,
                timestamp: { $gte: timeWindow }
            });

            if (recentFailedLogins >= maxAttempts) {
                await this.logSecurityEvent("BRUTE_FORCE_DETECTED", {
                    ipAddress,
                    description: `${recentFailedLogins} failed login attempts in ${timeWindowMinutes} minutes`,
                    severity: "CRITICAL",
                    details: { attemptCount: recentFailedLogins, timeWindow: timeWindowMinutes }
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error("Brute force detection failed:", error.message);
            return false;
        }
    }

    // ==================== VALIDATION ====================
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     * Requirements: min 8 chars, 1 uppercase, 1 digit, 1 special char
     */
    isStrongPassword(password) {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongRegex.test(password);
    }

    /**
     * Sanitize input to prevent XSS
     */
    sanitizeInput(input) {
        return input
            .replace(/[<>\"'&]/g, (match) => {
                const escapeMap = { "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "&": "&amp;" };
                return escapeMap[match];
            })
            .trim();
    }

    /**
     * Generate secure random token for email verification
     */
    generateVerificationToken() {
        return crypto.randomBytes(32).toString("hex");
    }
}
