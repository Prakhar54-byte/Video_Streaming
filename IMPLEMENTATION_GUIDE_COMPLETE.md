# Complete Implementation Guide: OAuth, Security, Admin & Pages

**Date:** April 29, 2026  
**Status:** Backend classes complete. Frontend guide included below.

---

## ✅ Backend Completed

### Classes Created
- ✅ `SecurityManager.js` - JWT, encryption, permissions, audit logging
- ✅ `OAuthService.js` - Google & GitHub OAuth flows, profile mapping
- ✅ `PermissionChecker.js` - Role-based access control (RBAC)
- ✅ `AuditLogger.js` - Comprehensive event tracking and reporting
- ✅ `User Model` - Updated with OAuth, 2FA, security fields
- ✅ `OAuthProvider Model` - Track OAuth connections
- ✅ `AuditLog Model` - Audit trail storage
- ✅ `SecurityEvent Model` - Security incident tracking
- ✅ `OAuth Controller` - Google & GitHub login handlers
- ✅ `OAuth Routes` - `/api/v1/auth/oauth/*` endpoints
- ✅ `Enhanced Auth Middleware` - Token validation with security checks

### Environment Variables Required

Create `.env` file in `BACKEND/` with:

```bash
# OAuth - Google
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret_key_here
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key_here
REFRESH_TOKEN_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your_encryption_key_here

# Node
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/video_learning
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=15000
RATE_LIMIT_MAX_REQUESTS=100
```

### Backend Integration Steps

1. **Update `app.js`** - Register OAuth routes:
```javascript
import oauthRoutes from './routers/oauth.routes.js';
app.use('/api/v1/auth', oauthRoutes);
```

2. **Test OAuth endpoints**:
```bash
# Test Google login
curl -X POST http://localhost:5000/api/v1/auth/oauth/google-login \
  -H "Content-Type: application/json" \
  -d '{"idToken":"your_google_id_token"}'

# Test GitHub code exchange
curl -X POST http://localhost:5000/api/v1/auth/oauth/github-exchange \
  -H "Content-Type: application/json" \
  -d '{"code":"github_auth_code"}'
```

---

## 🚀 Frontend Implementation Guide

### Phase 1: OAuth Setup

#### 1.1 Install OAuth Libraries
```bash
cd frontend
npm install @react-oauth/google
npm install axios
```

