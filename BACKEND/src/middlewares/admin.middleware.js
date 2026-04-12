import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const isAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized - User not authenticated");
    }

    if (!req.user.isAdmin) {
        throw new ApiError(403, "Forbidden - Admin access required");
    }

    next();
});

export const requireAdminKey = asyncHandler(async (req, res, next) => {
    const adminKey = req.headers['x-admin-key'] || req.query.adminKey;

    if (!adminKey) {
        throw new ApiError(401, "Admin key is required");
    }

    const validAdminKey = process.env.ADMIN_SECRET_KEY;

    if (!validAdminKey) {
        throw new ApiError(500, "Admin key not configured on server");
    }

    if (adminKey !== validAdminKey) {
        throw new ApiError(403, "Invalid admin key");
    }

    next();
});