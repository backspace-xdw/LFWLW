#!/bin/bash

# LFWLW 物联网监控平台停止脚本

echo "========================================"
echo "停止 LFWLW 物联网监控平台"
echo "========================================"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 读取PID文件
if [ -f ".pids" ]; then
    source .pids
    
    # 停止后端服务
    if [ ! -z "$BACKEND_PID" ]; then
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo "停止后端服务 (PID: $BACKEND_PID)..."
            kill $BACKEND_PID
            echo -e "${GREEN}✓ 后端服务已停止${NC}"
        else
            echo "后端服务已经停止"
        fi
    fi
    
    # 停止前端服务
    if [ ! -z "$FRONTEND_PID" ]; then
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo "停止前端服务 (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID
            echo -e "${GREEN}✓ 前端服务已停止${NC}"
        else
            echo "前端服务已经停止"
        fi
    fi
    
    rm -f .pids
else
    echo "没有找到运行中的服务"
fi

# 额外检查并清理残留进程
echo -e "\n检查残留进程..."
remaining=$(ps aux | grep -E "(lfwlw.*npm|lfwlw.*node)" | grep -v grep | wc -l)
if [ $remaining -gt 0 ]; then
    echo "发现 $remaining 个残留进程，正在清理..."
    pkill -f "lfwlw.*npm"
    pkill -f "lfwlw.*node"
    echo -e "${GREEN}✓ 残留进程已清理${NC}"
fi

echo -e "\n${GREEN}所有服务已停止${NC}"