# LFWLW 物联网远程监控管理平台

基于蓝蜂物联网参考设计的工业物联网监控平台，提供设备管理、实时监控、3D可视化、告警管理等功能。

## 技术栈

### 前端
- React 18 + TypeScript
- Ant Design 5
- ECharts + Three.js
- Socket.io Client
- Zustand 状态管理

### 后端
- Node.js + Express + TypeScript
- PostgreSQL + InfluxDB + Redis
- Socket.io + MQTT
- JWT 认证

## 项目结构

```
lfwlw/
├── frontend/              # 前端项目
│   ├── src/
│   │   ├── components/   # 通用组件
│   │   ├── pages/       # 页面组件
│   │   ├── services/    # API服务
│   │   ├── store/       # 状态管理
│   │   ├── utils/       # 工具函数
│   │   └── styles/      # 样式文件
│   └── package.json
├── backend/              # 后端项目
│   ├── src/
│   │   ├── controllers/ # 控制器
│   │   ├── services/    # 业务服务
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # 路由定义
│   │   ├── middleware/  # 中间件
│   │   └── config/      # 配置文件
│   └── package.json
└── docs/                # 项目文档
```

## 快速开始

### 1. 安装依赖

```bash
# 安装所有依赖
npm run install:all
```

### 2. 配置环境变量

```bash
# 复制后端环境变量配置
cp backend/.env.example backend/.env
# 编辑 backend/.env 填入实际配置
```

### 3. 启动开发服务器

```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:frontend  # 前端运行在 http://localhost:3000
npm run dev:backend   # 后端运行在 http://localhost:5000
```

### 4. 默认登录账号

- 用户名: admin
- 密码: admin123

## 主要功能

### 已实现
- ✅ 用户登录认证（JWT）
- ✅ 响应式布局框架
- ✅ 监控仪表板（仪表盘、图表）
- ✅ 基础路由和导航

### 开发中
- 🔧 设备管理（CRUD）
- 🔧  实时数据监控
- 🔧 3D可视化展示
- 🔧 告警管理系统
- 🔧 数据分析报表
- 🔧 白标定制功能

## 核心特性

### 1. 多端统一
- Web管理平台
- 移动端适配
- 大屏展示支持

### 2. 实时监控
- WebSocket实时通信
- MQTT设备数据接入
- 仪表盘可视化展示

### 3. 3D可视化
- Three.js 3D渲染
- 设备模型展示
- 数据驱动动画

### 4. 告警管理
- 多级告警规则
- 实时告警推送
- 告警统计分析

## 开发指南

### 代码规范
- 使用 ESLint + Prettier
- TypeScript 严格模式
- 组件使用函数式组件 + Hooks

### Git 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试相关
- chore: 构建/工具

## 部署

```bash
# 构建生产版本
npm run build

# 启动生产服务
npm start
```

## 许可证

MIT License

---

**注意**: 本项目为学习和参考用途，基于蓝蜂物联网的设计理念进行开发。