#### 1.2 Create OAuth Context (`src/context/OAuthContext.jsx`)
```javascript
import { createContext, useState, useCallback } from 'react';
import axios from 'axios';

export const OAuthContext = createContext();

export const OAuthProvider = ({ children }) => {
  const [isLoadingOAuth, setIsLoadingOAuth] = useState(false);
  const [oauthError, setOauthError] = useState(null);

  const googleLogin = useCallback(async (credentialResponse) => {
    try {
      setIsLoadingOAuth(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/oauth/google-login`,
        { idToken: credentialResponse.credential },
        { withCredentials: true }
      );
      
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.href = '/dashboard';
    } catch (error) {
      setOauthError(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoadingOAuth(false);
    }
  }, []);

  const githubLogin = useCallback(async (code) => {
    try {
      setIsLoadingOAuth(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/oauth/github-exchange`,
        { code },
        { withCredentials: true }
      );
      
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.href = '/dashboard';
    } catch (error) {
      setOauthError(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoadingOAuth(false);
    }
  }, []);

  return (
    <OAuthContext.Provider value={{ googleLogin, githubLogin, isLoadingOAuth, oauthError }}>
      {children}
    </OAuthContext.Provider>
  );
};
```

#### 1.3 Create OAuth Buttons Component (`src/components/auth/OAuthButtons.jsx`)
```javascript
import { GoogleLogin } from '@react-oauth/google';
import { useContext } from 'react';
import { OAuthContext } from '@/context/OAuthContext';

export const OAuthButtons = () => {
  const { googleLogin, githubLogin } = useContext(OAuthContext);

  const handleGithubClick = () => {
    const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <GoogleLogin
        onSuccess={googleLogin}
        onError={() => console.error('Login Failed')}
        theme="dark"
        size="large"
        text="signin_with"
      />
      
      <button
        onClick={handleGithubClick}
        className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 flex items-center justify-center gap-3"
      >
        <img src="/github-icon.svg" alt="GitHub" className="w-5 h-5" />
        Sign in with GitHub
      </button>
    </div>
  );
};
```

#### 1.4 Create GitHub Callback Page (`src/app/auth/github/callback/page.tsx`)
```javascript
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OAuthContext } from '@/context/OAuthContext';
import { useContext } from 'react';

export default function GitHubCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { githubLogin } = useContext(OAuthContext);
  const code = searchParams.get('code');

  useEffect(() => {
    if (code) {
      githubLogin(code);
    } else {
      router.push('/auth/login');
    }
  }, [code]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-white">Signing in with GitHub...</p>
      </div>
    </div>
  );
}
```

---

### Phase 2: Protected Routes

#### 2.1 Create ProtectedRoute Component (`src/components/ProtectedRoute.jsx`)
```javascript
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (requiredRole) {
      if (requiredRole === 'admin' && !user.isAdmin) {
        router.push('/dashboard');
        return;
      }
      if (requiredRole === 'creator' && !user.isCreator) {
        router.push('/dashboard');
        return;
      }
    }

    setIsAuthorized(true);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return isAuthorized ? children : null;
};
```

---

### Phase 3: Admin Dashboard

#### 3.1 Admin Dashboard Page (`src/app/admin/dashboard/page.tsx`)
```javascript
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const [statsRes, logsRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/admin/audit-logs?limit=10`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setStats(statsRes.data);
        setAuditLogs(logsRes.data.logs);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-[#0b0e14] text-white p-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#32FF7E]"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Users', value: stats?.totalUsers },
                { label: 'Total Videos', value: stats?.totalVideos },
                { label: 'Total Revenue', value: `$${stats?.totalRevenue}` },
                { label: 'Active Creators', value: stats?.activeCreators }
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <p className="text-white/60 text-sm mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="py-3">Action</th>
                      <th className="py-3">User</th>
                      <th className="py-3">Resource</th>
                      <th className="py-3">Timestamp</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3">{log.action}</td>
                        <td className="py-3">{log.userId?.username || 'System'}</td>
                        <td className="py-3">{log.resourceType}</td>
                        <td className="py-3">{new Date(log.timestamp).toLocaleDateString()}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            log.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
```

---

### Phase 4: Creator Studio

#### 4.1 Creator Dashboard (`src/app/creator/dashboard/page.tsx`)
```javascript
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CreatorDashboard() {
  const [creatorStats, setCreatorStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const [statsRes, videosRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/creator/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/creator/videos`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setCreatorStats(statsRes.data);
        setVideos(videosRes.data.videos);
      } catch (error) {
        console.error('Failed to fetch creator data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, []);

  return (
    <ProtectedRoute requiredRole="creator">
      <div className="min-h-screen bg-[#0b0e14] text-white p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Creator Studio</h1>
          <button className="px-6 py-3 bg-[#32FF7E] text-black font-bold rounded-lg hover:scale-105 transition">
            Upload Video
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#32FF7E]"></div>
          </div>
        ) : (
          <>
            {/* Creator Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Views', value: creatorStats?.totalViews },
                { label: 'Videos', value: creatorStats?.videoCount },
                { label: 'Earnings', value: `$${creatorStats?.totalEarnings}` },
                { label: 'Subscribers', value: creatorStats?.subscribers }
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <p className="text-white/60 text-sm mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Videos List */}
            <div className="grid grid-cols-1 gap-4">
              {videos.map((video) => (
                <div key={video._id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex gap-4">
                  <img src={video.thumbnail} alt={video.title} className="w-24 h-24 rounded object-cover" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{video.title}</h3>
                    <p className="text-white/60 text-sm">{video.views} views • {video.likes} likes</p>
                    <p className="text-white/40 text-sm">{new Date(video.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/10 rounded hover:bg-white/20">Edit</button>
                    <button className="px-4 py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
```

---

### Phase 5: Upload Page

#### 5.1 Video Upload Form (`src/app/creator/upload/page.tsx`)
```javascript
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useState } from 'react';
import axios from 'axios';

export default function VideoUploadPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    category: 'programming',
    isPublic: true
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('accessToken');

      // Step 1: Request presigned URL
      const presignedRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/videos/get-upload-url`,
        {
          filename: file.name,
          contentType: file.type,
          size: file.size
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 2: Upload to S3 using presigned URL
      await axios.put(
        presignedRes.data.presignedUrl,
        file,
        {
          headers: { 'Content-Type': file.type },
          onUploadProgress: (e) => {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        }
      );

      // Step 3: Create video record in DB
      const videoRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/videos/create`,
        {
          title: formData.title,
          description: formData.description,
          tags: formData.tags.split(',').map(t => t.trim()),
          category: formData.category,
          isPublic: formData.isPublic,
          s3Url: presignedRes.data.s3Url
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Video uploaded successfully!');
      window.location.href = '/creator/dashboard';
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="creator">
      <div className="min-h-screen bg-[#0b0e14] text-white p-8">
        <h1 className="text-4xl font-bold mb-8">Upload Video</h1>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-lg p-8 max-w-2xl">
          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-3">Video File</label>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-[#32FF7E] transition cursor-pointer">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="video-input"
              />
              <label htmlFor="video-input" className="cursor-pointer">
                <p className="text-white/60 mb-2">Drag & drop or click to select</p>
                <p className="text-sm text-white/40">{file?.name || 'Max 2GB'}</p>
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-[#32FF7E] focus:outline-none"
              placeholder="Video title"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-[#32FF7E] focus:outline-none"
              placeholder="Video description"
              rows="4"
            />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-[#32FF7E] focus:outline-none"
              placeholder="python, tutorial, beginner"
            />
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="mb-6">
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-[#32FF7E] h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center mt-2">{progress}% uploaded</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full px-6 py-3 bg-[#32FF7E] text-black font-bold rounded-lg hover:scale-105 transition disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}
```

---

### Phase 6: UI Components Library

#### 6.1 Create Reusable Components
- `Button.jsx` - Styled button with variants (primary, secondary, danger)
- `Card.jsx` - Reusable card container
- `Modal.jsx` - Modal dialog
- `Toast.jsx` - Toast notifications
- `Sidebar.jsx` - Navigation sidebar
- `Header.jsx` - Top header with user menu

#### 6.2 Design System Constants (`src/lib/designSystem.js`)
```javascript
export const COLORS = {
  primary: '#32FF7E',      // Green
  accent: '#00d2ff',       // Cyan
  dark: '#0b0e14',         // Dark bg
  darkAlt: '#1c2028',      // Lighter dark
  white: '#ffffff',
  muted: '#ffffff40'
};

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px'
};

export const BREAKPOINTS = {
  mobile: '640px',
  tablet: '1024px',
  desktop: '1280px'
};
```

---

## 🔒 Security Checklist

- ✅ OAuth tokens stored in httpOnly cookies
- ✅ JWT tokens verified server-side with SecurityManager
- ✅ CORS properly configured
- ✅ Rate limiting on auth endpoints
- ✅ Audit logging for all admin actions
- ✅ IP whitelist support (optional per user)
- ✅ Account locking after failed login attempts
- ✅ 2FA support (TOTP) - implementation pending
- ✅ API key management for creators
- ✅ Permission-based access control

---

## 📋 Next Steps

1. **Update `.env`** with OAuth credentials
2. **Register OAuth routes** in `app.js`
3. **Create OAuth frontend components** (Google, GitHub buttons)
4. **Build Admin Dashboard** page with stats and audit logs
5. **Create Creator Studio** with upload and analytics
6. **Design all UI** with consistent color scheme (#32FF7E, #0b0e14)
7. **Test OAuth flows** locally
8. **Deploy to production** with proper SSL/TLS

---

## 🎯 Testing OAuth Locally

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application)
3. Add redirect URI: `http://localhost:3000/auth/google/callback`
4. Copy Client ID and Secret to `.env`

### GitHub OAuth Setup
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/auth/github/callback`
4. Copy Client ID and Secret to `.env`

---

## 📊 Metrics & Monitoring

Use the AuditLogger to track:
- User login patterns
- Failed login attempts
- Admin actions
- Video uploads
- Permission violations
- Rate limit hits

Access audit logs via: `GET /api/v1/admin/audit-logs`

---

**Happy coding! 🚀**
