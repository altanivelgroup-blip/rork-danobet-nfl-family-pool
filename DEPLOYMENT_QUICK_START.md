# 🚀 Quick Start - Deploy DanoBet to Vercel

## Step 1: Add Export Script ✏️
Open `package.json` and add these lines to the "scripts" section:
```json
"export:web": "npx expo export --platform web --output-dir dist",
"build:web": "npx expo export --platform web --output-dir dist"
```

## Step 2: Deploy 🌐

### Fastest Method (CLI):
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Or via GitHub:
```bash
# Push to GitHub
git init
git add .
git commit -m "DanoBet NFL Family Pool"
git remote add origin YOUR_REPO_URL
git push -u origin main

# Then go to vercel.com → Import from GitHub
```

## Step 3: Get Your URL 🔗
After deployment, Vercel gives you:
- **Production URL:** `https://danobet-nfl-family-pool.vercel.app`
- Share this with your family!

## Step 4: Set Environment Variables (Optional) 🔐
In Vercel Dashboard → Settings → Environment Variables, add:
- Firebase credentials (see `.env.example`)
- `EXPO_PUBLIC_RORK_API_BASE_URL` (your deployed URL)

---

## ✅ What's Already Done:
- ✅ `vercel.json` configured
- ✅ `.gitignore` created  
- ✅ All features working (Landing, Picks, Leaderboard, Season, Admin)
- ✅ Mobile-optimized design
- ✅ Your brother's photo in place
- ✅ Turquoise/orange theme preserved

---

## 📱 After Deployment:
Share the URL with your family - it works on:
- 📱 iPhone & Android
- 💻 Desktop browsers
- 📲 iPad & tablets

**Need help?** Check `VERCEL_DEPLOYMENT.md` for detailed instructions.

---

**Built in honor of your brother 🏈❤️**
