@echo off
title Deploy Learning-Time to Netlify
echo ========================================================
echo   Deploying Learning-Time System to Netlify
echo ========================================================
echo.
echo Step 1: Checking Netlify Login...
npx.cmd netlify status
echo.
echo Step 2: Starting Production Deployment...
echo (If this is your first time, it will ask to link or create a new site)
echo.
npx.cmd netlify deploy --prod
echo.
echo ========================================================
echo   Deployment Finished!
echo ========================================================
pause
