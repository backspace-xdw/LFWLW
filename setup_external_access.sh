#!/bin/bash

# 配置变量
PROJECT_NAME="$1"
FRONTEND_PORT="$2"
BACKEND_PORT="$3"
NGINX_PORT="${4:-80}"  # 默认80端口

if [ $# -lt 3 ]; then
    echo "使用方法: ./setup_external_access.sh 项目名称 前端端口 后端端口 [nginx端口]"
    echo "示例: ./setup_external_access.sh myproject 8080 8081 8090"
    exit 1
fi

echo "=== 配置外网访问: $PROJECT_NAME ==="
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo "Nginx端口: $NGINX_PORT"
echo ""

# 创建nginx配置
cat > /tmp/${PROJECT_NAME}-nginx.conf << EOF
server {
    listen $NGINX_PORT;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host localhost:$FRONTEND_PORT;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /ws {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
    
    client_max_body_size 50M;
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
}
EOF

echo "Nginx配置已生成到: /tmp/${PROJECT_NAME}-nginx.conf"
echo ""
echo "请执行以下命令完成配置："
echo "1. sudo cp /tmp/${PROJECT_NAME}-nginx.conf /etc/nginx/sites-available/$PROJECT_NAME"
echo "2. sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/"
echo "3. sudo nginx -t"
echo "4. sudo systemctl reload nginx"
echo ""
echo "然后在路由器添加端口转发："
echo "外部端口: 选择未占用的端口"
echo "内部IP: 192.168.0.20"
echo "内部端口: $NGINX_PORT"
echo "协议: TCP"