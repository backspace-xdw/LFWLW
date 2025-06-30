# 用户管理系统自动化测试脚本

## 测试脚本说明

本文档提供了用户管理系统的自动化测试脚本示例，可以使用Jest + Supertest进行后端API测试，使用Cypress进行前端E2E测试。

## 后端API测试脚本

### 安装测试依赖
```bash
cd backend
npm install --save-dev jest @types/jest supertest @types/supertest ts-jest
```

### 配置文件 (jest.config.js)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
```

### 测试脚本示例 (backend/src/__tests__/auth.test.ts)
```typescript
import request from 'supertest';
import { app } from '../app';

describe('Authentication API Tests', () => {
  let adminToken: string;
  let operatorToken: string;

  beforeAll(async () => {
    // 获取管理员token
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'Lfwlw@2024'
      });
    adminToken = adminLogin.body.accessToken;
  });

  describe('POST /api/v1/auth/login', () => {
    test('应该成功登录管理员账号', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin',
          password: 'Lfwlw@2024'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.username).toBe('admin');
    });

    test('应该拒绝错误的密码', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('密码错误');
    });

    test('应该在5次失败后锁定账号', async () => {
      // 创建测试用户
      const testUser = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'testlock',
          fullName: '测试锁定',
          role: 'viewer'
        });

      // 尝试5次错误登录
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: 'testlock',
            password: 'wrongpassword'
          });
      }

      // 第6次应该被锁定
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testlock',
          password: 'anypassword'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('账号已被锁定');
    });
  });

  describe('POST /api/v1/auth/change-initial-password', () => {
    test('应该成功修改初始密码', async () => {
      // 创建新用户
      const createResponse = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newoperator',
          fullName: '新操作员',
          role: 'operator'
        });

      const initialPassword = createResponse.body.initialPassword;

      // 首次登录
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'newoperator',
          password: initialPassword
        });

      expect(loginResponse.body.mustChangePassword).toBe(true);
      expect(loginResponse.body.tempToken).toBeDefined();

      // 修改密码
      const changeResponse = await request(app)
        .post('/api/v1/auth/change-initial-password')
        .send({
          tempToken: loginResponse.body.tempToken,
          newPassword: 'NewPassword@123'
        });

      expect(changeResponse.status).toBe(200);

      // 使用新密码登录
      const newLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'newoperator',
          password: 'NewPassword@123'
        });

      expect(newLoginResponse.status).toBe(200);
      expect(newLoginResponse.body.mustChangePassword).toBe(false);
    });
  });

  describe('Session Management', () => {
    test('应该在30分钟后使token过期', async () => {
      // 这个测试需要模拟时间流逝
      // 使用jest.useFakeTimers()
    });

    test('应该成功刷新token', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin',
          password: 'Lfwlw@2024'
        });

      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: loginResponse.body.refreshToken
        });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
    });
  });
});
```

### 用户管理测试 (backend/src/__tests__/users.test.ts)
```typescript
import request from 'supertest';
import { app } from '../app';

