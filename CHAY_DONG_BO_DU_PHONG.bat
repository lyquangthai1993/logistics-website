@echo off
chcp 65001 >nul
title [BACKUP RUN] ĐỒNG BỘ GIT DEV -> MASTER CHO LOGISTICS-WEBSITE
color 0b
echo =======================================================================
echo          CONG CU CHAY DONG BO DU PHONG (GIT DEV -> MASTER)
echo          Project: D:\Projects\logistics-website
echo =======================================================================
echo.
echo Dang khoi chay tien trinh dong bo...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "D:\Projects\logistics-website\scripts\sync-dev-to-master.ps1"

if %ERRORLEVEL% EQU 0 (
    echo.
    color 0a
    echo =======================================================================
    echo [THANH CONG] Dong bo hoan tat tot dep!
    echo =======================================================================
) else (
    echo.
    color 0c
    echo =======================================================================
    echo [THAT BAI] Da co loi xay ra. Vui long kiem tra file log tai:
    echo D:\Projects\logistics-website\scripts\sync-dev-to-master.log
    echo =======================================================================
)

echo.
echo Nhan phim bat ky de thoat...
pause >nul
