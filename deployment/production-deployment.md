# LFWLW 生产环境部署指南

## 问题诊断

502 Bad Gateway 错误通常表示：
1. 后端服务未启动或崩溃
2. Nginx配置错误
3. 端口映射问题
4. 防火墙阻止连接

## 快速部署方案

### 方案1: Docker Compose 部署（推荐）

#### 1. 创建 Dockerfile

**前端 Dockerfile (frontend/Dockerfile)**
```dockerfile
# 构建阶段
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**后端 Dockerfile (backend/Dockerfile)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "src/index.js"]
```

#### 2. 创建 Nginx 配置文件

**frontend/nginx.conf**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # 处理前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 代理 API 请求到后端
    location /api {
        proxy_pass http://backend:8080;
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
```

#### 3. 创建 docker-compose.yml

**docker-compose.yml**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: lfwlw-backend
    environment:
      - NODE_ENV=production
      - PORT=8080
      - JWT_SECRET=your-production-secret-key-change-this
      - JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
    networks:
      - lfwlw-network
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: lfwlw-frontend
    ports:
      - "50000:80"
    depends_on:
      - backend
    networks:
      - lfwlw-network
    restart: unless-stopped

networks:
  lfwlw-network:
    driver: bridge
```

#### 4. 部署步骤

```bash
# 1. 构建前端生产版本
cd frontend
npm run build

# 2. 返回项目根目录
cd ..

# 3. 使用 Docker Compose 启动
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

### 方案2: 传统部署 + Nginx

#### 1. 构建前端

```bash
cd frontend
npm install
npm run build
# 构建产物在 dist 目录
```

#### 2. 配置后端生产环境

**backend/.env.production**
```env
NODE_ENV=production
PORT=8080
JWT_SECRET=your-very-secure-production-secret
JWT_REFRESH_SECRET=your-very-secure-refresh-secret
CORS_ORIGIN=http://ljinvestment.diskstation.me:50000
```

#### 3. 启动后端服务（使用 PM2）

```bash
# 安装 PM2
npm install -g pm2

cd backend
npm install

# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'lfwlw-backend',
    script: './src/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# 启动服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. 配置 Nginx

**安装 Nginx**
```bash
sudo apt update
sudo apt install nginx
```

**配置文件 /etc/nginx/sites-available/lfwlw**
```nginx
server {
    listen 50000;
    server_name ljinvestment.diskstation.me;

    # 前端静态文件
    root /home/shenzheng/lfwlw/frontend/dist;
    index index.html;

    # 处理前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 安全头
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

**启用配置**
```bash
sudo ln -s /etc/nginx/sites-available/lfwlw /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 方案3: 使用 Caddy（更简单）

**安装 Caddy**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

**Caddyfile 配置**
```caddyfile
ljinvestment.diskstation.me:50000 {
    root * /home/shenzheng/lfwlw/frontend/dist
    file_server

    handle /api/* {
        reverse_proxy localhost:8080
    }

    handle {
        try_files {path} /index.html
    }
}
```

**启动 Caddy**
```bash
sudo systemctl start caddy
sudo systemctl enable caddy
```

## 故障排查步骤

### 1. 检查服务状态

```bash
# 检查后端服务
pm2 status
pm2 logs lfwlw-backend

# 检查 Nginx
sudo systemctl status nginx
sudo nginx -t

# 检查端口
sudo netstat -tlnp | grep -E '(8080|50000)'
```

### 2. 测试连接

```bash
# 测试后端
curl http://localhost:8080/api/v1/health

# 测试前端
curl http://localhost:50000

# 测试外网访问
curl http://ljinvestment.diskstation.me:50000
```

### 3. 查看日志

```bash
# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# PM2 日志
pm2 logs

# 系统日志
sudo journalctl -xe
```

## 安全建议

### 1. 配置 HTTPS

使用 Let's Encrypt 免费证书：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ljinvestment.diskstation.me
```

### 2. 配置防火墙

```bash
# 允许必要端口
sudo ufw allow 50000/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 3. 环境变量安全

创建 `.env.production` 文件：
```env
JWT_SECRET=<使用强随机密钥>
JWT_REFRESH_SECRET=<使用强随机密钥>
SESSION_SECRET=<使用强随机密钥>
```

生成安全密钥：
```bash
openssl rand -base64 32
```

### 4. 配置访问限制

在 Nginx 中添加：
```nginx
# 限制请求频率
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20 nodelay;
    # ... 其他配置
}
```

## 监控和维护

### 1. 设置健康检查

创建健康检查脚本：
```bash
#!/bin/bash
# health-check.sh

API_URL="http://localhost:8080/api/v1/health"
FRONTEND_URL="http://localhost:50000"

# 检查 API
if ! curl -f -s "$API_URL" > /dev/null; then
    echo "API health check failed"
    pm2 restart lfwlw-backend
fi

# 检查前端
if ! curl -f -s "$FRONTEND_URL" > /dev/null; then
    echo "Frontend health check failed"
    sudo systemctl restart nginx
fi
```

添加到 crontab：
```bash
crontab -e
# 添加：每5分钟检查一次
*/5 * * * * /home/shenzheng/lfwlw/health-check.sh
```

### 2. 日志轮转

创建 `/etc/logrotate.d/lfwlw`：
```
/home/shenzheng/lfwlw/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 快速重启命令

```bash
# 重启所有服务
pm2 restart all
sudo systemctl restart nginx

# 查看状态
pm2 status
sudo systemctl status nginx

# 查看实时日志
pm2 logs --lines 100
```

## 测试部署

部署完成后，访问：
- 外网地址：http://ljinvestment.diskstation.me:50000
- 健康检查：http://ljinvestment.diskstation.me:50000/api/v1/health

使用默认账号测试登录：
- 用户名：admin
- 密码：Lfwlw@2024