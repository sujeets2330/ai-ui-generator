@echo off
setlocal enabledelayedexpansion

REM Ryze AI UI Generator - Setup Script (Windows)

echo.
echo  Ryze AI UI Generator Setup
echo ==============================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  Node.js is not installed. Please install Node.js 18 or later.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Node.js found: %NODE_VERSION%

REM Check if pnpm is installed
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo pnpm is not installed. Installing globally...
    call npm install -g pnpm
)

for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VERSION=%%i
echo  pnpm found: %PNPM_VERSION%
echo.

REM Check if .env.local exists
if exist .env.local (
    echo  .env.local already exists
    echo.
    set /p UPDATE="Do you want to update your API key? (y/n) "
    if /i "!UPDATE!"=="y" (
        set /p API_KEY="Enter your  API key: "
        (
            echo API_KEY=!API_KEY!
        ) > .env.local
        echo  API key updated
    )
) else (
    echo  Creating .env.local file...
    echo.
    set /p API_KEY="Enter your Anthropic API key (get it from https://console.com): "
    
    if "!API_KEY!"=="" (
        echo  API key cannot be empty
        pause
        exit /b 1
    )
    
    (
        echo ANTHROPIC_API_KEY=!API_KEY!
    ) > .env.local
    echo  .env.local created with your API key
)

echo.
echo  Installing dependencies...
call pnpm install

echo.
echo  Setup complete!
echo.
echo  Ready to start!
echo.
echo Next steps:
echo 1. Run: pnpm dev
echo 2. Open: http://localhost:3000
echo 3. Describe your UI and watch the magic happen!
echo.
pause
