# LFWLW 快速启动指南

## 🚀 快速启动

### 1. 启动后端服务
```bash
cd /home/shenzheng/lfwlw/backend
npm run dev
# 或使用已有脚本
./start.sh
```

### 2. 启动前端服务
```bash
cd /home/shenzheng/lfwlw/frontend
npm run dev
# 或使用已有脚本
./start.sh
```

### 3. 访问系统
- 本地: http://localhost:50000
- 外网: http://67.169.169.65:50000
- 账号: admin / admin123

## ⚠️ 重要提醒

### 绝对不要：
1. ❌ 在 `.env.development` 中填写API地址
2. ❌ 在 `vite.config.ts` 的proxy中添加rewrite规则
3. ❌ 修改端口配置（50000/50001）
4. ❌ 直接访问 ljinvestment.diskstation.me（DNS指向错误）

### 必须确保：
1. ✅ `.env.development` 中的 `VITE_API_BASE_URL` 为空
2. ✅ nginx正在运行（监听80端口）
3. ✅ 路由器端口转发正确（50000→80）
4. ✅ 使用正确的访问地址

## 🔧 常用命令

```bash
# 查看服务状态
ps aux | grep node

# 检查端口
netstat -tlnp | grep -E "50000|50001|80"

# 查看日志
tail -f backend/backend_new.log
tail -f frontend/frontend_local.log

# 重启nginx
sudo systemctl restart nginx
```

## 📱 分享给同事

直接发送以下信息：
```
LFWLW系统访问地址：
http://67.169.169.65:50000
账号：admin
密码：admin123
```

---
如有问题，请参考 [DEPLOYMENT_CONFIG.md](./DEPLOYMENT_CONFIG.md) 详细配置文档。