# LFWLW 外网访问配置指南

## 问题诊断

经过测试，您的服务实际上是可以从外网访问的（HTTP 200响应），但可能存在以下问题：

1. **浏览器兼容性**：某些浏览器可能阻止非标准端口
2. **Vite 开发服务器限制**：ESM 模块加载可能在某些网络环境下失败
3. **防火墙或安全软件**：可能阻止了 JavaScript 资源加载

## 解决方案

### 方案1：使用标准端口（推荐）

在路由器上配置端口转发：
- 外网端口 80 → 内网 192.168.0.20:50000
- 外网端口 8080 → 内网 192.168.0.20:50000

然后通过以下地址访问：
- http://ljinvestment.diskstation.me （使用80端口）
- http://ljinvestment.diskstation.me:8080 （使用8080端口）

### 方案2：使用代理服务器

运行代理服务器（端口8080）：
```bash
node serve-static.js
```

访问地址：http://ljinvestment.diskstation.me:8080

### 方案3：检查浏览器

1. 清除浏览器缓存
2. 使用隐私/无痕模式
3. 尝试不同的浏览器（Chrome、Firefox、Edge）
4. 检查浏览器控制台是否有错误信息（F12）

### 方案4：测试连接

1. 在浏览器中访问测试页面：
   http://ljinvestment.diskstation.me:8088/test.html

2. 或使用命令行测试：
   ```bash
   curl http://ljinvestment.diskstation.me:50000
   ```

## 当前服务状态

- 前端服务：运行在 50000 端口 ✅
- 后端服务：运行在 50001 端口 ✅
- 外网访问：可达（HTTP 200）✅

## 建议

为了更稳定的外网访问，建议：

1. 使用 nginx 反向代理
2. 配置 HTTPS 证书
3. 使用标准端口（80/443）
4. 考虑使用 CDN 服务

## 紧急修复

如果上述方案都不行，请尝试：

```bash
# 停止当前服务
./stop.sh

# 使用生产部署
chmod +x deploy-production.sh
./deploy-production.sh
```

然后访问：http://ljinvestment.diskstation.me:8080