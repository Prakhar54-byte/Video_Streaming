# Video Streaming Platform 🎥

A full-stack video streaming platform built with MERN stack (MongoDB, Express, React, Node.js) with adaptive bitrate streaming capabilities.

## 🌟 Key Features

- ✅ User authentication (JWT)
- ✅ Basic video upload
- 🔜 **Adaptive Bitrate Streaming** (HLS protocol) [Planned]
- 🔜 Video processing pipeline [Planned]

## 🏗️ Project Structure

```
Video_Streaming/
├── BACKEND/
│ ├── src/
│ │ ├── config/ # DB & cloud configurations
│ │ ├── controllers/ # Business logic
│ │ ├── models/ # MongoDB schemas
│ │ ├── routes/ # API endpoints
│ │ ├── middleware/ # Auth & validation
│ │ └── utils/ # FFmpeg helpers, file processors
├── FRONTEND/
│ ├── public/
│ ├── src/
│ │ ├── components/ # React UI components
│ │ ├── context/ # State management
│ │ ├── hooks/ # Custom hooks
│ │ ├── pages/ # Next.js routing
│ │ └── styles/ # SCSS modules
├── infrastructure/ # Docker, Nginx configs
└── scripts/ # FFmpeg conversion scripts
```

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/Video_Streaming.git

# Backend setup
cd Video_Streaming/BACKEND
npm install
npm run dev

# Frontend setup
cd ../FRONTEND
npm install
npm run dev

## 🏗️ Current Project Status

This project is in active development. Currently implemented features include:
- User authentication
- Basic frontend UI with Next.js and Tailwind
- Backend API structure

See the Future Roadmap section for planned features.



## 🚀 Technical Impact

### 1. Performance Optimization
- **HLS Segmentation**: Videos split into 10s chunks for adaptive streaming
- **CDN Integration**: Cloudflare caching for static assets
- **Lazy Loading**: React code splitting for faster initial load

### 2. Security Measures
- AES-256 encryption for video files
- Signed URLs for video access
- Rate limiting (100req/min)
- CSRF protection & CORS policies

### 3. Scalability Features
- Horizontal scaling with Redis caching
- Mongoose pagination (100 videos/page)
- Background workers for video processing




| Feature          | Typical Platforms       | Our Implementation       |
|------------------|-------------------------|--------------------------|
| Video Processing | Third-party services    | FFmpeg + Node.js workers |
| Quality Options  | Fixed resolutions       | Auto 360p-4K switching   |
| Analytics        | Basic view count        | Frame-by-frame heatmaps  |
| Cost             | Per-minute billing      | Open-source stack        |
| Deployment       | Monolithic              | Microservices-ready      |

## 🛠️ Setup Guide

### Prerequisites
- Node.js v18+
- MongoDB Atlas cluster
- FFmpeg 6.0
- Redis server


## 📊 Tech Stack
**Core**
- MERN Stack (MongoDB, Express, React, Node.js)
- HLS.js & video.js player

**Supplementary**
- FFmpeg for transcoding
- JWT for authentication
- Websockets for real-time stats
- AWS S3/MinIO for storage
- Jest & Cypress for testing

## 📈 Future Roadmap
- [ ] P2P streaming with WebRTC
- [ ] AI-powered content recommendations
- [ ] Multi-language subtitles
- [ ] Live streaming capabilities
```
