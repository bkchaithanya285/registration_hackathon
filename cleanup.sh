#!/bin/bash

# GENESIS Hackathon - Deployment Setup Script
# This script cleans up the project and prepares for deployment

echo "🧹 Cleaning up unnecessary documentation files..."

# Remove documentation files
rm -f BUG_FIXES_REPORT.md
rm -f COMPLETE_DEBUG_GUIDE.md
rm -f DEBUG_TEST.html
rm -f DESIGN_ENHANCEMENT_REPORT.md
rm -f EMAIL_SETUP.md
rm -f EMAIL_TRACKING_FEATURE.md
rm -f FEATURES_UPDATE.md
rm -f FIX_STATUS.md
rm -f IMPLEMENTATION_REPORT.md
rm -f NEW_FEATURES.md
rm -f QUICK_START.md
rm -f SETTINGS_TESTING_GUIDE.md
rm -f SETUP_GUIDE.md
rm -f SYSTEM_SETUP_GUIDE.md
rm -f test_email.js
rm -f THEME_COMPARISON.md
rm -f THEME_UPDATE.md
rm -f UPDATE_SUMMARY.md
rm -f VISUAL_GUIDE.md
rm -f WHATSAPP_INTEGRATION_UPDATE.md

# Remove build artifacts if they exist
rm -rf client/dist
rm -rf server/build

echo "✅ Cleanup complete!"
echo ""
echo "📋 Next steps for deployment:"
echo "1. Update server/.env with production credentials"
echo "2. Update client/src/api.js with production API URL"
echo "3. Run: npm run install-all"
echo "4. Deploy backend to your chosen platform"
echo "5. Build frontend: cd client && npm run build"
echo "6. Deploy frontend to Vercel/Netlify"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
