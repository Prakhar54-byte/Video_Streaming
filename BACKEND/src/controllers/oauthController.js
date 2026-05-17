import { User } from "../models/user.model.js";
import { OAuthService } from "../classes/OAuthService.js";
import { SecurityManager } from "../classes/SecurityManager.js";
import { AuditLogger } from "../classes/AuditLogger.js";
import { PermissionChecker } from "../classes/PermissionChecker.js";

const oauthService = new OAuthService();
const securityManager = new SecurityManager();
const auditLogger = new AuditLogger();
const permChecker = new PermissionChecker();

/**
 * OAuth Controller - Handles all OAuth authentication flows
 */

// ==================== GOOGLE OAUTH ====================

/**
 * POST /api/v1/auth/google-login
 * Handle Google OAuth callback
 * Body: { idToken: "google_id_token" }
 */
export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        
        if (!idToken) {
            return res.status(400).json({ message: "Missing ID token" });
        }

        // Validate and get profile from Google
        const googleProfile = await oauthService.validateGoogleToken(idToken);

        // Find or create OAuth provider record
        let oauthProvider = await oauthService.findOrCreateOAuthProvider(googleProfile);

        // Find or create user
        let user = oauthProvider.user 
            ? await User.findById(oauthProvider.user) 
            : null;

        if (!user) {
            // Create new user from Google profile
            user = new User({
                email: googleProfile.email,
                username: googleProfile.email.split("@")[0] + "_" + Math.random().toString(36).substr(2, 5),
                fullName: googleProfile.name,
                avatar: googleProfile.avatar,
                emailVerified: true, // Google emails are verified
                password: securityManager.generateApiKey() // Random password for OAuth users
            });
            await user.save();

            // Link OAuth provider to user
            oauthProvider.user = user._id;
            await oauthProvider.save();

            // Log user creation via OAuth
            await auditLogger.logUserCreated(user._id, null, "google_oauth");
        }

        // Check if user is banned
        if (user.isBanned) {
            return res.status(403).json({ message: "Your account has been banned" });
        }

        // Check if account is locked
        if (user.isAccountLocked()) {
            return res.status(423).json({ message: "Account locked. Try again later." });
        }

        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Update last login
        user.lastLoginAt = new Date();
        user.lastLoginIp = req.ip;
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        await user.save();

        // Log OAuth login
        await auditLogger.logOAuthLogin(user._id, "google", req.ip);

        // Set secure httpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            success: true,
            message: "Google login successful",
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                fullName: user.fullName,
                avatar: user.avatar,
                isCreator: user.isCreator,
                isAdmin: user.isAdmin
            },
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error("Google login error:", error);
        
        // Log failed login
        await auditLogger.logFailedLogin("(google_oauth)", req.ip, req.headers["user-agent"], error.message);

        return res.status(500).json({
            success: false,
            message: "Google login failed: " + error.message
        });
    }
};

/**
 * POST /api/v1/auth/google-exchange-code
 * Exchange Google authorization code for tokens (alternative flow)
 * Body: { code: "auth_code" }
 */
