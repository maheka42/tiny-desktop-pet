@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules\electron\dist\electron.exe call npm install --no-audit --no-fund
call npx electron . --bring-on-screen
