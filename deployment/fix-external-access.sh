#!/bin/bash
# 修复外网访问502错误的脚本

echo "=== 修复外网访问502错误 ==="
echo ""

# 1. 停止现有服务
echo "1. 停止现有开发服务..."
pkill -f "npm run dev"
pkill -f "vite"
pkill -f "nodemon"

# 2. 构建生产版本
echo "2. 构建生产版本..."
cd /home/shenzheng/lfwlw/frontend
npm run build

# 3. 使用全局serve启动前端（监听所有接口）
echo "3. 启动前端服务（监听所有接口）..."
npx serve -s dist -l 50000 --no-clipboard > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端PID: $FRONTEND_PID"

# 4. 启动后端（监听所有接口）
echo "4. 启动后端服务..."
cd /home/shenzheng/lfwlw/backend
cat > .env.production << EOF
NODE_ENV=production
PORT=50001
HOST=0.0.0.0
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=*
EOF

NODE_ENV=production node src/index.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "后端PID: $BACKEND_PID"

# 5. 配置Nginx（如果已安装）
if command -v nginx &> /dev/null; then
    echo "5. 配置Nginx..."
    sudo tee /etc/nginx/sites-available/lfwlw << 'EOF'
server {
    listen 50000;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:50000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://127.0.0.1:50001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/lfwlw /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl restart nginx
fi

# 6. 检查防火墙
echo ""
echo "6. 检查防火墙设置..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 50000/tcp
    sudo ufw allow 50001/tcp
    echo "防火墙规则已更新"
fi

# 7. 测试服务
sleep 5
echo ""
echo "7. 测试服务状态..."
echo -n "前端服务: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:50000 || echo "失败"
echo ""
echo -n "后端API: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:50001/api/v1/auth/login -X POST -H "Content-Type: application/json" -d '{}' || echo "失败"
echo ""

# 8. 显示访问信息
echo ""
echo "=== 访问信息 ==="
echo "内网访问: http://localhost:50000"
echo "外网访问: http://ljinvestment.diskstation.me:50000"
echo ""
echo "默认账号:"
echo "用户名: admin"
echo "密码: admin123"
echo ""
echo "查看日志:"
echo "tail -f /tmp/frontend.log"
echo "tail -f /tmp/backend.log"
echo ""
echo "停止服务:"
echo "kill $FRONTEND_PID $BACKEND_PID"