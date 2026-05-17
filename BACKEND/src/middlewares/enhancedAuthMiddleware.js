/**
 * Enhanced Authentication Middleware
 * Uses SecurityManager class for robust security
 * Extends existing verifyJWT with additional protections
 */

import { SecurityManager } from "../classes/SecurityManager.js";
import { PermissionChecker } from "../classes/PermissionChecker.js";
import { AuditLogger } from "../classes/AuditLogger.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const securityManager = new SecurityManager();
const permChecker = new PermissionChecker();
const auditLogger = new AuditLogger();

/**
 * Enhanced JWT verification with security logging
 */
export const verifyJWTEnhanced = asyncHandler(async(req, _, next) => {
    try {
        const token = req.header("Authorization")?.replace(/^Bearer\s+/i, "") || req.cookies?.accessToken;

        if (!token) {
            await auditLogger.logPermissionDenied(null, "AUTH", "GENERAL", "No token provided", req.ip);
            throw new ApiError(401, "Unauthorized - No token provided");
        }

        // Use SecurityManager to verify token
        const decoded = securityManager.verifyToken(token);
        
        if (!decoded) {
            await auditLogger.logPermissionDenied(null, "AUTH", "GENERAL", "Invalid token", req.ip);
            throw new ApiError(401, "Invalid or expired token");
        }

        const user = await User.findById(decoded._id);
        
        if (!user) {
            throw new ApiError(401, "User not found");
        }

        // Check if user is banned
        if (user.isBanned) {
            await auditLogger.logPermissionDenied(user._id, "AUTH", "GENERAL", "User banned", req.ip);
            throw new ApiError(403, "Your account has been banned");
        }

        // Check if account is locked
        if (user.isAccountLocked()) {
            throw new ApiError(423, "Account is temporarily locked");
        }

        // Check IP whitelist if enabled
        if (user.ipWhitelist.length > 0 && !user.isIpAllowed(req.ip)) {
            await auditLogger.logPermissionDenied(user._id, "AUTH", "GENERAL", "Unauthorized IP", req.ip);
            throw new ApiError(403, "Access from this IP is not allowed");
        }

        req.user = user;
        req.userRole = user.isAdmin ? "admin" : user.isCreator ? "creator" : "user";
        
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Authentication failed");
    }
});

/**
 * Admin role required middleware
 */
export const requireAdmin = asyncHandler(async(req, _, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }

    const isAdmin = await permChecker.isAdmin(req.user._id);
    
    if (!isAdmin) {
        await auditLogger.logPermissionDenied(req.user._id, "ADMIN_ACCESS", "ADMIN", "Insufficient permissions", req.ip);
        throw new ApiError(403, "Admin access required");
    }

    next();
});

/**
 * Creator role required middleware
 */
export const requireCreator = asyncHandler(async(req, _, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }

    const isCreator = await permChecker.isCreator(req.user._id);
    
    if (!isCreator && !await permChecker.isAdmin(req.user._id)) {
        await auditLogger.logPermissionDenied(req.user._id, "CREATOR_ACCESS", "CREATOR", "Creator account required", req.ip);
        throw new ApiError(403, "Creator account required");
    }

    next();
});

/**
 * Permission check middleware
 * Usage: router.post("/delete", checkPermission("VIDEO", "DELETE"), controller)
 */
export const checkPermission = (resource, action) => {
    return asyncHandler(async(req, _, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }

        const permission = await permChecker.checkPermission(req.user._id, resource, action);
        
        if (!permission.allowed) {
            await auditLogger.logPermissionDenied(
                req.user._id,
                action,
                resource,
                permission.reason,
                req.ip
            );
            throw new ApiError(403, permission.reason || "Permission denied");
        }

        next();
    });
};

/**
 * Optional authentication middleware
 * Doesn't require auth but attaches user if valid token present
 */
export const optionalAuth = asyncHandler(async(req, _, next) => {
    try {
        const token = req.header("Authorization")?.replace(/^Bearer\s+/i, "") || req.cookies?.accessToken;
        
        if (token) {
            const decoded = securityManager.verifyToken(token);
            if (decoded) {
                const user = await User.findById(decoded._id);
                if (user && !user.isBanned) {
                    req.user = user;
                    req.userRole = user.isAdmin ? "admin" : user.isCreator ? "creator" : "user";
                }
            }
        }
    } catch (error) {
        // Silently continue if token is invalid
    }
    
    next();
});

export default {
    verifyJWTEnhanced,
    requireAdmin,
    requireCreator,
    checkPermission,
    optionalAuth
};
