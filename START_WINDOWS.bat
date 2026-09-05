@echo off
rem SimpliiGood Creator Club - local prototype launcher (Windows)
rem Opens index.html in the default browser. No installation, server or API key needed.
cd /d "%~dp0"
if not exist "index.html" (
  echo index.html was not found. Make sure the whole folder was extracted.
  pause
  exit /b 1
)
start "" "index.html"
