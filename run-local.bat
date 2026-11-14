@echo off
setlocal
cd /d "%~dp0site"
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 8000
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8000
  exit /b
)
echo Python was not found. Install Python 3 or run a local static web server.
pause