export const exchangeGoogleCode = async (req, res) => {
    try {
        const { code } = req.body;
        
        if (!code) {
            return res.status(400).json({ message: "Missing authorization code" });
        }

        const googleProfile = await oauthService.exchangeGoogleCode(code);
        
        // Rest is same as googleLogin - can reuse logic
        let oauthProvider = await oauthService.findOrCreateOAuthProvider(googleProfile);
        let user = oauthProvider.user ? await User.findById(oauthProvider.user) : null;

        if (!user) {
            user = new User({
                email: googleProfile.email,
                username: googleProfile.email.split("@")[0] + "_" + Math.random().toString(36).substr(2, 5),
                fullName: googleProfile.name,
                avatar: googleProfile.avatar,
                emailVerified: true,
                password: securityManager.generateApiKey()
            });
            await user.save();

            oauthProvider.user = user._id;
            await oauthProvider.save();
            await auditLogger.logUserCreated(user._id, null, "google_oauth");
        }

        if (user.isBanned) {
            return res.status(403).json({ message: "Your account has been banned" });
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.lastLoginAt = new Date();
        user.lastLoginIp = req.ip;
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        await user.save();

        await auditLogger.logOAuthLogin(user._id, "google", req.ip);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Google login successful",
            user: { _id: user._id, email: user.email, username: user.username, fullName: user.fullName },
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error("Google code exchange error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== GITHUB OAUTH ====================

/**
 * POST /api/v1/auth/github-exchange-code
 * Exchange GitHub authorization code for tokens
 * Body: { code: "auth_code" }
 */
export const exchangeGithubCode = async (req, res) => {
    try {
        const { code } = req.body;
        
        if (!code) {
            return res.status(400).json({ message: "Missing authorization code" });
        }

        const githubProfile = await oauthService.exchangeGithubCode(code);

        let oauthProvider = await oauthService.findOrCreateOAuthProvider(githubProfile);
        let user = oauthProvider.user ? await User.findById(oauthProvider.user) : null;

        if (!user) {
            user = new User({
                email: githubProfile.email || githubProfile.name + "@github.local",
                username: githubProfile.name.toLowerCase().replace(/\s+/g, "_") + "_" + Math.random().toString(36).substr(2, 5),
                fullName: githubProfile.name,
                avatar: githubProfile.avatar,
                emailVerified: !!githubProfile.email,
                password: securityManager.generateApiKey()
            });
            await user.save();

            oauthProvider.user = user._id;
            await oauthProvider.save();
            await auditLogger.logUserCreated(user._id, null, "github_oauth");
        }

        if (user.isBanned) {
            return res.status(403).json({ message: "Your account has been banned" });
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.lastLoginAt = new Date();
        user.lastLoginIp = req.ip;
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        await user.save();

        await auditLogger.logOAuthLogin(user._id, "github", req.ip);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "GitHub login successful",
            user: { _id: user._id, email: user.email, username: user.username, fullName: user.fullName },
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error("GitHub code exchange error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== ACCOUNT LINKING ====================

/**
 * POST /api/v1/auth/link-oauth
 * Link OAuth provider to existing account (requires authentication)
 * Headers: Authorization: Bearer token
 * Body: { provider: "google" | "github", code: "auth_code" }
 */
export const linkOAuthProvider = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { provider, code, idToken } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        if (!provider || (!code && !idToken)) {
            return res.status(400).json({ message: "Missing provider or credentials" });
        }

        let profile;

        if (provider === "google") {
            profile = idToken 
                ? await oauthService.validateGoogleToken(idToken)
                : await oauthService.exchangeGoogleCode(code);
        } else if (provider === "github") {
            profile = await oauthService.exchangeGithubCode(code);
        } else {
            return res.status(400).json({ message: "Unsupported provider" });
        }

        // Create/update OAuth provider record
        const oauthProvider = await oauthService.findOrCreateOAuthProvider(profile, userId);

        await auditLogger.logAdminAction(userId, "ADMIN_ACTION", "SECURITY", userId, `Linked ${provider} OAuth`);

        return res.status(200).json({
            success: true,
            message: `${provider} account linked successfully`,
            provider: { provider: oauthProvider.provider, email: oauthProvider.email, name: oauthProvider.name }
        });
    } catch (error) {
        console.error("OAuth linking error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/v1/auth/unlink-oauth/:provider
 * Unlink OAuth provider from account
 * Headers: Authorization: Bearer token
 */
export const unlinkOAuthProvider = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { provider } = req.params;

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const success = await oauthService.unlinkOAuthProvider(userId, provider);

        if (!success) {
            return res.status(404).json({ message: `${provider} not linked to this account` });
        }

        await auditLogger.logAdminAction(userId, "ADMIN_ACTION", "SECURITY", userId, `Unlinked ${provider} OAuth`);

        return res.status(200).json({
            success: true,
            message: `${provider} account unlinked successfully`
        });
    } catch (error) {
        console.error("OAuth unlinking error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/v1/auth/oauth-providers
 * Get all linked OAuth providers for current user
 * Headers: Authorization: Bearer token
 */
export const getLinkedOAuthProviders = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const providers = await oauthService.getUserOAuthProviders(userId);

        const sanitized = providers.map(p => ({
            provider: p.provider,
            email: p.email,
            name: p.name,
            avatar: p.avatar,
            linkedAt: p.createdAt,
            lastUsedAt: p.lastUsedAt
        }));

        return res.status(200).json({
            success: true,
            providers: sanitized
        });
    } catch (error) {
        console.error("Error fetching OAuth providers:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
