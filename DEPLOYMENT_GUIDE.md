# GENESIS Registration Portal - Deployment Guide

## 📋 Project Overview
- **Frontend**: React + Vite (Registration + Admin Portal)
- **Backend**: Node.js + Express + MongoDB
- **Features**: Team Registration, Payment Status, Admin Dashboard, Email Notifications

---

## 🚀 Deployment Strategy: Dual Links

### **Link 1: Registration Portal**
- URL: `https://genesis-registration.yourdomain.com`
- Purpose: Public registration and payment status check
- Routes: Landing, Register, Review, Payment, Success, CheckStatus

### **Link 2: Admin Portal**
- URL: `https://genesis-admin.yourdomain.com`
- Purpose: Admin dashboard for payment verification and exports
- Routes: Admin Login, Dashboard, Export

---

## 📁 Project Structure Cleanup

### Files to Keep (Essential)
```
Registration/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── pages/            # All pages kept
│   │   ├── components/       # All components
│   │   ├── utils/            # Utilities
│   │   ├── api.js            # API configuration
│   │   ├── App.jsx           # Router setup
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── public/               # Static assets
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── server/                    # Node Backend
│   ├── controllers/          # Business logic
│   ├── routes/               # API routes
│   ├── models/               # MongoDB schemas
│   ├── middleware/           # Auth, validation
│   ├── utils/                # Email, Cloudinary, Excel export
│   ├── .env                  # Environment variables
│   ├── index.js              # Server entry point
│   └── package.json
├── package.json              # Root package.json
└── .env                      # Root environment (optional)
```

### Files to Remove (Documentation Only)
```
❌ BUG_FIXES_REPORT.md
❌ COMPLETE_DEBUG_GUIDE.md
❌ DEBUG_TEST.html
❌ DESIGN_ENHANCEMENT_REPORT.md
❌ EMAIL_SETUP.md
❌ EMAIL_TRACKING_FEATURE.md
❌ FEATURES_UPDATE.md
❌ FIX_STATUS.md
❌ IMPLEMENTATION_REPORT.md
❌ NEW_FEATURES.md
❌ QUICK_START.md
❌ SETTINGS_TESTING_GUIDE.md
❌ SETUP_GUIDE.md
❌ SYSTEM_SETUP_GUIDE.md
❌ test_email.js
❌ THEME_COMPARISON.md
❌ THEME_UPDATE.md
❌ UPDATE_SUMMARY.md
❌ VISUAL_GUIDE.md
❌ WHATSAPP_INTEGRATION_UPDATE.md
```

---

## ✅ Pre-Deployment Checklist

### Backend (.env Configuration)
```env
# Must Set Before Deployment
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.XXXXX.mongodb.net/?appName=Cluster0
JWT_SECRET=your-strong-secret-key-min-32-chars
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_ACCESS_CODE=your-admin-access-code
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend (API Endpoint)
Update `client/src/api.js`:
```javascript
const api = axios.create({
    baseURL: 'https://api.yourdomain.com/api', // Change from localhost:5000
});
```

---

## 🌐 Deployment Options

### **Option 1: Two Separate Deployments (Recommended)**

#### Admin Portal Deployment
```bash
# Deploy to admin subdomain
# Frontend: Vercel/Netlify with separate repo
# Backend: Already handles both APIs
# Config: REACT_APP_API_URL=https://api.yourdomain.com/api
```

#### Registration Portal Deployment
```bash
# Deploy to main/registration subdomain
# Frontend: Vercel/Netlify
# Backend: Same backend serves both
# Config: REACT_APP_API_URL=https://api.yourdomain.com/api
```

#### How to Create Separate Frontend Deployments:
1. Create two separate repos from same codebase
2. Configure environment variables per deployment
3. Both point to same backend API

---

## 🚀 Step-by-Step Deployment

### **Phase 1: Backend Deployment (5 minutes)**

#### Option A: Heroku (Free tier available)
```bash
# Install Heroku CLI
heroku login
heroku create genesis-hackathon-api
heroku config:set PORT=5000
heroku config:set MONGO_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-secret"
# ... set all other env variables
git push heroku main
```

#### Option B: Railway.app (Recommended)
```bash
1. Go to railway.app
2. Create new project → Select GitHub repo
3. Add MongoDB plugin
4. Add environment variables in dashboard
5. Deploy automatically on push
```

#### Option C: DigitalOcean App Platform
```bash
1. Create App Platform app
2. Select GitHub repository
3. Configure environment variables
4. Set Node.js 18 as runtime
5. Deploy
```

### **Phase 2: Frontend Deployment (Registration Portal)**

#### Deployment to Vercel/Netlify
```bash
# Build the application
cd client
npm run build

