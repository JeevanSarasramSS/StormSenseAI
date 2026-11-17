@echo off
setlocal
title StormSense AI - Setup and Run
cd /d "%~dp0"
color 0B
echo.
echo  ==================================================
echo     StormSense AI - Urban Stormwater Runoff Estimator
echo     21CEO306T Environment Impact Assessment - Batch 5
echo  ==================================================
echo.

REM ---------- 1. Node.js ----------
where node >nul 2>nul
if errorlevel 1 (
    echo  [!] Node.js is not installed. Installing Node.js LTS...
    where winget >nul 2>nul
    if errorlevel 1 (
        echo  [X] Could not install automatically.
        echo      Install Node.js LTS from https://nodejs.org and run this file again.
        start https://nodejs.org/en/download
        pause
        exit /b 1
    )
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    set "PATH=%PATH%;C:\Program Files\nodejs"
    where node >nul 2>nul
    if errorlevel 1 (
        echo.
        echo  [i] Node.js installed. Close this window and double-click run.bat again.
        pause
        exit /b 0
    )
)
for /f "delims=" %%v in ('node -v') do set "NODEVER=%%v"
for /f "delims=" %%m in ('node -p "parseInt(process.versions.node)"') do set "NODEMAJOR=%%m"
if %NODEMAJOR% LSS 20 (
    echo  [X] Node.js %NODEVER% is too old. Version 20 or newer is required.
    echo      Update it from https://nodejs.org  or run:  winget upgrade OpenJS.NodeJS.LTS
    start https://nodejs.org/en/download
    pause
    exit /b 1
)
echo  [OK] Node.js %NODEVER%

where npm >nul 2>nul
if errorlevel 1 (
    echo  [X] npm was not found. Reinstall Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM ---------- 2. Project packages (reinstalls automatically when package.json changes) ----------
set "NEED_INSTALL=0"
set "CLEAR="
if not exist "node_modules\expo\package.json" set "NEED_INSTALL=1"
if not exist "node_modules\.stormsense-stamp" set "NEED_INSTALL=1"
if exist "node_modules\.stormsense-stamp" fc /b package.json "node_modules\.stormsense-stamp" >nul 2>nul || set "NEED_INSTALL=1"

if "%NEED_INSTALL%"=="1" (
    echo.
    echo  [..] Installing project packages. The first time takes a few minutes...
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo.
        echo  [X] Package install failed. Check your internet connection and run this file again.
        pause
        exit /b 1
    )
    copy /y package.json "node_modules\.stormsense-stamp" >nul
    set "CLEAR=--clear"
    echo  [OK] Packages installed
) else (
    echo  [OK] Packages up to date
)

REM ---------- 3. Start the app ----------
echo.
echo  --------------------------------------------------
echo   1. Install "Expo Go" on your phone (Play Store / App Store)
echo   2. Connect phone and laptop to the SAME Wi-Fi
echo   3. Scan the QR code below
echo        Android: open Expo Go, tap "Scan QR code"
echo        iPhone : use the Camera app
echo   4. Phone won't connect? Close this and run:  run.bat tunnel
echo   5. No phone? Press  w  to open the app in the browser
echo  --------------------------------------------------
echo.
if /i "%~1"=="tunnel" (
    call npx expo start --tunnel %CLEAR%
) else (
    call npx expo start %CLEAR%
)
pause
