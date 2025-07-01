# LFWLW 物联网远程监控管理平台

基于蓝蜂物联网参考设计的工业物联网监控平台，提供设备管理、实时监控、3D可视化、告警管理等功能。

## 技术栈

### 前端
- React 18 + TypeScript
- Ant Design 5
- ECharts（数据可视化）
- Konva.js（2D图形编辑）
- Socket.io Client（实时通信）
- Zustand + Immer（状态管理）
- Vite（构建工具）

### 后端
- Node.js + Express + TypeScript
- PostgreSQL + InfluxDB + Redis
- Socket.io（WebSocket服务）
- MQTT（设备通信）
- JWT 认证
- Winston（日志管理）

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
# 分别启动前后端
cd frontend && npm run dev  # 前端运行在 http://localhost:50000
cd backend && npm run dev   # 后端运行在 http://localhost:50001
```

### 4. 默认登录账号

- 管理员账号: admin / admin123
- 普通用户: user / user123
- 运维人员: operator / operator123

## 主要功能

### 已实现
- ✅ 用户登录认证（JWT）
- ✅ 响应式布局框架
- ✅ 监控仪表板（仪表盘、图表）
- ✅ 基础路由和导航
- ✅ 设备管理（完整CRUD操作）
- ✅ 实时数据监控（WebSocket推送）
- ✅ 2D图形编辑器（工业P&ID符号）
- ✅ 告警管理系统（多级别告警规则）
- ✅ 用户管理（角色权限控制）
- ✅ 数据可视化（ECharts集成）

### 新增功能（2025-06-30）
- ✅ **2D图形编辑器**
  - 基于Konva.js实现的工业图形编辑器
  - 支持P&ID标准工业符号（泵、阀门、储罐、传感器等）
  - 实时数据绑定和动态显示
  - 图形拖拽、缩放、旋转操作
  - 图形属性配置面板
  - 场景保存和加载

- ✅ **高级告警管理**
  - 支持多种告警类型：
    - 高高报警(HH) - 超过高高限值
    - 高报警(H) - 超过高限值  
    - 低报警(L) - 低于低限值
    - 低低报警(LL) - 低于低低限值
    - 变化率报警(ROC) - 单位时间变化量超限
    - 偏差报警(DEVIATION) - 与设定值偏差超限
  - 告警规则配置管理
  - 延迟触发和死区设置
  - 告警状态管理（活动/确认/解决）
  - 实时告警推送和统计

### 开发中
- 🔧 3D可视化展示
- 🔧 数据分析报表
- 🔧 白标定制功能
- 🔧 移动端适配优化

## 核心特性

### 1. 多端统一
- Web管理平台
- 移动端适配
- 大屏展示支持

### 2. 实时监控
- WebSocket实时通信
- MQTT设备数据接入
- 仪表盘可视化展示

### 3. 2D/3D可视化
- Konva.js 2D图形编辑器（已实现）
- P&ID工业符号库
- 实时数据绑定
- Three.js 3D渲染（开发中）

### 4. 告警管理
- 六种告警类型（HH/H/L/LL/ROC/DEVIATION）
- 灵活的告警规则配置
- 延迟触发和死区设置
- 实时告警推送
- 告警生命周期管理

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