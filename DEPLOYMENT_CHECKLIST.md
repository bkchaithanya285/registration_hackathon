# 🚀 DEPLOYMENT CHECKLIST - CreateX Hackathon

## Pre-Deployment (Do These First)

### 1. Clean Project Files
- [ ] Run `cleanup.bat` (Windows) or `cleanup.sh` (Mac/Linux)
- [ ] Verify all unnecessary files are removed
- [ ] Check no `.env` files are in git history

### 2. Environment Setup
- [ ] Copy `.env.production.example` to `server/.env`
- [ ] Fill in MongoDB Atlas connection string
- [ ] Fill in Cloudinary credentials
- [ ] Fill in Gmail app password
- [ ] Set strong JWT_SECRET
- [ ] Update `client/src/api.js` with production API URL

### 3. Local Testing
- [ ] Run `npm run install-all`
- [ ] Start both servers: `npm start`
- [ ] Test registration flow end-to-end
- [ ] Test admin login and dashboard
- [ ] Test payment status check
- [ ] Verify email sending works
- [ ] Check all buttons and links work
- [ ] Test on mobile devices

### 4. Code Review
- [ ] No console.log() calls left (optional, remove for production)
- [ ] No hardcoded URLs (all use environment variables)
- [ ] No secrets in codebase
- [ ] Error handling is proper
- [ ] API responses are correct format

---

## Backend Deployment

### Choose Platform (Pick One)

#### ✅ Railway.app (EASIEST - Recommended)
- [ ] Go to railway.app
- [ ] Create account (GitHub login)
- [ ] Create new project
- [ ] Select GitHub repository
- [ ] Add environment variables from `.env`
- [ ] Add MongoDB plugin (optional, or use MongoDB Atlas)
- [ ] Deploy
- [ ] Get API URL from deployment
- [ ] Test API endpoint

#### Alternative: Heroku
- [ ] Install Heroku CLI
- [ ] `heroku login`
- [ ] `heroku create createx-api`
- [ ] Add environment variables: `heroku config:set MONGO_URI=...`
- [ ] Push to deploy: `git push heroku main`
- [ ] Get API URL

#### Alternative: DigitalOcean
- [ ] Create DigitalOcean account
- [ ] Create App Platform
- [ ] Select GitHub repo
- [ ] Add environment variables
- [ ] Deploy

---

## Frontend Deployment

### Registration Portal

#### Via Vercel (EASIEST)
- [ ] Go to vercel.com
- [ ] Sign in with GitHub
- [ ] Import repository
- [ ] Set build command: `cd client && npm run build`
- [ ] Set output directory: `client/dist`
- [ ] Add environment variables:
  - `VITE_API_URL=https://your-backend-api.com/api`
- [ ] Deploy
- [ ] Get domain: `registration-yourdomain.vercel.app`

#### Via Netlify
- [ ] Go to netlify.com
- [ ] Sign in with GitHub
- [ ] Connect repository
- [ ] Set build command: `cd client && npm run build`
- [ ] Set publish directory: `client/dist`
- [ ] Add environment variables
- [ ] Deploy
- [ ] Get domain

### Admin Portal (Same Code, Different Domain)

- [ ] Create new deployment on same platform
- [ ] Point to same GitHub repo
- [ ] Same build settings
- [ ] Get separate domain: `admin-yourdomain.netlify.app`

---

## Domain & DNS Setup

### Domain Provider Setup (GoDaddy, Namecheap, etc.)

#### If Using Subdomains
```
DNS Records to Add:

Type    Name            Value
CNAME   registration    your-vercel-deployment.vercel.app
CNAME   admin           your-netlify-deployment.netlify.app
CNAME   api             your-railway-deployment.railway.app
```

#### For Root Domain
```
Type    Name            Value
A       @               Railway/Heroku IP Address
CNAME   www             your-domain.com
```

- [ ] Add CNAME records
- [ ] Wait 24 hours for DNS propagation
- [ ] Verify domains work

---

## Security Checks

- [ ] SSL/HTTPS enabled on all domains
- [ ] CORS configured only for your domains (not *)
- [ ] JWT_SECRET is long and random
- [ ] No .env file in git
- [ ] MongoDB whitelist IPs set (or all IPs for testing)
- [ ] Admin access code changed from default
- [ ] Email credentials are app-specific passwords (not main password)

---

## Testing in Production

### Registration Portal
- [ ] Visit https://registration.yourdomain.com
- [ ] Can see landing page
- [ ] Register button works
- [ ] Complete registration flow
- [ ] Receive confirmation email
- [ ] See success page
- [ ] Team ID is displayed
- [ ] Check status button works

### Admin Portal
- [ ] Visit https://admin.yourdomain.com
- [ ] Can see admin login
- [ ] Login with admin credentials
- [ ] Dashboard loads
- [ ] Can see registered teams
- [ ] Can verify payment
- [ ] Can export CSV
- [ ] Settings page works

### API Testing
```bash
# Get stats (no auth needed)
curl https://api.yourdomain.com/api/teams/stats

# Admin login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Should return JWT token
```

---

## Post-Deployment

### Monitoring
- [ ] Set up error monitoring (Sentry, Rollbar, or platform logs)
- [ ] Monitor database performance
- [ ] Check error logs daily for first week
- [ ] Monitor email delivery

### Maintenance
- [ ] Keep dependencies updated monthly
- [ ] Monitor MongoDB disk space
- [ ] Keep backups of important data
- [ ] Review security logs

### Documentation
- [ ] Save deployment credentials securely
- [ ] Document admin username/password (in secure location)
- [ ] Document all API endpoints
- [ ] Create runbook for common issues

---

## Success! 🎉

When all checkboxes are complete:

✅ Registration portal live at: `https://registration.yourdomain.com`  
✅ Admin portal live at: `https://admin.yourdomain.com`  
✅ API running at: `https://api.yourdomain.com/api`  
✅ Teams can register and check payment status  
✅ Admin can verify payments and export data  

---

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| API connection fails | Check CORS, verify API URL in frontend |
| Emails not sending | Check Gmail app password, enable less secure apps if old account |
| Database connection fails | Check MongoDB URI format and whitelist IPs |
| Build fails | Check Node.js version, run `npm install` again |
| Pages show blank | Check browser console for errors, verify API endpoint |
| Admin login fails | Check JWT_SECRET matches on backend |

---

**Deployment Date**: _______________  
**API URL**: _______________  
**Registration Portal**: _______________  
**Admin Portal**: _______________  
**Status**: ☐ Testing ☐ Production

---

For detailed instructions, see: `DEPLOYMENT_GUIDE.md`
