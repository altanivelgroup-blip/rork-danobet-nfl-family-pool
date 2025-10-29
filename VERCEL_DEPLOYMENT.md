# 🚀 DanoBet NFL Family Pool - Vercel Deployment Guide

## ✅ Project Status
Your DanoBet NFL Family Pool is now ready for Vercel deployment!

## 📋 Pre-Deployment Checklist
All files configured:
- ✅ `vercel.json` created
- ✅ `.gitignore` created
- ✅ All app functionality intact (Picks, Leaderboard, Season, Admin, Landing)
- ✅ Turquoise/Orange theme preserved
- ✅ Brother's memorial photo in place

## 🛠️ Manual Setup Required

Since this project uses the Rork build system, you need to manually add the export script to package.json:

1. Open `package.json`
2. In the `"scripts"` section, add these two lines:
   ```json
   "export:web": "npx expo export --platform web --output-dir dist",
   "build:web": "npx expo export --platform web --output-dir dist"
   ```

Your scripts section should look like:
```json
"scripts": {
  "start": "bunx rork start -p ge4tb5ipbgmk2z7tqwqet --tunnel",
  "start-web": "bunx rork start -p ge4tb5ipbgmk2z7tqwqet --web --tunnel",
  "start-web-dev": "DEBUG=expo* bunx rork start -p ge4tb5ipbgmk2z7tqwqet --web --tunnel",
  "lint": "expo lint",
  "export:web": "npx expo export --platform web --output-dir dist",
  "build:web": "npx expo export --platform web --output-dir dist"
}
```

## 🔐 Environment Variables

Your Firebase configuration is already set up in the code with fallback values. However, if deploying to Vercel, you should set these environment variables in the Vercel Dashboard for security:

**Required Environment Variables:**
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_RORK_API_BASE_URL` (set to your Vercel URL after deployment)

**Note:** Since this is a Rork project with backend enabled, the `EXPO_PUBLIC_RORK_API_BASE_URL` will be automatically configured. However, you may need to set it manually if you encounter API connection issues.

You can find these values in `.env.example` file.

## 🌐 Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from your project root:**
   ```bash
   vercel
   ```
   
   When prompted:
   - Set up and deploy: **Yes**
   - Scope: Choose your account
   - Link to existing project: **No**
   - Project name: `danobet-nfl-family-pool`
   - Directory: `.` (current directory)
   - Override settings: **No**

4. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Push to GitHub:**
   - Create a new GitHub repository
   - Push your code:
     ```bash
     git init
     git add .
     git commit -m "Initial commit - DanoBet NFL Family Pool"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/danobet-nfl-family-pool.git
     git push -u origin main
     ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the `vercel.json` configuration
   - Click "Deploy"

## 🔧 Build Configuration

The `vercel.json` is already configured with:
- **Build Command:** `npm run export:web`
- **Output Directory:** `dist`
- **Framework:** None (Expo handled)
- **Install Command:** `bun install`

## 🎨 What's Preserved

All your features remain intact:
- 🏈 **Landing Page** - Your brother's memorial photo with turquoise/orange theme
- 🎯 **Picks Screen** - NFL game picking functionality
- 🏆 **Leaderboard** - Family rankings
- 📊 **Season Tracker** - Score tracking
- 👵 **Grandma's Special** - Superbowl winner celebration
- ⚙️ **Admin Panel** - With red sign-out button

## 🌍 After Deployment

Once deployed, you'll receive a URL like:
- **Production:** `https://danobet-nfl-family-pool.vercel.app`
- **Preview:** Unique URLs for each deployment

### Share with Family:
1. Share the production URL
2. Works on all devices (mobile, tablet, desktop)
3. Optimized for mobile browsers
4. Automatic SSL (HTTPS)
5. Global CDN for fast loading

## 🔄 Future Updates

Every time you push to GitHub (if using Option 2):
- Vercel automatically rebuilds and deploys
- Preview deployments for branches
- Production deployment for `main` branch

Or use Vercel CLI:
```bash
vercel --prod
```

## ⚡ Performance Features

Configured for optimal performance:
- Static asset caching (1 year)
- SPA routing (all routes → index.html)
- Compressed assets
- Fast global CDN delivery

## 🆘 Troubleshooting

**Build fails?**
- Ensure the export scripts are added to package.json
- Check that all dependencies are installed
- Verify Firebase config is correct

**App not loading?**
- Check browser console for errors
- Verify API endpoints are accessible
- Check Firebase configuration

**Routing issues?**
- The rewrite rule in vercel.json handles all routing
- Make sure expo-router is properly configured

## 📞 Support

If you encounter issues:
1. Check Vercel build logs
2. Verify all files are committed
3. Ensure environment variables are set in Vercel dashboard (if needed)

---

**Built with ❤️ in honor of your brother**
**DanoBet NFL Family Pool - Bringing family together through football**

🏈 Go make those picks!
