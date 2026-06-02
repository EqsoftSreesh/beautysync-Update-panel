@echo off
title BeautySync Portal Runner
echo ===================================================
echo   BeautySync Update ^& Campaign Management Portal
echo ===================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your PATH.
    echo Please install Python and try again.
    pause
    exit /b 1
)

echo [INFO] Python found. Checking dependencies...
echo.

:: Install dependencies
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Failed to install dependencies via pip.
    echo Trying fallback installer...
    pip install Flask Flask-CORS
)

echo.
echo [SUCCESS] Dependencies satisfied. Starting Flask Server...
echo ===================================================
echo   Admin Panel: http://127.0.0.1:5000
echo   API GET URL: http://127.0.0.1:5000/api/mobile/active-update?version_code=104
echo ===================================================
echo.

:: Run Flask app in background
start "Flask Server" python app.py

:: Wait a moment for Flask to start
timeout /t 2 /nobreak >nul

:: Start ngrok tunnel on port 5000
echo [INFO] Starting ngrok tunnel...
echo [INFO] Check the ngrok URL below to use on your mobile device.
echo.
ngrok http 5000

pause
