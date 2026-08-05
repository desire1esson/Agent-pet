@echo off
rem Zero-Pet Launcher - just starts Hermes serve
rem token comes from system env (setx HERMES_DASHBOARD_SESSION_TOKEN once)
rem ============================================================
set "PATH=%LOCALAPPDATA%\hermes\node;%PATH%"
hermes serve --skip-build
