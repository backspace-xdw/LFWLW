#!/bin/bash

# LFWLW 物联网监控平台部署脚本

echo "========================================"
echo "LFWLW 物联网监控平台部署脚本"
echo "========================================"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查Node.js版本
echo -e "\n${GREEN}1. 检查环境...${NC}"
node_version=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✓ Node.js 版本: $node_version"
else
    echo -e "${RED}✗ Node.js 未安装${NC}"
    exit 1
fi

npm_version=$(npm -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✓ npm 版本: $npm_version"
else
    echo -e "${RED}✗ npm 未安装${NC}"
    exit 1
fi

# 切换到项目目录
cd "$(dirname "$0")"
PROJECT_DIR=$(pwd)
echo "✓ 项目目录: $PROJECT_DIR"

# 安装后端依赖
echo -e "\n${GREEN}2. 安装后端依赖...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo "安装后端依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ 后端依赖安装失败${NC}"
        exit 1
    fi
else
    echo "✓ 后端依赖已安装"
fi

# 创建后端环境配置文件
if [ ! -f ".env" ]; then
    echo "创建后端环境配置文件..."
    cat > .env << EOF
PORT=5000
NODE_ENV=development
JWT_SECRET=dev-secret-key-2024
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
EOF
    echo "✓ 后端环境配置文件已创建"
else
    echo "✓ 后端环境配置文件已存在"
fi

# 安装前端依赖
echo -e "\n${GREEN}3. 安装前端依赖...${NC}"
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ 前端依赖安装失败${NC}"
        exit 1
    fi
else
    echo "✓ 前端依赖已安装"
fi

# 检查端口占用
echo -e "\n${GREEN}4. 检查端口...${NC}"
if lsof -i :5000 > /dev/null 2>&1; then
    echo -e "${RED}✗ 端口 5000 被占用，请先停止占用该端口的服务${NC}"
    exit 1
else
    echo "✓ 端口 5000 可用"
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${RED}✗ 端口 3000 被占用，请先停止占用该端口的服务${NC}"
    exit 1
else
    echo "✓ 端口 3000 可用"
fi

# 启动服务
echo -e "\n${GREEN}5. 启动服务...${NC}"

# 启动后端
cd ../backend
echo "启动后端服务..."
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务 PID: $BACKEND_PID"

# 等待后端启动
echo -n "等待后端服务启动"
for i in {1..10}; do
    if curl -s http://localhost:5000 > /dev/null 2>&1; then
        echo -e "\n✓ 后端服务已启动"
        break
    fi
    echo -n "."
    sleep 1
done

# 启动前端
cd ../frontend
echo "启动前端服务..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务 PID: $FRONTEND_PID"

# 等待前端启动
echo -n "等待前端服务启动"
for i in {1..10}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "\n✓ 前端服务已启动"
        break
    fi
    echo -n "."
    sleep 1
done

# 保存PID以便后续停止
cd ..
echo "BACKEND_PID=$BACKEND_PID" > .pids
echo "FRONTEND_PID=$FRONTEND_PID" >> .pids

echo -e "\n${GREEN}========================================"
echo "部署完成！"
echo "========================================"
echo ""
echo "访问地址: http://localhost:3000"
echo ""
echo "登录账号:"
echo "  用户名: admin"
echo "  密码: admin123"
echo ""
echo "功能模块:"
echo "  - 监控仪表板"
echo "  - 设备管理"
echo "  - 实时监控"
echo "  - 告警管理"
echo "  - 数据分析"
echo "  - 3D模型"
echo "  - 2D图形编辑（新功能）"
echo "  - 用户管理"
echo "  - 系统设置"
echo ""
echo "日志文件:"
echo "  - 后端日志: backend/backend.log"
echo "  - 前端日志: frontend/frontend.log"
echo ""
echo "停止服务请运行: ./stop.sh"
echo "========================================${NC}"