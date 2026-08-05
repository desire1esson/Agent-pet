@echo off
chcp 65001 >nul
title Zero-Pet Launcher
rem ============================================================
rem  Zero-Pet Launcher —— 配置连接 + 启动 Hermes serve
rem  （Hermes 场景辅助工具；其他内核用户无需本脚本）
rem  用途：① 生成/编辑 config.json（token） ② 拉起 hermes serve
rem ============================================================

set "CFG_DIR=%APPDATA%\com.zero-pet.app\zero-pet"
set "CFG=%CFG_DIR%\config.json"
set "PORT=9119"

if not exist "%CFG_DIR%" mkdir "%CFG_DIR%"

echo.
echo  [Zero-Pet] 连接配置
echo  -------------------------------
if exist "%CFG%" (
    echo  已有配置：%CFG%
    echo  修改 token？(直接回车跳过)
) else (
    echo  首次运行：需要生成配置
)
echo.
set /p TOKEN=  输入你的 Hermes token（留空跳过）: 

if not "%TOKEN%"=="" (
    echo {"host": "127.0.0.1", "port": %PORT%, "token": "%TOKEN%"} > "%CFG%"
    echo  ✅ 配置已写入：%CFG%
) else (
    if not exist "%CFG%" (
        echo  {"host": "127.0.0.1", "port": %PORT%, "token": ""} > "%CFG%"
        echo  ⚠ 已生成空配置（token 为空——serve 无 token 时可用）
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
        for /f "usebackq delims=" %%t in ('powershell -NoProfile -Command "try{$j=Get-Content '%CFG%' -Raw|ConvertFrom-Json; $j.token}catch{''}"') do set "TOK=%%t"
        if not "%TOK%"=="" (
            start "Hermes Serve" cmd /c "set HERMES_DASHBOARD_SESSION_TOKEN=%TOK% && hermes serve --skip-build"
        ) else (
            start "Hermes Serve" cmd /c "hermes serve --skip-build"
        )
        echo  ✅ hermes serve 已启动（新窗口）——等它 READY 后打开桌宠即可
    ) else (
        echo  ❌ 未找到 hermes 命令——请先安装 Hermes Agent
    )
)

echo.
echo  现在可以启动桌宠：D:\Agent-pet\zero-pet.exe（或 Releases 安装版）
pause
