@echo off
title Zero-Pet Launcher / 零·桌宠启动器
rem ============================================================
rem  Zero-Pet Launcher - all-in-one: token + config + serve
rem  一键全包：设定 token + 写配置 + 启动 Hermes 后端
rem ============================================================

set "CFG_DIR=%APPDATA%\com.zero-pet.app\zero-pet"
set "CFG=%CFG_DIR%\config.json"
set "PORT=9119"

echo.
echo  ============================================================
echo    Zero-Pet Launcher / 零·桌宠启动器
echo  ============================================================
echo.
echo  HOW IT WORKS / 使用指导（按时间线）:
echo.
echo    [Step 1] Set token once / 首次自动设定 token
echo      This launcher saves it to your system env (first run only)
echo      启动器会把 token 写入系统环境变量（仅首次需要）
echo.
echo    [Step 2] Config + serve auto / 配置与后端全自动
echo      config.json written, Hermes serve started
echo      自动写桌宠配置、自动启动 Hermes 后端
echo.
echo    [Step 3] Open the pet / 打开桌宠
echo      double-click zero-pet.exe and chat
echo      双击 zero-pet.exe 即可开始对话
echo.
echo  ------------------------------------------------------------
echo   [T0] Token check / 检查 token...
set "TOK=%HERMES_DASHBOARD_SESSION_TOKEN%"
if "%TOK%"=="" (
    echo    No token in env / 环境变量中没有 token（首次运行）
    set /p TOK=    Enter your token / 请输入 token: 
    if "%TOK%"=="" (
        echo    [X] Token required / 必须输入 token 才能继续
        pause
        exit /b 1
    )
    setx HERMES_DASHBOARD_SESSION_TOKEN "%TOK%" >nul
    set  HERMES_DASHBOARD_SESSION_TOKEN=%TOK%
    echo    [OK] Token saved to system env / token 已写入系统环境变量
) else (
    echo    [OK] Token found in env / 环境变量已有 token
)

echo.
echo   [T1] Write config / 写桌宠配置...
if not exist "%CFG_DIR%" mkdir "%CFG_DIR%"
echo {"host": "127.0.0.1", "port": %PORT%, "token": "%TOK%"} > "%CFG%"
echo    [OK] config written / 配置已写入: %CFG%

echo.
echo   [T2] Check serve / 检查后端...
curl -s -o nul -m 2 http://127.0.0.1:%PORT%/api/status
if %errorlevel%==0 (
    echo    [OK] Serve already running / 后端已在运行
) else (
    echo    Serve not running / 后端未运行 - starting / 正在启动...
    where hermes >nul 2>nul
    if %errorlevel%==0 (
        rem add Hermes node to PATH (serve needs node); log for debugging
        start "Hermes Serve" cmd /c "set PATH=%LOCALAPPDATA%\hermes\node;%PATH%&& hermes serve --skip-build > %TEMP%\hermes-launch.log 2>&1"
        echo    [OK] Serve starting / 后端启动中 - wait READY / 等待就绪
        echo    (if failed / 若失败, see log / 查看日志: %TEMP%\hermes-launch.log)
    ) else (
        echo    [X] Hermes not found / 未找到 Hermes
        echo        Install Hermes Agent first / 请先安装 Hermes Agent
        pause
        exit /b 1
    )
)

echo.
echo  ------------------------------------------------------------
echo   NEXT / 下一步: double-click zero-pet.exe / 双击桌宠开始对话
echo.
pause
