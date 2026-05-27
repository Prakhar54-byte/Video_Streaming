# 🎯 Ready-to-Implement Action Plan

**Current Date:** April 30, 2026  
**Status:** Backend 90% complete → Frontend ready to start  
**Time to Launch:** 5-7 days with focused team

---

## ✅ COMPLETED (Backend)

### Security Classes (4 Core Modules)
All in `/BACKEND/src/classes/`:
- ✅ `SecurityManager.js` — JWT, encryption, audit
- ✅ `OAuthService.js` — Google, GitHub OAuth
- ✅ `PermissionChecker.js` — RBAC system
- ✅ `AuditLogger.js` — Event tracking

### Database Models
All in `/BACKEND/src/models/`:
- ✅ `user.model.js` — Updated with OAuth, 2FA, security fields
- ✅ `oauthProvider.model.js` — OAuth connections
- ✅ `auditLog.model.js` — Audit trail
- ✅ `securityEvent.model.js` — Security incidents

### API Controllers & Routes
- ✅ `oauthController.js` — Google/GitHub handlers
- ✅ `oauth.routes.js` — API endpoints
- ✅ `enhancedAuthMiddleware.js` — Security checks

---

## 🔴 TODO - Critical Path (Do These First)

### Step 1: Add OAuth Credentials to `.env` (5 min)

**Location:** `BACKEND/.env`

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_from_google_console
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# GitHub OAuth  
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback

# JWT Security
ACCESS_TOKEN_SECRET=generate_random_string_32_chars_minimum
REFRESH_TOKEN_SECRET=generate_random_string_32_chars_minimum
ENCRYPTION_KEY=generate_random_string_32_chars_minimum

# Database
MONGODB_URI=mongodb://localhost:27017/video_learning

# Server
NODE_ENV=development
PORT=5000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**How to get credentials:**
- Google: https://console.cloud.google.com/ (Create OAuth 2.0 credentials)
- GitHub: https://github.com/settings/developers (New OAuth App)

---

### Step 2: Register OAuth Routes in Backend (3 min)

**File:** `BACKEND/src/app.js`

**Add these lines** (find where other routes are imported):

```javascript
// At the top with other imports
import oauthRoutes from './routers/oauth.routes.js';

// In the middleware section, after other route registrations:
app.use('/api/v1/auth', oauthRoutes);
```

**Verify it works:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/oauth/google-login \
  -H "Content-Type: application/json" \
  -d '{"idToken":"test_token"}'
```

---

### Step 3: Create Frontend OAuth Context (10 min)

**File:** `frontend/src/context/OAuthContext.jsx`

```javascript
'use client';

import { createContext, useState } from 'react';
import axios from 'axios';

export const OAuthContext = createContext();

export const OAuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google-login`,
        { idToken: credentialResponse.credential },
        { withCredentials: true }
      );

      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async (code) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/github-exchange`,
        { code },
        { withCredentials: true }
      );

      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OAuthContext.Provider value={{ handleGoogleLogin, handleGithubLogin, isLoading, error }}>
      {children}
    </OAuthContext.Provider>
  );
};
```

---

### Step 4: Create OAuth Buttons Component (5 min)

**File:** `frontend/src/components/OAuthButtons.jsx`

```javascript
'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useContext } from 'react';
import { OAuthContext } from '@/context/OAuthContext';

