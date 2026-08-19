@echo off
rem blog-bridge 启动器 — 双击运行，保持窗口以显示 Token 与日志
cd /d "%~dp0.."
echo [blog-bridge] 正在启动...
node local-bridge\bridge.js
echo.
echo [blog-bridge] 已退出（Ctrl+C 或异常）。窗口将在 5 秒后关闭...
timeout /t 5 >nul
