import axios from "axios";
import { OAuthProvider } from "../models/oauthProvider.model.js";
import { SecurityManager } from "./SecurityManager.js";

/**
 * OAuthService Class - Manages OAuth integrations (Google, GitHub)
 * Handles token exchange, profile mapping, account linking
 * 
 * Usage:
 *   const oauth = new OAuthService();
 *   const profile = await oauth.validateGoogleToken(idToken);
 *   const user = await oauth.findOrCreateUser(profile, "google");
 */
export class OAuthService {
    constructor() {
        this.securityManager = new SecurityManager();
        this.GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/tokeninfo";
        this.GITHUB_API_URL = "https://api.github.com";
    }

    // ==================== GOOGLE OAUTH ====================
    /**
     * Validate Google OAuth ID token
     */
    async validateGoogleToken(idToken) {
        try {
            const response = await axios.get(
                `${this.GOOGLE_TOKEN_URL}?id_token=${idToken}`
            );
            
            if (response.data.aud !== process.env.GOOGLE_CLIENT_ID) {
                throw new Error("Invalid audience");
            }

            return {
                providerId: response.data.sub,
                email: response.data.email,
                name: response.data.name,
                avatar: response.data.picture,
                provider: "google"
            };
        } catch (error) {
            console.error("Google token validation failed:", error.message);
            throw new Error("Invalid Google token");
        }
    }

    /**
     * Exchange Google auth code for tokens
     */
    async exchangeGoogleCode(code) {
        try {
            const response = await axios.post(
                "https://oauth2.googleapis.com/token",
                {
                    code,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback",
                    grant_type: "authorization_code"
                }
            );

            // Validate the ID token
            return this.validateGoogleToken(response.data.id_token);
        } catch (error) {
            console.error("Google code exchange failed:", error.message);
            throw new Error("Failed to exchange Google code");
        }
    }

    // ==================== GITHUB OAUTH ====================
    /**
     * Exchange GitHub auth code for tokens
     */
    async exchangeGithubCode(code) {
        try {
            // Step 1: Exchange code for access token
            const tokenResponse = await axios.post(
                "https://github.com/login/oauth/access_token",
                {
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                    redirect_uri: process.env.GITHUB_REDIRECT_URI || "http://localhost:3000/auth/github/callback"
                },
                { headers: { Accept: "application/json" } }
            );

            if (tokenResponse.data.error) {
                throw new Error(tokenResponse.data.error_description);
            }

            // Step 2: Get user profile using access token
            const userResponse = await axios.get(
                `${this.GITHUB_API_URL}/user`,
                { headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` } }
            );

            return {
                providerId: userResponse.data.id.toString(),
                email: userResponse.data.email,
                name: userResponse.data.name || userResponse.data.login,
                avatar: userResponse.data.avatar_url,
                provider: "github",
                accessToken: tokenResponse.data.access_token
            };
        } catch (error) {
            console.error("GitHub code exchange failed:", error.message);
            throw new Error("Failed to exchange GitHub code");
        }
    }

    // ==================== USER LINKING ====================
    /**
     * Find or create OAuth provider record
     */
    async findOrCreateOAuthProvider(profile, userId = null) {
        try {
            // Try to find existing provider
            let oauthProvider = await OAuthProvider.findOne({
                provider: profile.provider,
                providerId: profile.providerId
            });

            if (oauthProvider) {
                oauthProvider.lastUsedAt = new Date();
                await oauthProvider.save();
                return oauthProvider;
            }

            // Create new provider record
            if (!userId) {
                throw new Error("User ID required for new OAuth provider");
            }

            oauthProvider = new OAuthProvider({
                user: userId,
                provider: profile.provider,
                providerId: profile.providerId,
                email: profile.email,
                name: profile.name,
                avatar: profile.avatar,
                accessToken: profile.accessToken ? this.securityManager.encryptData(profile.accessToken) : null,
                isVerified: true,
                lastUsedAt: new Date()
            });

            await oauthProvider.save();
            return oauthProvider;
        } catch (error) {
            console.error("OAuth provider operation failed:", error.message);
            throw error;
        }
    }

    /**
     * Get all OAuth providers linked to user
     */
    async getUserOAuthProviders(userId) {
        try {
            return await OAuthProvider.find({ user: userId });
        } catch (error) {
            console.error("Failed to get OAuth providers:", error.message);
            return [];
        }
    }

    /**
     * Unlink OAuth provider from user account
     */
    async unlinkOAuthProvider(userId, provider) {
        try {
            const result = await OAuthProvider.findOneAndDelete({
                user: userId,
                provider: provider
            });
            return !!result;
        } catch (error) {
            console.error("Failed to unlink OAuth provider:", error.message);
            return false;
        }
    }

    /**
     * Find user by OAuth provider credentials
     */
    async findUserByOAuthProvider(provider, providerId) {
        try {
            const oauthProvider = await OAuthProvider.findOne({
                provider,
                providerId
            }).populate("user");

            return oauthProvider?.user || null;
        } catch (error) {
            console.error("Failed to find user by OAuth provider:", error.message);
            return null;
        }
    }

    // ==================== PROFILE SYNC ====================
    /**
     * Sync profile data from OAuth provider
     */
    async syncOAuthProfile(oauthProviderId, profile) {
        try {
            const updates = {
                name: profile.name || undefined,
                avatar: profile.avatar || undefined,
                email: profile.email || undefined,
                lastUsedAt: new Date()
            };

            // Remove undefined values
            Object.keys(updates).forEach(key => 
                updates[key] === undefined && delete updates[key]
            );

            const updated = await OAuthProvider.findByIdAndUpdate(
                oauthProviderId,
                updates,
                { new: true }
            );

            return updated;
        } catch (error) {
            console.error("Failed to sync OAuth profile:", error.message);
            throw error;
        }
    }

    // ==================== VALIDATION ====================
    /**
     * Validate OAuth provider is properly configured
     */
    validateProviderConfig(provider) {
        const requiredEnvVars = {
            google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
            github: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"]
        };

        const required = requiredEnvVars[provider] || [];
        const missing = required.filter(env => !process.env[env]);

        if (missing.length > 0) {
            throw new Error(`Missing OAuth configuration: ${missing.join(", ")}`);
        }

        return true;
    }

    /**
     * Check if OAuth provider is enabled
     */
    isProviderEnabled(provider) {
        try {
            return this.validateProviderConfig(provider);
        } catch {
            return false;
        }
    }
}