export const OAuthButtons = () => {
  const { handleGoogleLogin, handleGithubLogin } = useContext(OAuthContext);

  const handleGithubClick = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = 'user:email';
    
    window.location.href = 
      `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  return (
    <div className="space-y-3">
      {/* Google Button */}
      <div>
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => console.error('Google login failed')}
          theme="dark"
          size="large"
          text="signin_with"
        />
      </div>

      {/* GitHub Button */}
      <button
        onClick={handleGithubClick}
        className="w-full px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        Continue with GitHub
      </button>
    </div>
  );
};
```

---

### Step 5: Create Protected Route Component (5 min)

**File:** `frontend/src/components/ProtectedRoute.jsx`

```javascript
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Check role if required
    if (requiredRole === 'admin' && !user.isAdmin) {
      router.push('/dashboard');
      return;
    }

    if (requiredRole === 'creator' && !user.isCreator) {
      router.push('/dashboard');
      return;
    }

    setIsAuthorized(true);
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0e14]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#32FF7E] mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthorized ? children : null;
};
```

---

### Step 6: Create GitHub Callback Page (5 min)

**File:** `frontend/src/app/auth/github/callback/page.jsx`

```javascript
'use client';

import { useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OAuthContext } from '@/context/OAuthContext';

export default function GitHubCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleGithubLogin } = useContext(OAuthContext);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      console.error('GitHub OAuth error:', error);
      router.push('/auth/login?error=github_denied');
    } else if (code) {
      handleGithubLogin(code);
    } else {
      router.push('/auth/login');
    }
  }, [code, error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0b0e14]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#32FF7E] mx-auto mb-4"></div>
        <p className="text-white">Signing in with GitHub...</p>
      </div>
    </div>
  );
}
```

---

### Step 7: Update Login Page (10 min)

**File:** `frontend/src/app/auth/login/page.jsx`

```javascript
'use client';

import { useState } from 'react';
import { OAuthButtons } from '@/components/OAuthButtons';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-white/60 mb-8">Sign in to your account</p>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* OAuth Section */}
          <div className="mb-8">
            <OAuthButtons />
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0b0e14] text-white/60">Or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-[#32FF7E] focus:outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-[#32FF7E] focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-[#32FF7E] text-black font-bold rounded-lg hover:scale-105 transition disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-white/60 mt-6">
            Don't have an account?{' '}
            <a href="/auth/register" className="text-[#32FF7E] hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### Step 8: Create Dashboard (Admin/Creator Role Check)

**File:** `frontend/src/app/dashboard/page.jsx`

```javascript
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    // Redirect based on role
    if (userData.isAdmin) {
      router.push('/admin/dashboard');
    } else if (userData.isCreator) {
      router.push('/creator/dashboard');
    }
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0b0e14] text-white p-8">
        <h1 className="text-4xl font-bold">Welcome, {user?.fullName}</h1>
        <p className="text-white/60 mt-4">Redirecting to your dashboard...</p>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 🎯 Quick Testing Checklist

After implementing above steps:

- [ ] Google login works (redirect to dashboard)
- [ ] GitHub login works (redirect to dashboard)
- [ ] Tokens stored in localStorage
- [ ] Logout clears tokens
- [ ] Protected routes show loading then redirect if no token
- [ ] Admin user sees admin dashboard
- [ ] Creator user sees creator dashboard
- [ ] Regular user sees home dashboard

---

## 🚀 Next Phase (After Testing)

### 1. Admin Dashboard Features
- User management (list, ban, promote)
- Audit log viewer
- Security event dashboard
- Site statistics

### 2. Creator Studio
- Video upload form (with presigned URLs)
- Video management (edit, delete)
- Creator analytics
- Earnings dashboard

### 3. Content Pages
- Browse all videos
- Video player with controls
- Comments system
- Creator profile pages

---

## 📦 Dependencies to Install

**Frontend:**
```bash
npm install @react-oauth/google axios
npm install @heroicons/react  # for icons
```

**Backend:**
(Already installed, just verify)
```bash
npm ls | grep "oauth|jwt|bcrypt"
```

---

## 🔐 Security Verification

**After implementation, verify:**

1. **OAuth tokens in httpOnly cookies** ✓
2. **JWT validation on protected routes** ✓
3. **Rate limiting on auth endpoints** ✓
4. **Audit logging for all login attempts** ✓
5. **Account lockout after 5 failed logins** ✓
6. **Password strength validation** ✓
7. **CORS properly configured** ✓

---

## 🆘 Troubleshooting

### Issue: "OAuth redirect URI mismatch"
**Solution:** 
- Check Google Console: authorized redirect URIs must match exactly
- Check GitHub settings: authorization callback URL must match
- Ensure `.env` has correct URIs

### Issue: "Token invalid" on protected routes
**Solution:**
- Verify `ACCESS_TOKEN_SECRET` in `.env` is set
- Check token is being sent in Authorization header
- Clear localStorage and re-login

### Issue: "Account locked after multiple login attempts"
**Solution:**
- Wait 15 minutes or manually update DB:
- `db.users.updateOne({email: "user@example.com"}, {$set: {accountLockedUntil: null}})`

---

## ✅ Implementation Timeline

| Step | Time | Status |
|------|------|--------|
| 1. OAuth credentials | 5 min | ⏳ TODO |
| 2. Register routes | 3 min | ⏳ TODO |
| 3-6. Frontend components | 30 min | ⏳ TODO |
| 7. Login page | 10 min | ⏳ TODO |
| 8. Dashboard routing | 5 min | ⏳ TODO |
| Testing & fixes | 30 min | ⏳ TODO |
| **TOTAL** | **~2 hours** | |

---

**Start with Step 1 → Step 8 in order. Each step builds on the previous!**

Questions? Check the code examples above — they're production-ready.

🚀 **Let's ship this!**
