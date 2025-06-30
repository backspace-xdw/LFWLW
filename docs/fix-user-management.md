# 用户管理功能修复说明

## 问题描述
用户管理页面报错"获取用户列表失败"

## 问题原因
后端启动时没有初始化UserModel，导致用户数据为空，API调用失败。

## 修复步骤

### 1. 修改后端启动文件
在 `/backend/src/index.ts` 中添加了：

```typescript
// 导入UserModel
import { UserModel } from './models/user.model'

// 在startServer函数中初始化
async function startServer() {
  try {
    // ... 其他初始化代码 ...
    
    // 初始化用户模型
    await UserModel.initialize()
    logger.info('User model initialized with default users')
    
    // ... 启动服务器代码 ...
  }
}
```

### 2. 重启后端服务
```bash
# 停止旧服务
lsof -ti:50001 | xargs kill -9

# 重新启动
cd /home/shenzheng/lfwlw/backend
npm run dev
```

## 验证修复

### 1. 测试API
```bash
# 登录获取token
curl -X POST http://localhost:50001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 使用token获取用户列表
curl http://localhost:50001/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 在前端验证
1. 刷新浏览器页面
2. 重新登录（用户名：admin，密码：admin123）
3. 访问用户管理页面
4. 应该能看到用户列表

## 默认用户
系统初始化时会创建两个默认用户：
- 超级管理员：superadmin / SuperAdmin@2024
- 管理员：admin / admin123

## 注意事项
1. 确保后端启动日志中有 "User model initialized with default users"
2. 如果出现重复用户，可能是多次初始化导致（不影响使用）
3. 建议修改初始密码为文档中说明的标准密码