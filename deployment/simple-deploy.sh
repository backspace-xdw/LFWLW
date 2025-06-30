#!/bin/bash
# 简单部署脚本 - 快速启动 LFWLW 系统

set -e

echo "=== LFWLW 简单部署脚本 ==="
echo "该脚本将在端口 50000 部署您的应用"
echo ""

PROJECT_ROOT="/home/shenzheng/lfwlw"
BACKEND_PORT=8080
FRONTEND_PORT=50000

# 1. 检查并安装依赖
echo "1. 检查系统依赖..."
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装"
    echo "请先安装 Node.js: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

# 2. 构建后端
echo ""
echo "2. 准备后端服务..."
cd $PROJECT_ROOT/backend

# 创建生产环境配置
cat > .env.production << EOF
NODE_ENV=production
PORT=$BACKEND_PORT
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=http://ljinvestment.diskstation.me:$FRONTEND_PORT
EOF

# 安装依赖
npm install

# 3. 构建前端
echo ""
echo "3. 构建前端应用..."
cd $PROJECT_ROOT/frontend

# 修改 API 地址配置
cat > .env.production << EOF
VITE_API_BASE_URL=http://ljinvestment.diskstation.me:$FRONTEND_PORT/api
EOF

# 安装依赖并构建
npm install
npm run build

# 4. 创建简单的启动脚本
echo ""
echo "4. 创建启动脚本..."

# 后端启动脚本
cat > $PROJECT_ROOT/start-backend.sh << 'EOF'
#!/bin/bash
cd /home/shenzheng/lfwlw/backend
export NODE_ENV=production
node src/index.js
EOF
chmod +x $PROJECT_ROOT/start-backend.sh

# 前端服务脚本（使用 Node.js 静态服务器）
cat > $PROJECT_ROOT/start-frontend.sh << 'EOF'
#!/bin/bash
cd /home/shenzheng/lfwlw/frontend
npx serve -s dist -l 50000 --cors
EOF
chmod +x $PROJECT_ROOT/start-frontend.sh

# 5. 安装 serve（静态文件服务器）
echo ""
echo "5. 安装前端服务器..."
npm install -g serve

# 6. 创建一键启动脚本
cat > $PROJECT_ROOT/start-all.sh << 'EOF'
#!/bin/bash
echo "启动 LFWLW 系统..."

# 启动后端
echo "启动后端服务..."
cd /home/shenzheng/lfwlw/backend
NODE_ENV=production nohup node src/index.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 启动前端
echo "启动前端服务..."
cd /home/shenzheng/lfwlw/frontend
nohup serve -s dist -l 50000 --cors --no-clipboard > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"

# 保存 PID
echo $BACKEND_PID > /home/shenzheng/lfwlw/backend.pid
echo $FRONTEND_PID > /home/shenzheng/lfwlw/frontend.pid

echo ""
echo "=== 系统已启动 ==="
echo "前端地址: http://ljinvestment.diskstation.me:50000"
echo "后端 API: http://ljinvestment.diskstation.me:50000/api"
echo ""
echo "默认账号:"
echo "用户名: admin"
echo "密码: Lfwlw@2024"
echo ""
echo "查看日志:"
echo "tail -f backend.log   # 后端日志"
echo "tail -f frontend.log  # 前端日志"
EOF
chmod +x $PROJECT_ROOT/start-all.sh

# 7. 创建停止脚本
cat > $PROJECT_ROOT/stop-all.sh << 'EOF'
#!/bin/bash
echo "停止 LFWLW 系统..."

if [ -f /home/shenzheng/lfwlw/backend.pid ]; then
    BACKEND_PID=$(cat /home/shenzheng/lfwlw/backend.pid)
    kill $BACKEND_PID 2>/dev/null
    rm /home/shenzheng/lfwlw/backend.pid
    echo "后端已停止"
fi

if [ -f /home/shenzheng/lfwlw/frontend.pid ]; then
    FRONTEND_PID=$(cat /home/shenzheng/lfwlw/frontend.pid)
    kill $FRONTEND_PID 2>/dev/null
    rm /home/shenzheng/lfwlw/frontend.pid
    echo "前端已停止"
fi

# 清理可能的遗留进程
pkill -f "node.*lfwlw.*backend"
pkill -f "serve.*dist.*50000"

echo "系统已停止"
EOF
chmod +x $PROJECT_ROOT/stop-all.sh

# 8. 配置 Nginx（如果已安装）
if command -v nginx &> /dev/null; then
    echo ""
    echo "6. 配置 Nginx..."
    
    sudo tee /etc/nginx/sites-available/lfwlw << EOF
server {
    listen $FRONTEND_PORT;
    server_name ljinvestment.diskstation.me;

    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/lfwlw /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl restart nginx
fi

echo ""
echo "=== 部署准备完成 ==="
echo ""
echo "启动系统: $PROJECT_ROOT/start-all.sh"
echo "停止系统: $PROJECT_ROOT/stop-all.sh"
echo ""
echo "现在启动系统..."
$PROJECT_ROOT/start-all.sh