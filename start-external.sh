#!/bin/bash

# 启动外网访问服务脚本

echo "启动后端服务..."
cd /home/shenzheng/lfwlw/backend
npm run dev &
BACKEND_PID=$!
echo "后端服务 PID: $BACKEND_PID"

sleep 3

echo "启动前端服务..."
cd /home/shenzheng/lfwlw/frontend
# 使用 preview 模式，避开开发服务器的主机检查
npx vite preview --port 50000 --host 0.0.0.0 &
FRONTEND_PID=$!
echo "前端服务 PID: $FRONTEND_PID"

echo ""
echo "服务已启动!"
echo "外网访问地址："
echo "前端: http://ljinvestment.diskstation.me:50000"
echo "后端API: http://ljinvestment.diskstation.me:50001"
echo ""
echo "停止服务请运行: kill $BACKEND_PID $FRONTEND_PID"