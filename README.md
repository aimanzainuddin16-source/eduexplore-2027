# EduExplore 2027 (v1.0)
**Tagline:** *Learn. Explore. Create.*  
Bilingual (Bahasa Melayu + English) mobile-first educational Progressive Web App (PWA) designed for Malaysian Year 1 primary school students.

---

## 1. Local Development Setup

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build for production
npm run build
```

---

## 2. GitHub & Vercel Deployment Instructions

1. **Initialize Git & Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: EduExplore 2027 v1.0 PWA"
   git branch -M main
   git remote add origin https://github.com/<your-username>/eduexplore-2027.git
   git push -u origin main
   ```
2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com) and import your `eduexplore-2027` GitHub repository.
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - Add your Firebase environment variables from `.env.example` under **Project Settings → Environment Variables**.
3. **Configure Firebase Authorized Domains:**
   - Open **Firebase Console → Authentication → Settings → Authorized domains** and add your deployed `*.vercel.app` URL.

---

## 3. Installing EduExplore 2027 on Android (Google Chrome)

1. Open your deployed HTTPS Vercel URL in **Google Chrome** on an Android smartphone.
2. Tap the **Chrome menu (`⋮`)** and select **"Install app"** or **"Add to Home screen"**.
3. Confirm installation to place the **EduExplore 2027** icon on your Home Screen.
4. Launch from the Home Screen icon for full-screen standalone learning!
