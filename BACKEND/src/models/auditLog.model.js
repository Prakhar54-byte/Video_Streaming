import mongoose, { Schema } from "mongoose";

/**
 * AuditLog Model - Comprehensive audit trail for all admin/sensitive actions
 * Tracks: user management, content moderation, security changes, API calls
 */
const auditLogSchema = new Schema(
    {
        action: {
            type: String,
            enum: [
                "LOGIN",
                "LOGOUT",
                "OAUTH_LOGIN",
                "PASSWORD_CHANGE",
                "2FA_ENABLED",
                "2FA_DISABLED",
                "API_KEY_CREATED",
                "API_KEY_DELETED",
                "USER_CREATED",
                "USER_UPDATED",
                "USER_DELETED",
                "USER_BANNED",
                "USER_PROMOTED",
                "VIDEO_UPLOADED",
                "VIDEO_DELETED",
                "VIDEO_FLAGGED",
                "CONTENT_MODERATED",
                "PERMISSION_DENIED",
                "RATE_LIMIT_HIT",
                "FAILED_LOGIN",
                "SUSPICIOUS_ACTIVITY",
                "ADMIN_ACTION"
            ],
            required: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true
        },
        adminId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            sparse: true // Only for actions performed by admin
        },
        resourceType: {
            type: String,
            enum: ["USER", "VIDEO", "COMMENT", "ADMIN_SETTING", "SECURITY", "API"],
            required: true
        },
        resourceId: {
            type: String,
            index: true
        },
        description: {
            type: String,
            required: true
        },
        details: {
            type: Schema.Types.Mixed,
            default: {}
        },
        ipAddress: {
            type: String,
            required: true,
            index: true
        },
        userAgent: String,
        status: {
            type: String,
            enum: ["SUCCESS", "FAILED", "PARTIAL"],
            default: "SUCCESS"
        },
        statusCode: Number,
        errorMessage: String,
        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "LOW"
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    { timestamps: true }
);

// Compound index for efficient queries
auditLogSchema.index({ timestamp: -1, action: 1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
