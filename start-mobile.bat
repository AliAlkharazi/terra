@echo off
cd /d "%~dp0mobile"
if not exist node_modules (
  echo Installing dependencies (first run)...
  call npm install
)
echo Starting Terra...
call npx expo start
pause
