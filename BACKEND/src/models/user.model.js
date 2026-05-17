


import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";



    const userSchema = new Schema(
        {
            // ==================== BASIC INFO ====================
            username: {
                type: String,
                required: true,
                unique: true,
                lowercase: true,
                trim: true, 
                index: true
            },
            email: {
                type: String,
                required: true,
                lowercase: true,
                unique: true,
                index: true
            },
            fullName: {
                type: String,
                required: true,
                trim: true, 
                index: true
            },
            avatar: {
                type: String, // cloudinary url
                default: "https://via.placeholder.com/150"
            },
            coverImage: {
                type: String, // cloudinary url
            },
            bio: {
                type: String,
                default: ""
            },

            // ==================== AUTHENTICATION ====================
            password: {
                type: String,
                required: [true, 'Password is required'],
                select: false
            },
            refreshToken: {
                type: String,
                select: false
            },
            emailVerified: {
                type: Boolean,
                default: false
            },
            emailVerificationToken: {
                type: String,
                select: false
            },

            // ==================== OAUTH ====================
            oauthProviders: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "OAuthProvider"
                }
            ],

            // ==================== ROLES & PERMISSIONS ====================
            isAdmin: {
                type: Boolean,
                default: false,
                index: true
            },
            isCreator: {
                type: Boolean,
                default: false,
                index: true
            },
            isModerator: {
                type: Boolean,
                default: false
            },

            // ==================== ACCOUNT STATUS ====================
            isBanned: {
                type: Boolean,
                default: false,
                index: true
            },
            banReason: String,
            bannedAt: Date,
            banExpiry: Date,

            // ==================== SECURITY ====================
            twoFactorEnabled: {
                type: Boolean,
                default: false
            },
            twoFactorSecret: {
                type: String,
                select: false
            },
            apiKeys: [
                {
                    key: String,
                    name: String,
                    createdAt: { type: Date, default: Date.now },
                    lastUsedAt: Date,
                    isActive: { type: Boolean, default: true }
                }
            ],
            ipWhitelist: [String],
            lastLoginIp: String,
            lastLoginAt: Date,
            lastPasswordChangeAt: Date,
            failedLoginAttempts: {
                type: Number,
                default: 0
            },
            accountLockedUntil: Date,

            // ==================== TRACKING ====================
            watchHistory: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Video"
                }
            ],
            enrolledRoadmaps: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Roadmap"
                }
            ],
            totalVideosWatched: {
                type: Number,
                default: 0
            },
            totalHoursWatched: {
                type: Number,
                default: 0
            },
            totalVideosUploaded: {
                type: Number,
                default: 0
            },
            totalEarnings: {
                type: Number,
                default: 0
            },

            // ==================== NOTIFICATIONS ====================
            notificationPreferences: {
                emailNotifications: { type: Boolean, default: true },
                newVideoNotifications: { type: Boolean, default: true },
                commentNotifications: { type: Boolean, default: true },
                promotionalEmails: { type: Boolean, default: false }
            }
        },
        {
            timestamps: true
        }
    )

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    this.lastPasswordChangeAt = new Date();
    next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
    if (!password || !this.password) {
        return false;
    }
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.isAdmin ? "admin" : this.isCreator ? "creator" : "user"
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
        }
    )
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
        }
    )
}

// ==================== NEW SECURITY METHODS ====================

/**
 * Increment failed login attempts and potentially lock account
 */
userSchema.methods.incrementFailedLoginAttempts = async function() {
    this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
    
    // Lock account after 5 failed attempts for 15 minutes
    if (this.failedLoginAttempts >= 5) {
        this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    
    await this.save();
    return this;
}

/**
 * Reset failed login attempts on successful login
 */
userSchema.methods.resetFailedLoginAttempts = async function() {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = null;
    this.lastLoginAt = new Date();
    await this.save();
    return this;
}

/**
 * Check if account is locked
 */
userSchema.methods.isAccountLocked = function() {
    if (!this.accountLockedUntil) return false;
    return this.accountLockedUntil > new Date();
}

/**
 * Add API key
 */
userSchema.methods.addApiKey = async function(name, encryptedKey) {
    this.apiKeys.push({
        key: encryptedKey,
        name,
        createdAt: new Date(),
        isActive: true
    });
    await this.save();
    return this;
}

/**
 * Revoke API key
 */
userSchema.methods.revokeApiKey = async function(keyName) {
    const apiKey = this.apiKeys.find(k => k.name === keyName);
    if (apiKey) {
        apiKey.isActive = false;
    }
    await this.save();
    return !!apiKey;
}

/**
 * Check if IP is whitelisted (if whitelist exists)
 */
userSchema.methods.isIpAllowed = function(ipAddress) {
    if (this.ipWhitelist.length === 0) return true; // No whitelist = all IPs allowed
    return this.ipWhitelist.includes(ipAddress);
}

/**
 * Add IP to whitelist
 */
userSchema.methods.addIpToWhitelist = async function(ipAddress) {
    if (!this.ipWhitelist.includes(ipAddress)) {
        this.ipWhitelist.push(ipAddress);
        await this.save();
    }
    return this;
}

export const User = mongoose.model("User", userSchema)



