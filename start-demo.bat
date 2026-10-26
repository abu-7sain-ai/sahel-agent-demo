@echo off
rem Sahel agent demo launcher (Windows): starts the server only if port 5318 is free, then opens the browser.
chcp 65001 >nul
cd /d "%~dp0"
title Sahel agent demo

netstat -ano -p TCP | findstr /r /c:":5318 .*LISTENING" >nul
if %errorlevel%==0 (
  echo The demo is already running. Opening http://127.0.0.1:5318
  start "" "http://127.0.0.1:5318"
  exit /b 0
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20+ is required: https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies...
  call npm install --omit=dev
)

rem The server opens the browser itself once it is listening (SAHEL_OPEN=1).
set SAHEL_OPEN=1
node server.js
pause
