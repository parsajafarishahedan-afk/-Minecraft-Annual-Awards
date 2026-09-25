@echo off
chcp 65001 >nul
title Minecraft Awards - GLOBAL
cd /d "%~dp0"

echo.
echo ========================================
echo    Minecraft Awards - GLOBAL MODE
echo ========================================
echo.

REM چک Node
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    pause
    exit /b 1
)

REM نصب پکیج‌ها
if not exist "node_modules" (
    echo [INFO] Installing packages...
    call npm install
)

REM بستن Node قدیمی
taskkill /F /IM node.exe >nul 2>nul
timeout /t 2 >nul

REM اجرای سرور Node
echo [INFO] Starting server...
start "Awards Server" cmd /k "chcp 65001 >nul && node index.js"

REM صبر کن سرور بالا بیاد
timeout /t 5 >nul

echo.
echo ========================================
echo    Getting public URL...
echo ========================================
echo.
echo [INFO] منتظر بمان تا لینک https://... بیاد
echo [INFO] اون لینک رو به دوستات بده
echo [INFO] برای بستن: Ctrl+C بزن
echo.

REM اتصال به اینترنت با SSH
ssh -o StrictHostKeyChecking=no -R 80:localhost:3000 nokey@localhost.run

pause