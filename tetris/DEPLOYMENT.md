# Tetris Game Deployment Guide

This Tetris game supports both local development and production deployment with global leaderboard functionality.

## 🚀 Quick Deployment Summary

The game now automatically detects whether it's running in development or production:

- **Development** (localhost): Uses Express server on port 3001
- **Production** (deployed): Uses Vercel serverless functions at `/api/*`

## 📁 Project Structure

```
tetris-video-game/
├── src/                    # Frontend source code
├── server/                 # Express server (development)
├── api/                    # Vercel serverless functions (production)
│   ├── health.js          # Health check endpoint
│   ├── leaderboard.js     # Get leaderboard
│   └── scores.js          # Add/delete scores
└── dist/                  # Built frontend
```

## 🛠️ Development Setup

1. **Start the Express backend:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Start the frontend:**
   ```bash
   npm install
   npm run dev
   ```

3. **Game will show "Global Leaderboard" when backend is connected**

## 🌐 Production Deployment

### Vercel Deployment (Recommended)

1. **The game is ready for Vercel deployment** with the current configuration
2. **Serverless functions** in `/api/` directory automatically handle the backend
3. **No additional server setup required**

### Current Status

- ✅ Frontend: Deployed to Vercel
- ✅ Backend: Serverless functions configured 
- ✅ Environment detection: Automatic
- ✅ Fallback: localStorage when server unavailable

## 🔧 API Endpoints

### Development (localhost:3001)
- `GET /api/health` - Health check
- `GET /api/leaderboard` - Get top 10 scores  
- `POST /api/scores` - Add new score
- `DELETE /api/scores` - Clear all scores

### Production (Vercel serverless)
- `GET /api/health` - Health check
- `GET /api/leaderboard` - Get top 10 scores
- `POST /api/scores` - Add new score
- `DELETE /api/scores` - Clear all scores

## 🎮 Game Features

- **Progressive Speed**: Blocks fall faster each level
- **Speed Indicator**: Shows current speed percentage
- **Global Leaderboard**: Shared scores across all players
- **Local Fallback**: Works offline with localStorage
- **Responsive Design**: Mobile and desktop optimized

## 🔍 Troubleshooting

### "Local scores only" showing on deployed game:

1. **Check browser console** for API errors
2. **Verify serverless functions** are deployed 
3. **Check network tab** for failed API requests

### Backend not working in development:

1. **Start the Express server**: `cd server && npm start`
2. **Check port 3001 is available**: `lsof -i :3001`
3. **Test health endpoint**: `curl http://localhost:3001/api/health`

### iOS-specific issues:

The game includes enhanced iOS compatibility features:

- **Automatic iOS detection** with optimized timeouts
- **Enhanced CORS headers** for Safari compatibility
- **Pre-connectivity testing** before API calls
- **Faster fallback** to localStorage on iOS
- **Cache-busting headers** to prevent iOS caching issues

**iOS debugging steps:**
1. **Open Safari Web Inspector** on Mac (Develop menu)
2. **Check console logs** for iOS-specific messages (🍎 prefix)
3. **Look for connectivity test results** in console
4. **Verify CORS and network errors** in Network tab

**Common iOS fixes:**
- Game automatically uses shorter timeouts on iOS (8s vs 10s)
- Pre-tests connectivity before adding scores
- Falls back to localStorage more aggressively
- Uses iOS-compatible AbortController for timeouts

## 📊 Data Storage

- **Development**: JSON file (`server/scores.json`)
- **Production**: In-memory (resets on function restart)
- **Fallback**: Browser localStorage

## ⚡ Performance Notes

- Serverless functions have **cold start delays**
- Scores **reset periodically** in production (limitation of in-memory storage)
- For **persistent production storage**, consider:
  - Vercel KV (Redis)
  - PlanetScale (MySQL)
  - Supabase (PostgreSQL)

## 🚀 Next Steps for Production

1. **Add persistent database** for score storage
2. **Implement rate limiting** for API endpoints
3. **Add authentication** for admin endpoints
4. **Set up monitoring** and error tracking
5. **Add score verification** to prevent cheating

---

The game now automatically adapts to its environment and provides a seamless experience in both development and production! 🎮
