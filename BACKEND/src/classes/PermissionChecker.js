import { User } from "../models/user.model.js";
import { SecurityManager } from "./SecurityManager.js";

/**
 * PermissionChecker Class - Role-based access control (RBAC)
 * Centralized permission checking for routes and operations
 * 
 * Usage:
 *   const permChecker = new PermissionChecker();
 *   const canDelete = await permChecker.checkPermission(userId, "VIDEO", "DELETE");
 *   const isAdmin = await permChecker.isAdmin(userId);
 */
export class PermissionChecker {
    constructor() {
        this.securityManager = new SecurityManager();
    }

    // ==================== ROLE CHECKING ====================
    /**
     * Get user's role
     */
    async getUserRole(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) return "guest";
            if (user.isAdmin) return "admin";
            if (user.isCreator) return "creator";
            return "user";
        } catch (error) {
            console.error("Failed to get user role:", error.message);
            return "guest";
        }
    }

    /**
     * Check if user is admin
     */
    async isAdmin(userId) {
        try {
            const user = await User.findById(userId);
            return user?.isAdmin || false;
        } catch {
            return false;
        }
    }

    /**
     * Check if user is creator
     */
    async isCreator(userId) {
        try {
            const user = await User.findById(userId);
            return user?.isCreator || false;
        } catch {
            return false;
        }
    }

    /**
     * Promote user to creator
     */
    async promoteToCreator(userId, adminId) {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { isCreator: true },
                { new: true }
            );

            // Log this action
            await this.securityManager.logAuditEvent(
                "USER_PROMOTED",
                userId,
                "USER",
                userId,
                `User promoted to creator by ${adminId}`,
                { adminId }
            );

            return user;
        } catch (error) {
            console.error("Failed to promote user:", error.message);
            throw error;
        }
    }

    /**
     * Ban user
     */
    async banUser(userId, adminId, reason = "") {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { isBanned: true, banReason: reason, bannedAt: new Date() },
                { new: true }
            );

            await this.securityManager.logAuditEvent(
                "USER_BANNED",
                userId,
                "USER",
                userId,
                `User banned: ${reason}`,
                { adminId }
            );

            return user;
        } catch (error) {
            console.error("Failed to ban user:", error.message);
            throw error;
        }
    }

    /**
     * Check if user is banned
     */
    async isBanned(userId) {
        try {
            const user = await User.findById(userId);
            return user?.isBanned || false;
        } catch {
            return false;
        }
    }

    // ==================== PERMISSION CHECKING ====================
    /**
     * Check if user can perform action on resource
     * Returns: { allowed: boolean, reason?: string }
     */
    async checkPermission(userId, resource, action) {
        try {
            // Check if user is banned
            const isBanned = await this.isBanned(userId);
            if (isBanned) {
                return { allowed: false, reason: "User is banned" };
            }

            const userRole = await this.getUserRole(userId);
            return { 
                allowed: this.securityManager.hasPermission(userRole, resource, action),
                reason: !this.securityManager.hasPermission(userRole, resource, action) 
                    ? `Role '${userRole}' cannot ${action} ${resource}` 
                    : null
            };
        } catch (error) {
            console.error("Permission check failed:", error.message);
            return { allowed: false, reason: "Permission check failed" };
        }
    }

    /**
     * Resource ownership check - is user the owner?
     */
    async isResourceOwner(userId, resourceType, resourceId) {
        try {
            // Import models as needed
            let resource = null;

            if (resourceType === "VIDEO") {
                const { Video } = await import("../models/video.model.js");
                resource = await Video.findById(resourceId);
                return resource?.uploadedBy?.toString() === userId?.toString();
            } else if (resourceType === "COMMENT") {
                const { Comment } = await import("../models/comment.model.js");
                resource = await Comment.findById(resourceId);
                return resource?.userId?.toString() === userId?.toString();
            } else if (resourceType === "PLAYLIST") {
                const { Playlist } = await import("../models/playlist.model.js");
                resource = await Playlist.findById(resourceId);
                return resource?.userId?.toString() === userId?.toString();
            }

            return false;
        } catch (error) {
            console.error("Ownership check failed:", error.message);
            return false;
        }
    }

    /**
     * Check combined: role permission + resource ownership
     */
    async canModifyResource(userId, resourceType, resourceId, action) {
        try {
            const userRole = await this.getUserRole(userId);
            
            // Admin can do anything
            if (userRole === "admin") {
                return true;
            }

            // Check role permission
            const hasPermission = this.securityManager.hasPermission(userRole, resourceType, action);
            if (!hasPermission) {
                return false;
            }

            // Check ownership for create/update/delete
            if (["UPDATE", "DELETE"].includes(action)) {
                return await this.isResourceOwner(userId, resourceType, resourceId);
            }

            return true;
        } catch (error) {
            console.error("Resource modification check failed:", error.message);
            return false;
        }
    }

    // ==================== ADMIN-ONLY CHECKS ====================
    /**
     * Require admin permission
     */
    async requireAdmin(userId) {
        const isAdminUser = await this.isAdmin(userId);
        if (!isAdminUser) {
            throw new Error("Admin permission required");
        }
        return true;
    }

    /**
     * Require creator permission
     */
    async requireCreator(userId) {
        const isCreatorUser = await this.isCreator(userId);
        if (!isCreatorUser) {
            throw new Error("Creator account required");
        }
        return true;
    }

    /**
     * Require not banned
     */
    async requireNotBanned(userId) {
        const banStatus = await this.isBanned(userId);
        if (banStatus) {
            throw new Error("Your account has been banned");
        }
        return true;
    }

    // ==================== BULK OPERATIONS ====================
    /**
     * Get all admins
     */
    async getAllAdmins() {
        try {
            return await User.find({ isAdmin: true }).select("_id username email");
        } catch (error) {
            console.error("Failed to get admins:", error.message);
            return [];
        }
    }

    /**
     * Get all creators
     */
    async getAllCreators(skip = 0, limit = 100) {
        try {
            return await User.find({ isCreator: true })
                .skip(skip)
                .limit(limit)
                .select("_id username email avatar");
        } catch (error) {
            console.error("Failed to get creators:", error.message);
            return [];
        }
    }

    /**
     * Get banned users
     */
    async getBannedUsers(skip = 0, limit = 100) {
        try {
            return await User.find({ isBanned: true })
                .skip(skip)
                .limit(limit)
                .select("_id username email banReason bannedAt");
        } catch (error) {
            console.error("Failed to get banned users:", error.message);
            return [];
        }
    }
}
