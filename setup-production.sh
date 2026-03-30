#!/bin/bash
# setup-production.sh - Production environment setup helper

set -e

echo "🚀 Video Streaming Platform - Production Setup Helper"
echo "======================================================\n"

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is not installed"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is not installed"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "⚠️  Docker not found (needed for production)"; }

echo "✅ Prerequisites check passed\n"

# Navigate to backend directory
cd BACKEND || { echo "❌ BACKEND directory not found"; exit 1; }

# 1. Install dependencies
echo "📦 Installing npm dependencies..."
npm install --save helmet express-rate-limit mongo-sanitize xss-clean winston

# Ask user for version
if [ -f "package.json" ]; then
    VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
    echo "ℹ️  Current version: $VERSION"
fi

# 2. Create .env.example if not exists
if [ ! -f ".env.example" ]; then
    echo "\n📝 Creating .env.example template..."
    cat > .env.example << 'EOF'
# Environment
NODE_ENV=production
PORT=8000
LOG_LEVEL=info

# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net

# JWT Secrets (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ACCESS_TOKEN_SECRET=<generate-your-own-32-char-secret>
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<generate-your-own-32-char-secret>
REFRESH_TOKEN_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Rate Limiting
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
UPLOAD_RATE_LIMIT_MAX=10
SEARCH_RATE_LIMIT_MAX=30
EOF
    echo "✅ Created .env.example"
else
    echo "ℹ️  .env.example already exists"
fi

# 3. Generate JWT secrets if .env.local doesn't exist
if [ ! -f ".env.local" ]; then
    echo "\n🔐 Generating JWT secrets..."
    ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    echo "Generated secrets (save these securely):"
    echo "  ACCESS_TOKEN_SECRET: $ACCESS_SECRET"
    echo "  REFRESH_TOKEN_SECRET: $REFRESH_SECRET"
    echo ""
fi

# 4. Check for exposed API keys
echo "🔍 Checking for exposed API keys in .env..."
if grep -q "API_KEY\|SECRET\|PASSWORD" .env 2>/dev/null; then
    echo "⚠️  WARNING: API keys found in .env file!"
    echo "   Make sure this .env is in .gitignore and NOT committed to git"
else
    echo "✅ No hardcoded API keys detected in .env"
fi

# 5. Create directories
echo "\n📁 Creating required directories..."
mkdir -p logs public temp
chmod 755 logs

# 6. Display next steps
cat << 'EOF'

✅ Setup Complete!

📋 Next Steps:
================

1. ⚠️  SECURITY - Revoke exposed API keys:
   - Go to: https://console.cloud.google.com
   - Find and revoke the GEMINI_API_KEY
   
2. 🔐 Set up environment variables:
   - Copy .env.example to .env
   - Fill in your production values
   - DO NOT commit .env to git
   
3. 📦 Verify packages installed:
   npm list helmet express-rate-limit mongo-sanitize xss-clean winston

4. 📝 Create new middleware files:
   - src/middlewares/errorHandler.middleware.js
   - src/middlewares/rateLimiter.js
   - src/utils/logger.js
   
   (See CODE_CHANGES_REFERENCE.md for code)

5. 🔧 Update existing files:
   - src/app.js (CORS, security headers)
   - src/index.js (env validation)
   - src/db/index.js (secure connection)
   - Dockerfile (updated image)

6. ✅ Test locally:
   npm run dev
   # Then visit: http://localhost:8000/ping

7. 🐳 Build Docker image:
   docker build -t video-streaming-backend:latest .

8. 📚 Review documentation:
   - Read: ../DEPLOYMENT_READINESS_PLAN.md
   - Read: ../CODE_CHANGES_REFERENCE.md

📞 Questions?
- Reference the DEPLOYMENT_READINESS_PLAN.md for detailed guidance
- Check CODE_CHANGES_REFERENCE.md for code samples

⏰ Timeline: 3-4 weeks for full production readiness

EOF

echo "\n"
cd ..
