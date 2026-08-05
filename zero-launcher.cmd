@echo off
title Zero-Pet Launcher / 零·桌宠启动器
rem ============================================================
rem  Zero-Pet Launcher - config + serve only
rem  启动器职责：① 检查密钥（系统环境变量）② 写 config.json ③ 拉起 Hermes serve（后台隐藏）
rem  前置：请先在 CMD 执行 setx HERMES_DASHBOARD_SESSION_TOKEN your-key
rem ============================================================

set "CFG_DIR=%APPDATA%\com.zero-pet.app\zero-pet"
set "CFG=%CFG_DIR%\config.json"
set "PORT=9119"

echo.
echo  ============================================
echo    Zero-Pet Launcher / 零·桌宠启动器
echo  ============================================
echo.
echo  Steps / 步骤:
echo    [1] Key check / 检查密钥（来自系统环境变量）
echo    [2] Config     / 写桌宠配置（config.json）
echo    [3] Serve      / 拉起后端（hermes serve，后台隐藏）
echo.
echo  ------------------------------------------------------------

rem ── [1] 密钥检查 ──
echo   [1] Key check / 检查密钥...
set "TOK=%HERMES_DASHBOARD_SESSION_TOKEN%"
if not "%TOK%"=="" goto key_ok
echo.
echo    [X] 未检测到密钥 / No key found in system env
echo.
echo    请先在 CMD 执行（一次性）：
echo    setx HERMES_DASHBOARD_SESSION_TOKEN 你的密钥
echo.
echo    然后重新运行本启动器 / Then rerun this launcher
echo.
pause
exit /b 1

:key_ok
echo    [OK] 已检测到密钥 / Key detected
echo.
echo  ------------------------------------------------------------

rem ── [2] 配置检查 ──
echo   [2] Config / 检查桌宠配置...
if exist "%CFG%" goto cfg_exists
if not exist "%CFG_DIR%" mkdir "%CFG_DIR%"
echo {"host": "127.0.0.1", "port": %PORT%, "token": "%TOK%"} > "%CFG%"
echo    [OK] 配置已创建 / Config created
goto cfg_done

:cfg_exists
for /f "usebackq delims=" %%t in (`powershell -NoProfile -Command "try{(Get-Content '%CFG%' -Raw|ConvertFrom-Json).token}catch{''}"`) do set "CFGTOK=%%t"
if "%CFGTOK%"=="%TOK%" goto cfg_same
echo.
echo    [!] 密钥不一致 / Token mismatch:
echo        系统密钥 / system: %TOK%
echo        配置密钥 / config: %CFGTOK%
echo.
echo    请自行修改配置文件 / Please fix manually:
echo    %CFG%
echo    （保持与 setx 的密钥一致 / must match the system key）
echo.
pause
exit /b 1

:cfg_same
echo    [OK] 配置已存在且一致 / Config exists and matches
:cfg_done
echo.
echo  ------------------------------------------------------------

rem ── [3] serve 检查 ──
echo   [3] Serve / 检查后端...
curl -s -o nul -m 2 http://127.0.0.1:%PORT%/api/status
if %errorlevel%==0 goto serve_ok
echo    后端未运行，启动中... / Serve not running, starting...
where hermes >nul 2>nul
if %errorlevel%==0 goto have_hermes
echo.
echo    [X] 未找到 Hermes / Hermes not found
echo    请先安装 Hermes Agent / Install Hermes Agent first
echo.
pause
exit /b 1

:have_hermes
rem 后台隐藏启动 serve（无窗口——日志重定向到文件）
set "PATH=%LOCALAPPDATA%\hermes\node;%PATH%"
set "HERMES_DASHBOARD_SESSION_TOKEN=%TOK%"
powershell -NoProfile -Command "Start-Process -FilePath hermes -ArgumentList 'serve','--skip-build' -WindowStyle Hidden -RedirectStandardOutput \"$env:TEMP\hermes-launch.log\" -RedirectStandardError \"$env:TEMP\hermes-launch.err\""
echo    [OK] 后端已后台启动（无窗口）/ Serve started in background
echo        日志 / Log: %TEMP%\hermes-launch.log
goto serve_done

:serve_ok
echo    [OK] 后端已在运行 / Serve already running - 直接打开桌宠
:serve_done

echo.
echo  ============================================
echo   NEXT / 下一步: 双击 zero-pet.exe 开始对话
echo  ============================================
pause
