@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install the current LTS version from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)
if not exist node_modules\electron\dist\electron.exe (
  echo First run: installing Electron. This may take a few minutes...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo Electron installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
call npm start
