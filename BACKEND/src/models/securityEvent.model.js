import mongoose, { Schema } from "mongoose";

/**
 * SecurityEvent Model - Tracks security incidents, breaches, suspicious activity
 * Used for threat detection and alerting
 */
const securityEventSchema = new Schema(
    {
        eventType: {
            type: String,
            enum: [
                "FAILED_LOGIN_ATTEMPT",
                "MULTIPLE_FAILED_LOGINS",
                "BRUTE_FORCE_DETECTED",
                "UNUSUAL_LOCATION_LOGIN",
                "UNUSUAL_DEVICE_LOGIN",
                "PERMISSION_VIOLATION",
                "RATE_LIMIT_ABUSE",
                "MALICIOUS_UPLOAD_DETECTED",
                "SQL_INJECTION_ATTEMPT",
                "XSS_ATTEMPT",
                "CSRF_ATTEMPT",
                "UNAUTHORIZED_API_ACCESS",
                "TOKEN_TAMPERING",
                "SESSION_HIJACKING_SUSPECTED"
            ],
            required: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            sparse: true,
            index: true
        },
        ipAddress: {
            type: String,
            required: true,
            index: true
        },
        userAgent: String,
        description: String,
        details: Schema.Types.Mixed,
        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM",
            index: true
        },
        resolved: {
            type: Boolean,
            default: false
        },
        resolvedAt: Date,
        resolvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            sparse: true
        },
        resolutionNotes: String,
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    { timestamps: true }
);

// TTL Index - Auto-delete resolved events after 90 days
securityEventSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: 7776000 } // 90 days
);

// Compound indexes for efficient queries
securityEventSchema.index({ eventType: 1, timestamp: -1 });
securityEventSchema.index({ severity: 1, resolved: 1, timestamp: -1 });

export const SecurityEvent = mongoose.model("SecurityEvent", securityEventSchema);
