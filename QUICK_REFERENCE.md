# 🚀 Quick Reference Card

**Print this! Keep it open while implementing.**

---

## 📋 8-Step Implementation Plan

| Step | Task | Time | Status | See File |
|------|------|------|--------|----------|
| 1 | Get OAuth credentials + create .env | 10 min | ⏳ | READY_TO_IMPLEMENT.md |
| 2 | Register OAuth routes in app.js | 5 min | ⏳ | READY_TO_IMPLEMENT.md |
| 3 | Create OAuthContext.jsx | 10 min | ⏳ | READY_TO_IMPLEMENT.md |
| 4 | Create OAuthButtons.jsx | 5 min | ⏳ | READY_TO_IMPLEMENT.md |
| 5 | Create ProtectedRoute.jsx | 5 min | ⏳ | READY_TO_IMPLEMENT.md |
| 6 | Create GitHub callback page | 5 min | ⏳ | READY_TO_IMPLEMENT.md |
| 7 | Update login page | 10 min | ⏳ | READY_TO_IMPLEMENT.md |
| 8 | Create dashboard routing | 5 min | ⏳ | READY_TO_IMPLEMENT.md |

**Total: ~2 hours to fully functional OAuth system**

---

## 🔑 Critical Environment Variables

**BACKEND/.env:**
```
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GITHUB_CLIENT_ID=***
GITHUB_CLIENT_SECRET=***
GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
ACCESS_TOKEN_SECRET=*** (32 char min)
REFRESH_TOKEN_SECRET=*** (32 char min)
ENCRYPTION_KEY=*** (32 char min)
MONGODB_URI=mongodb://localhost:27017/video_learning
NODE_ENV=development
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**frontend/.env.local:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=***
NEXT_PUBLIC_GITHUB_CLIENT_ID=***
```

