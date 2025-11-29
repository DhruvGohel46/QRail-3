@echo off
echo Starting QRail Application...
echo.

REM Start Ollama server
echo [1/3] Starting Ollama Server with Llama 3.2...
start "Ollama Server" cmd /k "ollama serve"

REM Wait for Ollama to initialize
timeout /t 3 /nobreak >nul

REM Activate virtual environment and start backend server
echo [2/3] Starting Flask Backend Server...
start "QRail Backend" cmd /k "cd /d C:\QRail\backend && C:\QRail\qraienv\Scripts\activate.bat && python app.py"

REM Wait a few seconds for backend to initialize
timeout /t 5 /nobreak >nul

REM Start React frontend
echo [3/3] Starting React Frontend...
start "QRail Frontend" cmd /k "cd /d C:\QRail\Frontend && npm start"

echo.
echo QRail application is starting...
echo All services will open in separate windows.
pause
 