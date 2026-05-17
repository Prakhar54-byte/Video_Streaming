# 🚀 Spark - Free Deployment Guide

## FREE Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend)

| Component | Platform | Free Limits |
|-----------|----------|-------------|
| Frontend | Vercel | 100GB/month |
| Backend | Render | 750 hours/month |
| Database | MongoDB Atlas | 512MB |

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/spark.git
git push -u origin main
```

## Step 2: Deploy Frontend to Vercel

1. Go to vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Select your repo
5. Add Environment Variables:
   - NEXT_PUBLIC_BACKEND_URL=https://spark-api.onrender.com/api/v1
   - NEXT_PUBLIC_WS_URL=wss://spark-api.onrender.com
6. Deploy!

## Step 3: Deploy Backend to Render

1. Go to render.com
2. Connect GitHub
3. Create Web Service - select BACKEND folder
4. Add all env vars from your .env file
5. Deploy!

## FREE Cost Summary

- Vercel Frontend: FREE
- Render Backend: FREE  
- MongoDB Atlas: FREE
- Cloudinary: FREE
- **Total: FREE**

## Updating Your Site

```bash
git add .
git commit -m "Update"
git push origin main
# Auto-deploys!
```