**Generate secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📁 File Locations (What's Where)

### Backend (All Created ✅)
```
BACKEND/src/classes/
├── SecurityManager.js          ← JWT, encryption, audit
├── OAuthService.js             ← Google, GitHub
├── PermissionChecker.js        ← RBAC system
└── AuditLogger.js              ← Event tracking

BACKEND/src/models/
├── user.model.js               ← Extended with OAuth
├── oauthProvider.model.js      ← OAuth connections
├── auditLog.model.js           ← Audit trail
└── securityEvent.model.js      ← Security incidents

BACKEND/src/controllers/
└── oauthController.js          ← OAuth handlers

BACKEND/src/routers/
└── oauth.routes.js             ← API endpoints

BACKEND/src/middlewares/
└── enhancedAuthMiddleware.js   ← Security checks
```

### Frontend (To Create - Code Provided)
```
frontend/src/context/
└── OAuthContext.jsx            ← State management

frontend/src/components/
├── OAuthButtons.jsx            ← Google & GitHub buttons
└── ProtectedRoute.jsx          ← Route protection

frontend/src/app/auth/
├── login/page.jsx              ← Login page
└── github/callback/page.jsx    ← GitHub callback

frontend/src/app/dashboard/
└── page.jsx                    ← Dashboard router

frontend/src/app/admin/
└── dashboard/page.jsx          ← Admin panel

frontend/src/app/creator/
├── dashboard/page.jsx          ← Creator studio
└── upload/page.jsx             ← Video upload
```

---

## 🧪 Quick Testing

### Start Servers
```bash
# Terminal 1 - Backend
cd BACKEND && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Test Endpoints
```bash
# Google login
curl -X POST http://localhost:5000/api/v1/auth/oauth/google-login \
  -H "Content-Type: application/json" \
  -d '{"idToken":"YOUR_TOKEN"}'

# GitHub exchange
curl -X POST http://localhost:5000/api/v1/auth/oauth/github-exchange \
  -H "Content-Type: application/json" \
  -d '{"code":"YOUR_CODE"}'

# Check health
curl http://localhost:5000/api/v1/auth/health
```

### Test UI
```
1. Navigate to http://localhost:3000/auth/login
2. Click "Continue with Google" or "Continue with GitHub"
3. Should redirect to /dashboard after login
4. localStorage should have accessToken
5. Go to /admin/dashboard (if admin)
6. Go to /creator/dashboard (if creator)
```

---

## 🆘 Top Issues & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "OAuth redirect URI mismatch" | Redirect URI doesn't match console | Update Google Console / GitHub settings to match exactly |
| "Module not found: OAuthService" | Path incorrect | Check case: `./classes/OAuthService.js` |
| "CORS error" | Frontend/backend mismatch | Check `ALLOWED_ORIGINS` in `.env` |
| "Cannot read property 'accessToken'" | Auth failed silently | Check console.error in OAuthContext |
| "Account locked" | 5 failed logins | Wait 15 min or: `db.users.updateOne({email:"x@y.com"}, {$set:{accountLockedUntil:null}})` |
| "Token invalid" | Wrong secret or expired | Verify `ACCESS_TOKEN_SECRET` same in `.env` |
| "Port 5000 in use" | Another process running | `lsof -i :5000` then `kill -9 PID` |
| "Cannot find MongoDB" | MongoDB not started | Run `mongod` locally or use MongoDB Atlas |

---

## 📊 Architecture at a Glance

```
User → Login Page
         ↓
    [OAuth Buttons]
    /              \
   /                \
Google OAuth      GitHub OAuth
   ↓                   ↓
[OAuthService]   [OAuthService]
   ↓                   ↓
[Backend API]    [Backend API]
   ↓                   ↓
   ├─→ Find/Create User
   ├─→ Generate JWT
   ├─→ Return Token
   └─→ Log Audit Event
   
   ↓
[OAuthContext stores token]
   ↓
[localStorage: accessToken]
   ↓
[ProtectedRoute checks token]
   ↓
Route by Role:
├─ Admin → /admin/dashboard
├─ Creator → /creator/dashboard
└─ User → /dashboard
```

---

## 📚 Documentation Map

```
START HERE → READY_TO_IMPLEMENT.md
             (8 steps with full code examples)
                    ↓
             Copy components from:
             ADMIN_CREATOR_TEMPLATES.md
                    ↓
             Test using:
             VERIFICATION_CHECKLIST.md
             (10 phases of testing)
                    ↓
             Deep dive into:
             IMPLEMENTATION_GUIDE_COMPLETE.md
             (Full architecture)
                    ↓
             See summary:
             PROJECT_COMPLETION_SUMMARY.md
             (Feature checklist)
```

---

## ✅ Success Checklist

- [ ] Backend running (npm start works)
- [ ] Frontend running (npm run dev works)
- [ ] OAuth credentials obtained (Google + GitHub)
- [ ] .env files created with secrets
- [ ] OAuthContext.jsx created
- [ ] OAuthButtons.jsx created
- [ ] ProtectedRoute.jsx created
- [ ] Login page updated
- [ ] GitHub callback page created
- [ ] Dashboard routing works
- [ ] Google login works
- [ ] GitHub login works
- [ ] Token in localStorage
- [ ] Protected routes protected
- [ ] Admin dashboard works
- [ ] Creator dashboard works
- [ ] Video upload form works
- [ ] No console errors
- [ ] All audit logs created
- [ ] Account locking works

**All checked? You're production ready!** 🎉

---

## 🔐 Security Features Built In

✅ JWT authentication (15 min expiry)  
✅ OAuth 2.0 (Google, GitHub)  
✅ AES-256 encryption for sensitive data  
✅ Role-based access control (Admin, Creator, User)  
✅ Audit logging for all actions  
✅ Brute force detection (5 attempts → lock)  
✅ Account lockout (15 min duration)  
✅ IP tracking and whitelist support  
✅ Password strength validation  
✅ Input sanitization (XSS protection)  
✅ CORS protection  
✅ Rate limiting hooks  

---

## 💡 Pro Tips

1. **Use Postman** for API testing before UI
2. **Console.log user data** to verify token payload
3. **Check MongoDB** directly for created records
4. **Clear localStorage** between login attempts
5. **Use incognito mode** to avoid cookie caching
6. **Set shorter token expiry** (5 min) during development
7. **Enable debug logging** in SecurityManager for troubleshooting
8. **Test both OAuth and email** login flows
9. **Try both admin and creator** accounts
10. **Check browser network tab** for request/response details

---

## 📞 When Stuck

1. **Check the issue** in the "Top Issues" section above
2. **Search documentation**:
   - `READY_TO_IMPLEMENT.md` → Implementation
   - `VERIFICATION_CHECKLIST.md` → Troubleshooting
   - `ADMIN_CREATOR_TEMPLATES.md` → Component examples
3. **Check browser console** for error messages
4. **Check server logs** for backend errors
5. **Check MongoDB** for data verification

---

## ⏱️ Time Breakdown

```
Environment Setup:        15 min
Backend Integration:      5 min
Frontend Setup:           30 min
Component Creation:       90 min (mostly copy-paste)
Testing & Fixes:          30 min
──────────────────────────────
TOTAL:                    ~2.5 hours

Admin Dashboard:          60 min (copy from template)
Creator Studio:           90 min (copy from template)
Video Upload:             60 min (copy from template)
──────────────────────────────
FULL SYSTEM:              ~5 hours

Production Deploy:        varies by platform
```

---

## 🚀 Launch Checklist

- [ ] All backend code in place
- [ ] All frontend code created
- [ ] All .env files configured
- [ ] MongoDB running
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] OAuth login tested
- [ ] Admin dashboard works
- [ ] Creator upload works
- [ ] Audit logs recording
- [ ] No console errors
- [ ] Ready to commit to git

**Then:** Deploy to staging → production

---

**BOOKMARK THIS PAGE! Print and keep on desk while implementing.** 📌

**Start with: `READY_TO_IMPLEMENT.md` → Step 1**
