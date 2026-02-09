# AMS Fabric - GitHub Pages Deployment Guide

## Quick Deploy (No Git Installation Required)

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `AMS_Fabric` (or any name you prefer)
3. Set to **Public**
4. ✅ Check "Add a README file"
5. Click "Create repository"

### Step 2: Upload Files
1. In your new repository, click "Add file" → "Upload files"
2. Drag and drop these files from `C:\AMS_Fabric`:
   - index.html
   - style.css
   - app.js
   - README.md
3. Scroll down and click "Commit changes"

### Step 3: Enable GitHub Pages
1. Go to your repository Settings (top right)
2. Click "Pages" in the left sidebar
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click "Save"
5. Wait 1-2 minutes for deployment

### Step 4: Access Your App
Your app will be available at:
```
https://YOUR_USERNAME.github.io/AMS_Fabric/
```

(Replace YOUR_USERNAME with your GitHub username)

---

## Alternative: Deploy with Git (After Installing)

If you install Git, run these commands:

```bash
cd C:\AMS_Fabric
git init
git add .
git commit -m "Deploy AMS Fabric chatbot"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/AMS_Fabric.git
git push -u origin main
```

Then follow Step 3 above to enable GitHub Pages.

---

## Troubleshooting

**Issue**: App shows directory listing instead of chatbot
- **Solution**: Make sure `index.html` is in the root directory

**Issue**: API not working
- **Solution**: CORS proxy is already configured, should work automatically

**Issue**: 404 error on GitHub Pages
- **Solution**: Wait 2-3 minutes after enabling Pages, then hard refresh (Ctrl+Shift+R)

---

**Need help?** Check the main README.md for full documentation.
