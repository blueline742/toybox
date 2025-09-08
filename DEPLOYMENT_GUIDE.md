# Toybox Brawl Deployment Guide

## Current Architecture
- **Frontend**: React + Vite (can be deployed to Netlify)
- **Backend**: Node.js + Socket.io server (requires separate hosting)

## Frontend Deployment (Netlify)

### Setup Complete ✅
1. Code is pushed to GitHub
2. `netlify.toml` configuration file created
3. Build settings configured

### Next Steps in Netlify Dashboard:
1. Connect your GitHub repository (blueline742/toybox)
2. Deploy settings should auto-detect from `netlify.toml`
3. Set environment variable in Netlify dashboard:
   - `VITE_SERVER_URL` = Your backend server URL (see below)

## Backend Deployment Required

The game requires a separate backend server for:
- Real-time multiplayer battles (Socket.io)
- Battle engine processing
- Matchmaking

### Backend Hosting Options:

#### Option 1: Render.com (Recommended - Free tier available)
1. Create account at render.com
2. New > Web Service
3. Connect GitHub repo
4. Settings:
   - Build Command: `npm install`
   - Start Command: `cd backend && node server.js`
   - Add environment variable: `PORT=3000`

#### Option 2: Railway.app
1. Create account at railway.app
2. New Project > Deploy from GitHub
3. Select your repo
4. Add start command in railway.json or dashboard

#### Option 3: Heroku (Paid only now)
1. Create a `Procfile` in root:
   ```
   web: cd backend && node server.js
   ```
2. Deploy via Heroku CLI or GitHub integration

#### Option 4: DigitalOcean App Platform
- $5/month minimum
- Good for production

## Environment Variables Setup

### Frontend (.env.production)
```
VITE_SERVER_URL=https://your-backend-url.com
```

### Backend Environment Variables
```
PORT=3000
NODE_ENV=production
```

## Post-Deployment Checklist

1. ✅ Frontend deployed to Netlify
2. ⬜ Backend deployed to separate service
3. ⬜ Update `VITE_SERVER_URL` in Netlify environment variables
4. ⬜ Test multiplayer functionality
5. ⬜ Configure CORS in backend if needed

## Important Notes

- The backend MUST be deployed separately from Netlify
- Netlify only hosts static sites, not Node.js servers
- WebSocket connections (Socket.io) require a persistent server
- Free tiers may have limitations (cold starts, limited hours)

## Testing Production

1. Open browser console
2. Check network tab for WebSocket connections
3. Verify socket connects to backend URL
4. Test PvP matchmaking with two browser tabs

## Troubleshooting

### "Cannot connect to server"
- Check backend is running
- Verify VITE_SERVER_URL is correct
- Check CORS settings in backend/server.js

### "WebSocket connection failed"
- Some hosting services need special WebSocket configuration
- Check hosting provider's WebSocket documentation

### Cold Start Issues
- Free tiers often sleep after inactivity
- First connection may take 10-30 seconds
- Consider paid tier for production