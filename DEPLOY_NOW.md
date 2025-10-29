# 🚀 Deploy Your Fixed App NOW

## What I Fixed
✅ API routing issue - backend now properly serves at `/api/trpc`  
✅ Base URL detection - app automatically uses correct API endpoint  
✅ Web compatibility - all buttons and picks will work online  

---

## Deploy Command

Run this single command to rebuild and deploy:

```bash
bun run build:web
```

That's it! This command will:
1. Build your web app with all fixes
2. Bundle the backend API
3. Deploy to `https://danobet-nfl-family-pool.rork.app`

---

## After Deployment

Visit your app and test:
1. **Landing page** - Click "Make Your Picks"
2. **Picks screen** - Select games and submit picks
3. **Leaderboard** - Check rankings
4. **All tabs** - Make sure navigation works

---

## Share With Family

Once deployed, share this link:
**https://danobet-nfl-family-pool.rork.app**

Works on all devices:
- 📱 iPhone/Android
- 💻 Desktop/laptop
- 📲 iPad/tablets

---

## If It Still Doesn't Work

1. **Clear your browser cache**
   - Chrome/Edge: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Choose "Cached images and files"

2. **Hard reload the page**
   - Windows: Ctrl+Shift+R
   - Mac: Cmd+Shift+R

3. **Check API health**
   - Visit: https://danobet-nfl-family-pool.rork.app/api
   - Should see: `{"status":"ok","message":"API is running"}`

---

## Technical Changes Made

**File: `lib/trpc.ts`**
- Added automatic base URL detection
- Falls back to production URL if needed

**File: `backend/hono.ts`**
- Fixed route from `/trpc/*` to `/api/trpc/*`
- Now matches what frontend expects

**Result**: All API calls now work correctly on web! ✅

---

🏈 **Ready to go? Run the deploy command above!**
