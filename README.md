# AMS Fabric - Desktop Chatbot Web App

A professional desktop-style chatbot web application built with vanilla HTML, CSS, and JavaScript for the AMS Fabric intelligent assistant.

## ✨ Features

- **Desktop-Oriented UI**: Full-height application window with sidebar and chat panel
- **Conversation Management**: Create, switch between, and search conversations
- **Message History**: All conversations persist in localStorage
- **Code Block Support**: Automatically formats code blocks with triple backticks
- **Dark Mode**: Toggle between light and dark themes
- **Keyboard Shortcuts**: 
  - `Enter` to send
  - `Shift+Enter` for new line
  - `Ctrl/Cmd+K` to focus search
  - `Esc` to clear input
- **Smart Scrolling**: Auto-scrolls to latest message unless user has scrolled up
- **Error Handling**: Graceful error display with retry functionality

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Minimum screen width: 1024px

### Local Development

1. **Clone or download this repository**

2. **Start a local server**:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Or use VS Code Live Server extension
   # Right-click index.html → "Open with Live Server"
   ```

3. **Open in browser**: http://localhost:8000

4. **Start chatting**: Click "+ New Chat" and send your first message!

## 📁 Project Structure

```
AMS_Fabric/
├── index.html      # Main HTML structure
├── style.css       # Styling (light/dark themes)
├── app.js          # Application logic and API integration
└── README.md       # Documentation
```

## ⚙️ Configuration

### API Endpoint

The API endpoint is configured in [app.js](app.js) (line 5):

```javascript
const API_URL = "https://vscode-relaxed-whale-wd.cfapps.us10-001.hana.ondemand.com/submit";
```

**Request Format:**
```json
POST /submit
Content-Type: application/json

{
  "query": "Your question here"
}
```

**Expected Response:**
```json
{
  "message": "Response",
  "name": "The actual answer content..."
}
```

### CORS Proxy (Required)

Since the backend API does not support CORS, the app uses a CORS proxy service to handle requests. This is configured and enabled by default in [app.js](app.js).

**Primary Proxy**: `https://corsproxy.io/`

If the primary proxy experiences issues, you can switch to an alternative by editing [app.js](app.js) line 10:
```javascript
// Option 1 (default)
const CORS_PROXY = "https://corsproxy.io/?";

// Option 2 (backup)
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

// Option 3 (backup)
const CORS_PROXY = "https://api.codetabs.com/v1/proxy?quest=";
```

⚠️ **Note**: CORS proxy services are third-party and may have rate limits or downtime. The app will continue to work as long as the proxy service is available.

## 🌐 Deployment

### GitHub Pages

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/AMS_Fabric.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: `main` branch, `/ (root)` folder
   - Save

3. **Access**: https://YOUR_USERNAME.github.io/AMS_Fabric/

### Alternative Hosting

Compatible with any static hosting service:
- Netlify
- Vercel
- Azure Static Web Apps
- AWS S3 + CloudFront
- Any web server (Apache, Nginx, IIS)

## 🔧 Production Checklist

- [x] CORS proxy enabled and configured
- [ ] Verify API endpoint URL is correct
- [ ] Test CORS proxy is working (send test message)
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on minimum screen width (1024px)
- [ ] Verify dark mode works correctly
- [ ] Test conversation persistence (refresh page)
- [ ] Verify error handling and retry functionality

## 🎨 Customization

### Change Theme Colors

Edit CSS variables in [style.css](style.css):

```css
:root {
    --accent-primary: #007aff;  /* Primary brand color */
    --user-bubble: #007aff;     /* User message color */
}
```

### Modify App Title

Edit [index.html](index.html):
```html
<h1 class="app-title">AMS Fabric</h1>
<p class="app-subtitle">Intelligent Assistant</p>
```

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔒 Security Notes

- All data stored locally in browser's localStorage
- No external dependencies or CDN links
- No authentication tokens in frontend code
- Recommend implementing authentication via backend

## 📄 License

This project is provided for the AMS Fabric application.

---

**Built for AMS Fabric | 2026**
