# LFWLW 远程访问配置指南

## 方案二：nginx反向代理实施步骤

### 1. 安装nginx
```bash
./install_nginx.sh
```

### 2. 配置nginx
```bash
./configure_nginx.sh
```

### 3. 检查状态
```bash
./check_nginx_status.sh
```

### 4. 确保服务运行
前端和后端服务必须保持运行：
- 前端：http://localhost:50000
- 后端：http://localhost:50001

### 5. 防火墙配置
确保服务器防火墙开放80端口：
```bash
sudo ufw allow 80/tcp  # Ubuntu防火墙
# 或
sudo firewall-cmd --permanent --add-port=80/tcp  # CentOS防火墙
sudo firewall-cmd --reload
```

### 6. 远程访问
配置完成后，远程同事可以通过以下地址访问：
- 主页：http://ljinvestment.diskstation.me
- API：http://ljinvestment.diskstation.me/api
- WebSocket：自动连接

### 7. 登录信息
- 用户名：admin
- 密码：admin123

## 故障排查

### nginx未运行
```bash
sudo systemctl start nginx
# 或
sudo service nginx start
```

### 配置错误
```bash
sudo nginx -t  # 测试配置
sudo tail -f /var/log/nginx/error.log  # 查看错误日志
```

### 端口占用
```bash
sudo lsof -i :80  # 查看80端口占用
```

## 注意事项

1. **开发模式特性**：
   - 支持热更新（HMR）
   - 实时代码修改反馈
   - 调试信息输出

2. **性能考虑**：
   - nginx作为反向代理不影响开发性能
   - WebSocket连接保持稳定
   - 支持多人同时访问

3. **安全提醒**：
   - 这是开发环境配置，不适用于生产环境
   - 建议仅在内网或VPN环境使用
   - 生产环境需要额外的安全配置

## 常用命令

```bash
# 重启nginx
sudo systemctl restart nginx

# 查看nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 停止nginx
sudo systemctl stop nginx
```