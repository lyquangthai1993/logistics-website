@echo off
chcp 65001 > nul
title Antigravity Local Worker - Neon Queue Listener
echo ========================================================
echo   ANTIGRAVITY LOCAL WORKER (OPTION 1)
echo   Connected to Neon DB Queue & Listening for Telegram Tasks
echo ========================================================
echo.
cd /d "%~dp0"
node --watch neon-worker.mjs
pause