describe('User Management API Tests', () => {
  let adminToken: string;
  let operatorToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // 获取管理员token
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'Lfwlw@2024'
      });
    adminToken = adminLogin.body.accessToken;
  });

  describe('POST /api/v1/users', () => {
    test('管理员应该能创建新用户', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'testuser001',
          fullName: '测试用户',
          employeeId: 'EMP001',
          department: '测试部',
          role: 'operator'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.username).toBe('testuser001');
      expect(response.body).toHaveProperty('initialPassword');
      expect(response.body.initialPassword).toMatch(/^Lfwlw@\d{4}[A-Z0-9]{4}$/);
      
      testUserId = response.body.user.id;
    });

    test('应该拒绝重复的用户名', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'testuser001',
          fullName: '重复用户',
          role: 'viewer'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('用户名已存在');
    });

    test('应该验证用户名格式', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'test user', // 包含空格
          fullName: '测试用户',
          role: 'viewer'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('用户名格式不正确');
    });
  });

  describe('GET /api/v1/users', () => {
    test('管理员应该能获取用户列表', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
    });

    test('操作员不应该能访问用户列表', async () => {
      // 先创建并登录操作员账号
      const operatorLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser001',
          password: 'Lfwlw@2024' // 假设已修改密码
        });

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${operatorLogin.body.accessToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    test('应该能更新用户信息', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: '更新后的名字',
          department: '新部门',
          status: 'active'
        });

      expect(response.status).toBe(200);
      expect(response.body.fullName).toBe('更新后的名字');
      expect(response.body.department).toBe('新部门');
    });
  });

  describe('POST /api/v1/users/:id/reset-password', () => {
    test('应该能重置用户密码', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${testUserId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tempPassword');
      expect(response.body.tempPassword).toMatch(/^Temp@\d{4}[A-Z0-9]{4}$/);
    });
  });

  describe('POST /api/v1/users/:id/lock', () => {
    test('应该能锁定用户账号', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${testUserId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // 验证被锁定用户无法登录
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser001',
          password: 'anypassword'
        });

      expect(loginResponse.status).toBe(403);
      expect(loginResponse.body.message).toContain('账号已被锁定');
    });
  });

  describe('POST /api/v1/users/:id/unlock', () => {
    test('应该能解锁用户账号', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${testUserId}/unlock`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    test('应该能删除用户', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // 验证用户已被删除
      const getResponse = await request(app)
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
```

## 前端E2E测试脚本

### 安装Cypress
```bash
cd frontend
npm install --save-dev cypress @cypress/react @cypress/webpack-dev-server
```

### Cypress配置 (cypress.config.ts)
```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
  },
});
```

### E2E测试脚本 (cypress/e2e/user-management.cy.ts)
```typescript
describe('用户管理系统E2E测试', () => {
  beforeEach(() => {
    // 重置测试数据
    cy.task('resetDatabase');
  });

  describe('登录流程', () => {
    it('应该成功登录管理员账号', () => {
      cy.visit('/login');
      cy.get('input[placeholder="用户名"]').type('admin');
      cy.get('input[placeholder="密码"]').type('Lfwlw@2024');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/dashboard');
      cy.contains('LFWLW物联网监控平台').should('be.visible');
    });

    it('应该显示密码错误提示', () => {
      cy.visit('/login');
      cy.get('input[placeholder="用户名"]').type('admin');
      cy.get('input[placeholder="密码"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.contains('登录失败，请检查用户名和密码').should('be.visible');
    });
  });

  describe('用户管理操作', () => {
    beforeEach(() => {
      // 登录管理员账号
      cy.login('admin', 'Lfwlw@2024');
    });

    it('应该能创建新用户', () => {
      cy.visit('/users');
      cy.get('button').contains('创建用户').click();

      // 填写表单
      cy.get('input[placeholder="请输入用户名"]').type('cypress001');
      cy.get('input[placeholder="请输入姓名"]').type('Cypress测试');
      cy.get('input[placeholder="请输入员工号（选填）"]').type('CY001');
      cy.get('input[placeholder="请输入部门（选填）"]').type('测试部');
      
      // 选择角色
      cy.get('.ant-select').contains('请选择角色').click();
      cy.get('.ant-select-item').contains('操作员').click();

      // 提交表单
      cy.get('button').contains('创建').click();

      // 验证成功提示
      cy.get('.ant-modal').contains('用户创建成功').should('be.visible');
      cy.get('.ant-modal').contains('cypress001').should('be.visible');
      cy.get('.ant-modal').contains('Lfwlw@').should('be.visible');

      // 关闭弹窗
      cy.get('.ant-modal button').contains('我已记录').click();

      // 验证用户出现在列表中
      cy.get('table').contains('cypress001').should('be.visible');
    });

    it('应该能编辑用户信息', () => {
      cy.visit('/users');
      
      // 找到测试用户并点击编辑
      cy.get('table').contains('tr', 'cypress001').within(() => {
        cy.get('button[title="编辑"]').click();
      });

      // 修改信息
      cy.get('input[value="Cypress测试"]').clear().type('更新的名字');
      cy.get('input[value="测试部"]').clear().type('新部门');

      // 保存
      cy.get('button').contains('保存').click();

      // 验证更新
      cy.contains('用户信息更新成功').should('be.visible');
      cy.get('table').contains('更新的名字').should('be.visible');
      cy.get('table').contains('新部门').should('be.visible');
    });

    it('应该能重置用户密码', () => {
      cy.visit('/users');
      
      // 找到测试用户并点击重置密码
      cy.get('table').contains('tr', 'cypress001').within(() => {
        cy.get('button[title="重置密码"]').click();
      });

      // 确认重置
      cy.get('.ant-popconfirm button').contains('确定').click();

      // 验证成功提示
      cy.get('.ant-modal').contains('密码重置成功').should('be.visible');
      cy.get('.ant-modal').contains('Temp@').should('be.visible');
    });

    it('应该能锁定和解锁用户', () => {
      cy.visit('/users');
      
      // 锁定用户
      cy.get('table').contains('tr', 'cypress001').within(() => {
        cy.get('button[title="锁定"]').click();
      });
      cy.get('.ant-popconfirm button').contains('确定').click();

      // 验证状态变化
      cy.contains('账号已锁定').should('be.visible');
      cy.get('table').contains('tr', 'cypress001').within(() => {
        cy.contains('已锁定').should('be.visible');
      });

      // 解锁用户
      cy.get('table').contains('tr', 'cypress001').within(() => {
        cy.get('button[title="解锁"]').click();
      });
      cy.get('.ant-popconfirm button').contains('确定').click();

      // 验证状态恢复
      cy.contains('账号已解锁').should('be.visible');
    });
  });

  describe('首次登录密码修改', () => {
    it('新用户应该被强制修改密码', () => {
      // 创建新用户并获取初始密码
      cy.login('admin', 'Lfwlw@2024');
      cy.createUser('firstlogin', '首次登录').then((initialPassword) => {
        // 退出当前账号
        cy.logout();

        // 使用新用户登录
        cy.visit('/login');
        cy.get('input[placeholder="用户名"]').type('firstlogin');
        cy.get('input[placeholder="密码"]').type(initialPassword);
        cy.get('button[type="submit"]').click();

        // 验证弹出修改密码弹窗
        cy.get('.ant-modal-title').contains('首次登录 - 修改密码').should('be.visible');
        
        // 弹窗不能关闭
        cy.get('.ant-modal-close').should('not.exist');

        // 输入新密码
        cy.get('input[placeholder="请输入新密码"]').type('NewSecure@123');
        cy.get('input[placeholder="请再次输入新密码"]').type('NewSecure@123');
        cy.get('button').contains('确定').click();

        // 验证成功提示
        cy.contains('密码修改成功，请使用新密码登录').should('be.visible');

        // 使用新密码登录
        cy.get('input[placeholder="用户名"]').type('firstlogin');
        cy.get('input[placeholder="密码"]').type('NewSecure@123');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/dashboard');
      });
    });
  });

  describe('搜索和筛选功能', () => {
    beforeEach(() => {
      cy.login('admin', 'Lfwlw@2024');
      // 创建测试数据
      cy.createUser('search001', '搜索测试1', 'EMP001', '技术部');
      cy.createUser('search002', '搜索测试2', 'EMP002', '销售部');
      cy.createUser('filter001', '筛选测试', 'EMP003', '技术部');
    });

    it('应该能按用户名搜索', () => {
      cy.visit('/users');
      cy.get('input[placeholder*="搜索"]').type('search');
      
      cy.get('table').contains('search001').should('be.visible');
      cy.get('table').contains('search002').should('be.visible');
      cy.get('table').contains('filter001').should('not.exist');
    });

    it('应该能按角色筛选', () => {
      cy.visit('/users');
      cy.get('.ant-select').contains('筛选角色').click();
      cy.get('.ant-select-item').contains('操作员').click();

      // 验证只显示操作员角色的用户
      cy.get('table .ant-tag').each(($tag) => {
        cy.wrap($tag).should('contain', '操作员');
      });
    });
  });
});
```

### Cypress命令扩展 (cypress/support/commands.ts)
```typescript
declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      createUser(username: string, fullName: string, employeeId?: string, department?: string): Chainable<string>;
    }
  }
}

// 登录命令
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.request('POST', '/api/v1/auth/login', { username, password }).then((response) => {
    window.localStorage.setItem('auth-token', response.body.accessToken);
    window.localStorage.setItem('refresh-token', response.body.refreshToken);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

// 退出登录命令
Cypress.Commands.add('logout', () => {
  window.localStorage.clear();
  cy.visit('/login');
});

// 创建用户命令
Cypress.Commands.add('createUser', (username: string, fullName: string, employeeId?: string, department?: string) => {
  cy.request({
    method: 'POST',
    url: '/api/v1/users',
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('auth-token')}`,
    },
    body: {
      username,
      fullName,
      employeeId,
      department,
      role: 'operator',
    },
  }).then((response) => {
    return response.body.initialPassword;
  });
});

export {};
```

## 运行测试

### 后端测试
```bash
cd backend
npm test                    # 运行所有测试
npm test -- --coverage     # 运行测试并生成覆盖率报告
npm test auth.test.ts      # 只运行认证测试
```

### 前端E2E测试
```bash
cd frontend
npx cypress open           # 打开Cypress测试界面
npx cypress run            # 无头模式运行所有测试
npx cypress run --spec "cypress/e2e/user-management.cy.ts"  # 运行特定测试
```

## 持续集成配置

### GitHub Actions示例 (.github/workflows/test.yml)
```yaml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install backend dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run backend tests
        run: |
          cd backend
          npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage/lcov.info

  frontend-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
          cd ../frontend
          npm ci
      
      - name: Start backend
        run: |
          cd backend
          npm start &
          npx wait-on http://localhost:8080/health
      
      - name: Start frontend
        run: |
          cd frontend
          npm start &
          npx wait-on http://localhost:3000
      
      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          working-directory: frontend
          wait-on: 'http://localhost:3000'
          browser: chrome
```