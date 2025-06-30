# 修复新增用户失败问题

## 问题描述
用户列表能正常显示，但新增用户时显示失败。

## 问题原因
前端代码中访问响应数据的方式不一致。由于响应拦截器已经返回了 `data.data`，所以在组件中应该直接访问 `response` 而不是 `response.data`。

## 修复内容

### 文件：`/frontend/src/pages/UserManagement/index.tsx`

修改第85行：
```typescript
// 修改前
const { user, initialPassword } = response.data;

// 修改后
const { user, initialPassword } = response;
```

## 测试验证

### API测试
```bash
curl -X POST http://localhost:50001/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test123",
    "fullName": "测试用户",
    "role": "viewer"
  }'
```

返回结果：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "42e352fa-709c-4cb5-9e8a-adf9f533a851",
      "username": "test123",
      "fullName": "测试用户",
      "role": "viewer",
      "status": "active"
    },
    "initialPassword": "Lfwlw@2025XVEQ"
  }
}
```

## 注意事项

1. **响应数据访问规则**：
   - 成功响应：直接访问 `response`（因为拦截器返回 `data.data`）
   - 错误响应：访问 `error.response?.data?.message`（错误对象结构不变）

2. **其他需要检查的地方**：
   - 获取用户列表：已修复（`response.items`）
   - 创建用户：已修复（`response`）
   - 重置密码：已修复（`response` 而不是 `response.data`）
   - 更新用户、锁定/解锁等功能使用了正确的响应格式

## 验证步骤

1. 刷新前端页面
2. 进入用户管理
3. 点击"创建用户"
4. 填写表单并提交
5. 应该看到成功提示框，显示用户名和初始密码