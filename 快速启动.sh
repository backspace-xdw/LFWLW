#!/bin/bash

# 物联网监控平台快速启动脚本

echo "====================================="
echo "物联网远程监控平台 - 快速启动"
echo "====================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Node.js
echo -e "\n${YELLOW}检查环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未安装Node.js${NC}"
    echo "请先安装Node.js (>= 16.0.0)"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
echo -e "${GREEN}✓ Node.js版本: v${NODE_VERSION}${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 启动后端
echo -e "\n${YELLOW}启动后端服务...${NC}"
cd backend

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo "安装后端依赖..."
    npm install
fi

# 创建.env文件（如果不存在）
if [ ! -f ".env" ]; then
    echo "创建环境配置文件..."
    cat > .env << EOF
PORT=5000
NODE_ENV=development
JWT_SECRET=dev-secret-key-2024
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
EOF
fi

# 启动后端（后台运行）
echo -e "${GREEN}启动后端服务 (端口 5000)...${NC}"
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "后端进程PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ 后端服务启动成功${NC}"
else
    echo -e "${RED}✗ 后端服务启动失败，请查看 backend/backend.log${NC}"
    exit 1
fi

# 启动前端
echo -e "\n${YELLOW}启动前端服务...${NC}"
cd ../frontend

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

# 启动前端
echo -e "${GREEN}启动前端服务 (端口 3000)...${NC}"
npm run dev &
FRONTEND_PID=$!
echo "前端进程PID: $FRONTEND_PID"

# 等待前端启动
sleep 5

# 输出访问信息
echo -e "\n${GREEN}====================================="
echo -e "启动成功！"
echo -e "====================================="
echo -e "前端地址: http://localhost:3000"
echo -e "后端地址: http://localhost:5000"
echo -e "\n登录账号:"
echo -e "  用户名: admin"
echo -e "  密码: admin123"
echo -e "=====================================${NC}"
echo -e "\n${YELLOW}按 Ctrl+C 停止所有服务${NC}"

# 创建停止脚本
cat > stop.sh << EOF
#!/bin/bash
echo "停止所有服务..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "服务已停止"
EOF
chmod +x stop.sh

# 等待用户中断
trap "echo -e '\n${YELLOW}停止所有服务...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait