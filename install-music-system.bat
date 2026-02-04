@echo off
echo ================================
echo Music System Installation Script
echo ================================
echo.

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [2/4] Creating upload directory...
if not exist "public\uploads\music" (
    mkdir "public\uploads\music"
    echo ✓ Directory created: public\uploads\music
) else (
    echo ✓ Directory already exists
)
echo.

echo [3/4] Verifying files...
if exist "models\Music.js" (
    echo ✓ Music model found
) else (
    echo WARNING: Music model not found
)

if exist "routes\music.js" (
    echo ✓ Music routes found
) else (
    echo WARNING: Music routes not found
)

if exist "public\js\music-player.js" (
    echo ✓ Music player found
) else (
    echo WARNING: Music player not found
)
echo.

echo [4/4] Checking MongoDB connection...
if exist ".env" (
    echo ✓ .env file found
    echo   Make sure MONGODB_URI is set correctly
) else (
    echo WARNING: .env file not found
    echo   Create .env file with MONGODB_URI
)
echo.

echo ================================
echo Installation Complete!
echo ================================
echo.
echo Next steps:
echo 1. Make sure MongoDB Atlas connection is configured in .env
echo 2. Start the server: npm start
echo 3. Log in to admin dashboard
echo 4. Go to Background Music section
echo 5. Upload your first music file
echo.
echo Need help? Check MUSIC_UPLOAD_SETUP.md
echo.
pause
