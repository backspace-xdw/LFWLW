@echo off
chcp 65001 >nul
title 物联网监控平台 - 快速启动

echo =====================================
echo 物联网远程监控平台 - 快速启动
echo =====================================
echo.

:: 检查Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未安装Node.js
    echo 请先安装Node.js ^(^>= 16.0.0^)
    pause
    exit /b 1
)

echo [信息] 检测到Node.js版本:
node -v
echo.

:: 获取当前目录
set CURRENT_DIR=%~dp0
cd /d "%CURRENT_DIR%"

:: 启动后端
echo [信息] 启动后端服务...
cd backend

:: 检查是否需要安装依赖
if not exist "node_modules\" (
    echo [信息] 安装后端依赖...
    call npm install
)

:: 创建.env文件（如果不存在）
if not exist ".env" (
    echo [信息] 创建环境配置文件...
    (
        echo PORT=5000
        echo NODE_ENV=development
        echo JWT_SECRET=dev-secret-key-2024
        echo JWT_EXPIRES_IN=7d
        echo CORS_ORIGIN=http://localhost:3000
    ) > .env
)

:: 启动后端（新窗口）
echo [信息] 启动后端服务 ^(端口 5000^)...
start "IoT Backend" cmd /k "npm run dev"

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端
echo [信息] 启动前端服务...
cd ..\frontend

:: 检查是否需要安装依赖
if not exist "node_modules\" (
    echo [信息] 安装前端依赖...
    call npm install
)

:: 启动前端（新窗口）
echo [信息] 启动前端服务 ^(端口 3000^)...
start "IoT Frontend" cmd /k "npm run dev"

:: 等待前端启动
timeout /t 5 /nobreak >nul

:: 输出访问信息
echo.
echo =====================================
echo 启动成功！
echo =====================================
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:5000
echo.
echo 登录账号:
echo   用户名: admin
echo   密码: admin123
echo =====================================
echo.
echo 按任意键打开浏览器...
pause >nul

:: 打开浏览器
start http://localhost:3000

echo.
echo 提示: 关闭此窗口不会停止服务
echo 要停止服务，请关闭弹出的命令行窗口
echo.
pause