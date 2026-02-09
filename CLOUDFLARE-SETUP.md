# Cloudflare Worker Setup (5 minutes, FREE)

Since public CORS proxies are unreliable from GitHub Pages, use a free Cloudflare Worker:

## Steps:

### 1. Create Cloudflare Account
- Go to https://workers.cloudflare.com
- Sign up (free, no credit card needed)

### 2. Create Worker
- Click "Create a Service"
- Name it: `ams-fabric-proxy`
- Click "Create service"

### 3. Add Code
- Click "Quick edit"
- Delete all existing code
- Copy entire contents of `cors-proxy-worker.js`
- Paste into the editor
- Click "Save and Deploy"

### 4. Get Your Worker URL
- You'll see: `https://ams-fabric-proxy.YOUR-SUBDOMAIN.workers.dev`
- Copy this URL

### 5. Update Your App
In `app.js`, change line 10 to:
```javascript
const CORS_PROXY = ""; // Leave empty
```

And change line 17 to use your worker URL:
```javascript
const FINAL_API_URL = "https://ams-fabric-proxy.YOUR-SUBDOMAIN.workers.dev";
```

### 6. Deploy
```bash
git add .
git commit -m "Add Cloudflare Worker proxy"
git push
```

Done! Your app will now work reliably on GitHub Pages.

## Why This Works:
- Your Cloudflare Worker acts as your own proxy
- Adds CORS headers to responses
- Free tier: 100,000 requests/day
- Fast, reliable, no rate limits
