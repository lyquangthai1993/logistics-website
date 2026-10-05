@echo off
title Antigravity Telegram AI Task Runner
cd /d "c:\Projects\logistics-website"
echo ========================================================
echo   KHOI DONG ANTIGRAVITY TELEGRAM AI TASK RUNNER
echo   Workspace: c:\Projects\logistics-website
echo ========================================================
echo.
node tools/telegram-task-runner/bot.mjs
if %errorlevel% neq 0 (
    echo.
    echo [LOI] Bot da bi dung dot ngot!
    pause
)
