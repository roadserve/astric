@echo off
REM AI SME Copilot - Dependency Installation Script for Windows
REM This script installs all dependencies for the project

echo ========================================
echo AI SME Copilot - Installing Dependencies
echo ========================================
echo.

REM Check Node.js
echo Checking prerequisites...
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [SUCCESS] Node.js is installed
)

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
) else (
    echo [SUCCESS] npm is installed
)

REM Check Flutter
where flutter >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Flutter is not installed. Please install Flutter from https://flutter.dev/
    pause
    exit /b 1
) else (
    echo [SUCCESS] Flutter is installed
)

REM Check Supabase CLI
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Supabase CLI is not installed. Installing now...
    call npm install -g supabase
    echo [SUCCESS] Supabase CLI installed
) else (
    echo [SUCCESS] Supabase CLI is installed
)

echo.
echo All prerequisites are met!
echo.

REM Install Web Dashboard dependencies
echo ========================================
echo Installing Web Dashboard dependencies...
echo ========================================
echo.

cd web
if exist "package.json" (
    echo Running npm install...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install web dependencies
        cd ..
        pause
        exit /b 1
    )
    echo [SUCCESS] Web dashboard dependencies installed
) else (
    echo [ERROR] package.json not found in web directory
    cd ..
    pause
    exit /b 1
)
cd ..

echo.

REM Install Mobile App dependencies
echo ========================================
echo Installing Mobile App dependencies...
echo ========================================
echo.

cd mobile
if exist "pubspec.yaml" (
    echo Running flutter pub get...
    call flutter pub get
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install mobile dependencies
        cd ..
        pause
        exit /b 1
    )
    echo [SUCCESS] Mobile app dependencies installed
    
    echo.
    echo Running code generation...
    call flutter pub run build_runner build --delete-conflicting-outputs
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] Code generation had some issues, but continuing...
    ) else (
        echo [SUCCESS] Code generation completed
    )
) else (
    echo [ERROR] pubspec.yaml not found in mobile directory
    cd ..
    pause
    exit /b 1
)
cd ..

echo.

REM Setup environment files
echo ========================================
echo Setting up environment files...
echo ========================================
echo.

REM Mobile environment
if not exist "mobile\.env" (
    if exist "mobile\env.example" (
        echo Creating mobile\.env from template...
        copy mobile\env.example mobile\.env
        echo [WARNING] Please update mobile\.env with your actual credentials
    )
)

REM Web environment
if not exist "web\.env.local" (
    if exist "web\env.example" (
        echo Creating web\.env.local from template...
        copy web\env.example web\.env.local
        echo [WARNING] Please update web\.env.local with your actual credentials
    )
)

echo.

REM Supabase Setup
echo ========================================
echo Supabase Setup
echo ========================================
echo.
echo Do you want to start Supabase locally now? (y/n)
set /p START_SUPABASE=

if /i "%START_SUPABASE%"=="y" (
    echo Starting Supabase...
    cd supabase
    call supabase start
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to start Supabase
        cd ..
        pause
        exit /b 1
    )
    echo [SUCCESS] Supabase started successfully
    echo.
    echo [WARNING] IMPORTANT: Copy the API URL and Anon Key to your .env files
    cd ..
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update mobile\.env with your Supabase credentials
echo 2. Update web\.env.local with your Supabase credentials
echo 3. Run 'flutter run' in the mobile directory
echo 4. Run 'npm run dev' in the web directory
echo.
echo For more information, see QUICKSTART.md
echo.
pause

