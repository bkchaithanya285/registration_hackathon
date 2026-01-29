@echo off
REM GENESIS Hackathon - Cleanup Script (Windows)

echo.
echo ========================================
echo GENESIS Deployment Cleanup
echo ========================================
echo.
echo Removing unnecessary documentation files...

del /q BUG_FIXES_REPORT.md 2>nul
del /q COMPLETE_DEBUG_GUIDE.md 2>nul
del /q DEBUG_TEST.html 2>nul
del /q DESIGN_ENHANCEMENT_REPORT.md 2>nul
del /q EMAIL_SETUP.md 2>nul
del /q EMAIL_TRACKING_FEATURE.md 2>nul
del /q FEATURES_UPDATE.md 2>nul
del /q FIX_STATUS.md 2>nul
del /q IMPLEMENTATION_REPORT.md 2>nul
del /q NEW_FEATURES.md 2>nul
del /q QUICK_START.md 2>nul
del /q SETTINGS_TESTING_GUIDE.md 2>nul
del /q SETUP_GUIDE.md 2>nul
del /q SYSTEM_SETUP_GUIDE.md 2>nul
del /q test_email.js 2>nul
del /q THEME_COMPARISON.md 2>nul
del /q THEME_UPDATE.md 2>nul
del /q UPDATE_SUMMARY.md 2>nul
del /q VISUAL_GUIDE.md 2>nul
del /q WHATSAPP_INTEGRATION_UPDATE.md 2>nul

REM Remove build artifacts
rmdir /s /q client\dist 2>nul
rmdir /s /q server\build 2>nul

echo.
echo ✅ Cleanup complete!
echo.
echo 📋 Next steps for deployment:
echo 1. Update server\.env with production credentials
echo 2. Update client\src\api.js with production API URL
echo 3. Run: npm run install-all
echo 4. Deploy backend to your chosen platform
echo 5. Build frontend: cd client && npm run build
echo 6. Deploy frontend to Vercel/Netlify
echo.
echo 📖 See DEPLOYMENT_GUIDE.md for detailed instructions
echo.
pause
