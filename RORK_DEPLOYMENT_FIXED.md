# 🚀 DanoBet NFL Family Pool - Rork Platform Deployment (FIXED)

## ✅ What Was Fixed

### Problem
Your app was deployed at `https://danobet-nfl-family-pool.rork.app` but buttons and API calls weren't working.

### Root Causes
1. **Backend routing mismatch** - Backend was listening on `/trpc/*` but clients expected `/api/trpc/*`
2. **Missing base URL fallback** - No fallback for web deployment when environment variable isn't set
3. **CORS configuration** - Needed proper CORS headers for API calls

### Files Fixed

#### 1. `lib/trpc.ts` ✅
- Added automatic base URL detection using `window.location.origin`
- Added fallback to production URL: `https://danobet-nfl-family-pool.rork.app`
- Now works without requiring `EXPO_PUBLIC_RORK_API_BASE_URL` environment variable

#### 2. `backend/hono.ts` ✅
- Fixed route path from `/trpc/*` to `/api/trpc/*`
- Now matches client expectations
- CORS already configured correctly

#### 3. `vercel.json` ✅
- Updated build command from `npm run` to `bun run`
- Added security headers
- SPA routing configured

---

## 🎯 How It Works Now

When deployed on Rork platform:

1. **Frontend** loads from `https://danobet-nfl-family-pool.rork.app`
2. **API calls** automatically go to `https://danobet-nfl-family-pool.rork.app/api/trpc`
3. **Backend** (Hono + tRPC) serves API from `/api/trpc/*`
4. **Database** uses Firebase Firestore

---

## 🔄 Redeploying

To deploy your fixes to production:

### Option 1: Using Rork Build (Recommended)
```bash
bun run build:web
```

This will:
- Build the frontend for web
- Bundle the backend API
- Deploy both to your `.rork.app` domain

### Option 2: Manual Export + Deploy
```bash
# Export web build
npx expo export --platform web --output-dir dist

# Deploy using Rork's deployment system
bunx rork build --web
```

---

## 🧪 Testing After Deployment

1. **Test Landing Page**: Visit `https://danobet-nfl-family-pool.rork.app`
   - Should show your brother's photo
   - "Make Your Picks" button should work
   
2. **Test Picks Screen**:
   - Click "Make Your Picks"
   - Should see Week number and games
   - Select family member
   - Pick winners for games
   - Submit picks

3. **Test Leaderboard**:
   - Navigate to Leaderboard tab
   - Should show family rankings

4. **Test API Health**:
   - Visit: `https://danobet-nfl-family-pool.rork.app/api`
   - Should return: `{"status":"ok","message":"API is running"}`

---

## 🛠 Architecture

```
┌─────────────────────────────────────┐
│  Frontend (React Native Web)        │
│  - Expo Router                      │
│  - tRPC Client                      │
└──────────────┬──────────────────────┘
               │
               │ HTTPS
               ↓
┌─────────────────────────────────────┐
│  Backend (Hono + tRPC)              │
│  - Routes: /api/trpc/*              │
│  - CORS enabled                     │
└──────────────┬──────────────────────┘
               │
               │ Firebase SDK
               ↓
┌─────────────────────────────────────┐
│  Firebase Firestore                 │
│  - Picks storage                    │
│  - User data                        │
└─────────────────────────────────────┘
```

---

## 📱 All Features Working

- ✅ Landing page with memorial photo
- ✅ Picks submission (all family members)
- ✅ Leaderboard rankings
- ✅ Season tracker
- ✅ Admin panel with sign-out
- ✅ Grandma's Special celebration
- ✅ Live NFL data from ESPN API
- ✅ Mobile responsive design

---

## 🔐 Environment Variables

The app works without needing to set environment variables because:

1. **Firebase config** has hardcoded fallbacks in `config/firebase.ts`
2. **API base URL** auto-detects from `window.location.origin`
3. **Rork backend URL** falls back to production URL

If you want to override, set in Rork dashboard:
- `EXPO_PUBLIC_RORK_API_BASE_URL` - Custom API URL
- `EXPO_PUBLIC_FIREBASE_*` - Custom Firebase config

---

## 🚨 Common Issues & Fixes

### Issue: Buttons don't respond
**Fix**: Clear browser cache and hard reload (Cmd/Ctrl + Shift + R)

### Issue: API calls fail with CORS error
**Fix**: Already fixed - backend has CORS enabled

### Issue: "No base url found" error
**Fix**: Already fixed - automatic fallback added

### Issue: Games not loading
**Fix**: Check ESPN API availability and Firebase connection

---

## 📦 Deployment Checklist

Before deploying:
- [x] Backend routes fixed (`/api/trpc/*`)
- [x] Frontend base URL auto-detection added
- [x] CORS configured
- [x] Firebase config with fallbacks
- [x] All features tested locally

To deploy:
- [ ] Run `bun run build:web`
- [ ] Wait for deployment to complete
- [ ] Test production URL
- [ ] Share with family!

---

## 🎨 Color Scheme (Preserved)

- Primary: `#0097A7` (Turquoise)
- Secondary: `#FF6B00` (Orange)
- Background: `#002C5F` (Navy Blue)
- Success: `#10b981` (Green)
- Danger: `#FC4C02` (Red)

---

## 🏈 Built with Love

This app honors your brother's memory and brings your family together through football.

**"This isn't just football. It's family."**

---

## 📞 Next Steps

1. **Deploy**: Run `bun run build:web`
2. **Test**: Visit your live URL
3. **Share**: Send link to family
4. **Enjoy**: Make picks together!

Your app is ready to go live! 🚀
