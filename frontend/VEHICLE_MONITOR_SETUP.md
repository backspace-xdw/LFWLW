# 车辆监控模块配置指南

## 当前状态
车辆监控模块已修改为使用简化版本（列表视图），无需地图API即可正常运行。

## 功能特性
- ✅ 车辆分组树形结构
- ✅ 车辆列表展示
- ✅ 车辆状态实时更新
- ✅ 车辆详情查看
- ✅ 统计信息展示

## 如何启用地图功能

### 1. 获取高德地图API密钥
1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册并登录账号
3. 创建应用，获取Web端API密钥

### 2. 配置API密钥
编辑文件 `/frontend/src/config/map.ts`:
```typescript
export const AMAP_CONFIG = {
  key: '您的高德地图API密钥', // 替换这里
  version: '2.0',
  plugins: [
    'AMap.MarkerCluster',
    'AMap.InfoWindow',
    // ... 其他插件
  ]
}
```

### 3. 切换到地图版本
编辑文件 `/frontend/src/pages/VehicleMonitor/index.tsx`:
```typescript
// 注释掉简化版本
// import VehicleMapSimple from './components/VehicleMapSimple'
// 启用地图版本
import VehicleMap from './components/VehicleMap'

// 同时修改组件使用
<VehicleMap
  vehicles={vehicles.filter(v => selectedVehicles.includes(v.id))}
  center={mapCenter}
  onVehicleClick={(vehicleId) => {
    console.log('Vehicle clicked:', vehicleId)
  }}
/>
```

### 4. 添加车辆图标
在 `public` 目录下创建 `vehicle-icons` 文件夹，添加以下图标文件：
- `car-active.png` - 活跃状态小车图标
- `car-inactive.png` - 非活跃状态小车图标
- `truck-active.png` - 活跃状态卡车图标
- `truck-inactive.png` - 非活跃状态卡车图标
- `bus-active.png` - 活跃状态公交车图标
- `bus-inactive.png` - 非活跃状态公交车图标
- `cluster.png` - 聚合图标

## 简化版本功能说明

当前使用的简化版本包含：
1. **统计卡片** - 显示车辆总数、在线数量、行驶中、停止等统计
2. **车辆列表** - 表格形式展示所有车辆信息
3. **状态标签** - 不同颜色标识车辆状态
4. **详情面板** - 点击查看详情显示完整车辆信息

## 实时数据更新

车辆监控模块已集成实时数据更新功能：
```typescript
const { data: realtimeData } = useRealtimeData('vehicle-location')
```

后端需要通过Socket.IO发送格式如下的数据：
```javascript
socket.emit('vehicle-location', {
  vehicleId: 'v1',
  location: {
    longitude: 116.404,
    latitude: 39.915,
    speed: 45,
    direction: 90
  }
})
```

## 扩展建议

1. **添加轨迹回放** - 记录并回放车辆历史轨迹
2. **电子围栏** - 设置区域报警
3. **路线规划** - 显示最优路径
4. **实时路况** - 集成交通信息

---

车辆监控模块现在可以正常运行，无需额外配置！