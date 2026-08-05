@echo off
chcp 65001 >nul
title Zero-Pet Launcher
rem ============================================================
rem  Zero-Pet Launcher —— 配置连接 + 启动 Hermes serve
rem  （Hermes 场景辅助工具；其他内核用户无需本脚本）
rem  流程：① 输入/确认 token → 写 config.json ② 拉起 hermes serve
rem ============================================================

set "CFG_DIR=%APPDATA%\com.zero-pet.app\zero-pet"
set "CFG=%CFG_DIR%\config.json"
set "PORT=9119"

if not exist "%CFG_DIR%" mkdir "%CFG_DIR%"

echo.
echo  [Zero-Pet] 连接配置
echo  -------------------------------
echo  输入你的 Hermes token（与 serve 启动时一致；已有配置可回车跳过）
echo.
set /p TOK=  Token: 

if not "%TOK%"=="" (
    echo {"host": "127.0.0.1", "port": %PORT%, "token": "%TOK%"} > "%CFG%"
    echo  ✅ 配置已写入：%CFG%
) else (
    if exist "%CFG%" (
        echo  已保留现有配置：%CFG%
    ) else (
        echo  ⚠ 无配置且未输入 token——将生成空配置
        echo {"host": "127.0.0.1", "port": %PORT%, "token": ""} > "%CFG%"
    )
)

echo.
echo  [Zero-Pet] 检查 Hermes serve...
curl -s -o nul -m 2 http://127.0.0.1:%PORT%/api/status
if %errorlevel%==0 (
    echo  ✅ serve 已在运行（端口 %PORT%）
) else (
    echo  未检测到 serve，尝试启动 hermes serve...
    where hermes >nul 2>nul
    if %errorlevel%==0 (
        rem 补 Hermes 的 node 到 PATH（serve 内部需要 node）
        if not "%TOK%"=="" (
            start "Hermes Serve" cmd /c "set PATH=%LOCALAPPDATA%\hermes\node;%PATH%&& set HERMES_DASHBOARD_SESSION_TOKEN=%TOK%&& hermes serve --skip-build"
        ) else (
            start "Hermes Serve" cmd /c "set PATH=%LOCALAPPDATA%\hermes\node;%PATH%&& hermes serve --skip-build"
        )
        echo  ✅ hermes serve 已启动（新窗口）——等它 READY 后打开桌宠即可
    ) else (
        echo  ❌ 未找到 hermes 命令——请先安装 Hermes Agent
    )
)

echo.
echo  现在可以启动桌宠（双击 zero-pet.exe）——连接配置已就绪
pause
