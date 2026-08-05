@echo off
chcp 65001 >nul
title Zero-Pet Launcher
rem ============================================================
rem  Zero-Pet Launcher - config connection + start Hermes serve
rem  (Hermes helper; other kernels don't need this script)
rem ============================================================

set "CFG_DIR=%APPDATA%\com.zero-pet.app\zero-pet"
set "CFG=%CFG_DIR%\config.json"
set "PORT=9119"

if not exist "%CFG_DIR%" mkdir "%CFG_DIR%"

echo.
echo  [Zero-Pet] Connection config
echo  -------------------------------
echo  Enter your Hermes token (same as serve; Enter to keep existing):
echo.
set /p TOK=  Token: 

if not "%TOK%"=="" (
    echo {"host": "127.0.0.1", "port": %PORT%, "token": "%TOK%"} > "%CFG%"
    echo  [OK] config written: %CFG%
) else (
    if exist "%CFG%" (
        echo  Kept existing config: %CFG%
    ) else (
        echo  [!] No token and no config - writing empty config
        echo {"host": "127.0.0.1", "port": %PORT%, "token": ""} > "%CFG%"
    )
)

echo.
echo  [Zero-Pet] Checking Hermes serve...
curl -s -o nul -m 2 http://127.0.0.1:%PORT%/api/status
if %errorlevel%==0 (
    echo  [OK] serve already running (port %PORT%)
) else (
    echo  Serve not detected, starting hermes serve...
    where hermes >nul 2>nul
    if %errorlevel%==0 (
        rem add Hermes node to PATH (serve needs node); log to file for debugging
        if not "%TOK%"=="" (
            start "Hermes Serve" cmd /c "set PATH=%LOCALAPPDATA%\hermes\node;%PATH%&& set HERMES_DASHBOARD_SESSION_TOKEN=%TOK%&& hermes serve --skip-build > %TEMP%\hermes-launch.log 2>&1"
        ) else (
            start "Hermes Serve" cmd /c "set PATH=%LOCALAPPDATA%\hermes\node;%PATH%&& hermes serve --skip-build > %TEMP%\hermes-launch.log 2>&1"
        )
        echo  [OK] hermes serve starting (new window) - wait READY then open the pet
        echo  (if failed, check log: %TEMP%\hermes-launch.log)
    ) else (
        echo  [X] hermes command not found - install Hermes Agent first
    )
)

echo.
echo  Now start the pet (double-click zero-pet.exe) - connection ready
pause
