import mongoose, { Schema } from "mongoose";

/**
 * OAuthProvider Model - Tracks third-party OAuth connections for users
 * Used for Google, GitHub, and future OAuth providers
 */
const oauthProviderSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        provider: {
            type: String,
            enum: ["google", "github", "facebook", "linkedin"],
            required: true
        },
        providerId: {
            type: String,
            required: true,
            unique: true,
            sparse: true
        },
        email: String,
        name: String,
        avatar: String,
        accessToken: {
            type: String,
            select: false
        },
        refreshToken: {
            type: String,
            select: false
        },
        tokenExpiresAt: Date,
        isVerified: {
            type: Boolean,
            default: true
        },
        lastUsedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Index for fast lookups
oauthProviderSchema.index({ provider: 1, providerId: 1 });
oauthProviderSchema.index({ user: 1, provider: 1 });

export const OAuthProvider = mongoose.model("OAuthProvider", oauthProviderSchema);
