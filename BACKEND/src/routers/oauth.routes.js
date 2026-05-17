import { Router } from "express";
import {
    googleLogin,
    exchangeGoogleCode,
    exchangeGithubCode,
    linkOAuthProvider,
    unlinkOAuthProvider,
    getLinkedOAuthProviders
} from "../controllers/oauthController.js";
import { verifyJWT as authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// ==================== PUBLIC OAUTH ROUTES ====================

/**
 * POST /api/v1/auth/oauth/google-login
 * Google OAuth login with ID token
 */
router.post("/oauth/google-login", googleLogin);

/**
 * POST /api/v1/auth/oauth/google-exchange
 * Exchange Google authorization code for tokens
 */
router.post("/oauth/google-exchange", exchangeGoogleCode);

/**
 * POST /api/v1/auth/oauth/github-exchange
 * Exchange GitHub authorization code for tokens
 */
router.post("/oauth/github-exchange", exchangeGithubCode);

// ==================== PROTECTED OAUTH ROUTES ====================

/**
 * POST /api/v1/auth/oauth/link
 * Link OAuth provider to existing account
 */
router.post("/oauth/link", authMiddleware, linkOAuthProvider);

/**
 * DELETE /api/v1/auth/oauth/unlink/:provider
 * Unlink OAuth provider from account
 */
router.delete("/oauth/unlink/:provider", authMiddleware, unlinkOAuthProvider);

/**
 * GET /api/v1/auth/oauth/providers
 * Get all linked OAuth providers
 */
router.get("/oauth/providers", authMiddleware, getLinkedOAuthProviders);

export default router;
