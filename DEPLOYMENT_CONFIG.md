# LFWLW 物联网监控平台 - 部署配置文档

> 本文档记录了系统的关键配置和部署注意事项，避免在今后的开发中重复错误。

## 🚨 重要警告

**绝对不要在以下文件中硬编码外部API地址：**
- `.env.development`
- `.env.production`
- `vite.config.ts`
- 任何源代码文件

## 📋 系统架构

```
[远程用户] → [67.169.169.65:50000] → [路由器端口转发]
                                           ↓
                                    [192.168.0.20:80]
                                           ↓
                                    [nginx反向代理]
                                        ↙     ↘
                            [localhost:50000]  [localhost:50001]
                              (前端Vite)        (后端Express)
```

## 🔧 核心配置

### 1. 前端配置

#### `/frontend/.env.development`
```env
# 开发环境配置
# 使用相对路径，让请求通过vite代理
VITE_API_BASE_URL=
VITE_WS_URL=
```

⚠️ **注意**：这两个值必须为空字符串，不要填写任何URL！

#### `/frontend/vite.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 50000,
    proxy: {
      '/api': {
        target: 'http://localhost:50001',
        changeOrigin: true,
        // 不要添加 rewrite 规则！
      },
      '/ws': {
        target: 'ws://localhost:50001',
        ws: true,
      },
    },
  },
})
```

⚠️ **注意**：不要在 `/api` 代理中添加 `rewrite` 规则，否则会导致路径重复！

### 2. 后端配置

#### `/backend/.env`
```env
PORT=50001
NODE_ENV=development
JWT_SECRET=dev-secret-key-2024
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### 3. Nginx配置

#### `/etc/nginx/sites-available/lfwlw`
```nginx
server {
    listen 80;
    server_name ljinvestment.diskstation.me;
    
    # 前端代理
    location / {
        proxy_pass http://127.0.0.1:50000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        # 关键：使用localhost作为Host头，绕过Vite的安全检查
        proxy_set_header Host localhost:50000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # 后端API代理
    location /api {
        proxy_pass http://127.0.0.1:50001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket代理
    location /ws {
        proxy_pass http://127.0.0.1:50001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Socket.IO代理
    location /socket.io/ {
        proxy_pass http://127.0.0.1:50001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Vite HMR
    location /__vite_ping {
        proxy_pass http://127.0.0.1:50000;
        proxy_http_version 1.1;
        proxy_set_header Host localhost:50000;
    }
    
    location /__vite_hmr {
        proxy_pass http://127.0.0.1:50000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host localhost:50000;
    }
    
    client_max_body_size 50M;
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
}
```

### 4. 路由器端口转发

```
外部端口: 50000
内部IP: 192.168.0.20
内部端口: 80
协议: TCP
```

## 🚀 启动命令

### 启动后端
```bash
cd /home/shenzheng/lfwlw/backend
npm run dev
```

### 启动前端
```bash
cd /home/shenzheng/lfwlw/frontend
npm run dev
```

## 🌐 访问地址

- **本地开发**: http://localhost:50000
- **局域网访问**: http://192.168.0.20:50000
- **外网访问**: http://67.169.169.65:50000

## 🔑 登录信息

- 用户名: `admin`
- 密码: `admin123`

## ❌ 常见错误及解决方案

### 1. API请求发送到错误地址
**错误现象**: 请求发送到 `http://ljinvestment.diskstation.me:50001`

**原因**: `.env.development` 中硬编码了API地址

**解决方案**: 清空 `VITE_API_BASE_URL` 和 `VITE_WS_URL`

### 2. 登录返回404错误
**错误现象**: POST `/api/v1/auth/login` 返回404

**原因**: Vite代理配置中的 `rewrite` 规则导致路径重复

**解决方案**: 删除 `rewrite` 规则

### 3. 外网访问显示"Blocked request"
**错误现象**: Vite阻止外部域名访问

**原因**: Vite 5.x的安全特性

**解决方案**: 使用nginx反向代理，将Host头改为localhost

## 📝 开发注意事项

1. **环境变量**: 所有API相关的环境变量应该使用相对路径或留空
2. **代理配置**: Vite的代理配置中不要添加额外的路径重写规则
3. **CORS配置**: 后端CORS设置为 `*` 以支持开发环境
4. **WebSocket**: 确保WebSocket路径正确代理
5. **热更新**: Vite的HMR需要特殊的nginx配置

## 🔍 故障排查

### 检查服务状态
```bash
# 检查进程
ps aux | grep -E "node|nginx"

# 检查端口
netstat -tlnp | grep -E "50000|50001|80"

# 检查nginx配置
sudo nginx -t

# 查看nginx日志
sudo tail -f /var/log/nginx/error.log
```

### 清除缓存
如果遇到配置不生效的问题：
1. 清除浏览器缓存
2. 使用无痕模式测试
3. 重启Vite开发服务器

## 📚 相关文件路径

- 前端项目: `/home/shenzheng/lfwlw/frontend`
- 后端项目: `/home/shenzheng/lfwlw/backend`
- Nginx配置: `/etc/nginx/sites-available/lfwlw`
- 日志文件:
  - 前端: `/home/shenzheng/lfwlw/frontend/frontend_local.log`
  - 后端: `/home/shenzheng/lfwlw/backend/backend_new.log`

---

**最后更新**: 2025-06-29
**维护者**: LFWLW开发团队