# Deploy via CLI or Git integration
vercel deploy --prod
# OR
netlify deploy --prod

# Configuration needed:
# - API_URL=https://your-backend.com/api
# - Domain: registration.yourdomain.com
```

### **Phase 3: Admin Portal Deployment**

#### Deploy Same Code to Different Domain
```bash
# Create separate environment file
VITE_API_URL=https://your-backend.com/api
VITE_ADMIN_MODE=true

# Deploy to admin.yourdomain.com
# Same steps as Phase 2
```

---

## 🔧 Configuration by Deployment Platform

### **MongoDB Atlas Setup**
```
1. Create cluster at mongodb.com
2. Create database user (NOT admin)
3. Get connection string: mongodb+srv://user:pass@cluster.mongodb.net/genesis_hackathon
4. Whitelist all IPs (0.0.0.0/0) for production OR specific server IPs
```

### **Email Configuration**
```
Provider: Gmail
1. Enable 2-factor authentication
2. Create app-specific password
3. Add to .env as EMAIL_PASS
4. Add EMAIL_USER=your-email@gmail.com
```

### **Cloudinary Setup**
```
1. Sign up at cloudinary.com
2. Get credentials from dashboard
3. Add to .env:
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
```

---

## 📊 DNS & Domain Setup

### **For Two Subdomains**
```
Type    Name            Value
A       @               API Server IP
CNAME   api             your-api-provider.com
CNAME   registration    your-frontend1.vercel.app
CNAME   admin           your-frontend2.netlify.app
```

### **For Single Domain with Paths**
```
https://yourdomain.com/              → Registration Portal
https://yourdomain.com/admin         → Admin Login
https://api.yourdomain.com/api/      → Backend API
```

---

## 🔐 Security Checklist

- ✅ Never commit `.env` files (add to `.gitignore`)
- ✅ Use strong JWT_SECRET (min 32 chars, random)
- ✅ Enable HTTPS everywhere
- ✅ Set MongoDB whitelist to specific IPs only (production)
- ✅ Use environment-specific variables
- ✅ Enable CORS only for your domains
- ✅ Rate limit API endpoints
- ✅ Store credentials in deployment platform secrets, not repo

---

## 🚨 Critical Environment Variables

### Required for Backend
```
MONGO_URI           - MongoDB connection string
JWT_SECRET          - Random 32+ char string
PORT                - Usually 5000 or 3001
CLOUDINARY_*        - Three Cloudinary credentials
EMAIL_USER          - Gmail address
EMAIL_PASS          - Gmail app password
ADMIN_ACCESS_CODE   - Admin registration code
```

### Required for Frontend
```
VITE_API_URL        - Backend API endpoint
VITE_APP_NAME       - "GENESIS Hackathon"
```

---

## 📈 Post-Deployment Testing

### **Test Registration Flow**
1. Visit registration portal
2. Register a team
3. Verify confirmation email sent
4. Check admin dashboard shows team
5. Update payment status
6. Verify payment email sent

### **Test Admin Portal**
1. Login with admin credentials
2. View all teams
3. Update payment status
4. Export CSV
5. Check settings update

### **Test API Endpoints**
```bash
# Get stats
curl https://api.yourdomain.com/api/teams/stats

# Login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🔄 Monitoring & Updates

### **Monitor in Production**
- Check application logs
- Monitor error rates
- Track response times
- Monitor MongoDB connection

### **Updating Code**
```bash
# Just push to main branch (if using Git integration)
git push origin main

# Automatic deployment triggers on:
# - Vercel: Push to repo
# - Railway: Push to repo
# - Heroku: Manual or via GitHub integration
```

---

## 📞 Support URLs After Deployment

| Service | URL |
|---------|-----|
| **Registration** | https://registration.yourdomain.com |
| **Admin Portal** | https://admin.yourdomain.com |
| **API** | https://api.yourdomain.com/api |
| **Payment Check** | https://registration.yourdomain.com/check-status |
| **Admin Login** | https://admin.yourdomain.com/admin |

---

## 🎯 Next Steps

1. **Choose deployment platform** (Recommended: Railway.app or Vercel)
2. **Set up MongoDB Atlas** 
3. **Prepare environment variables**
4. **Deploy backend first**
5. **Update frontend API URLs**
6. **Deploy frontends**
7. **Test all flows**
8. **Set up custom domains**
9. **Monitor for errors**

---

## 💡 Tips

- Use Railway.app for simplest setup (includes free MongoDB)
- Keep backend and frontend separate for easier updates
- Test locally before deployment
- Use staging environment for testing
- Enable automatic deployments from GitHub
- Set up monitoring/alerts for production

---

**Last Updated**: January 29, 2026  
**Status**: Ready for Deployment ✅
