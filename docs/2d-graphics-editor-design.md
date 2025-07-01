# 2D图形编辑器技术方案

## 1. 概述

### 1.1 功能定位
为物联网监控平台提供工业流程图绘制能力，支持创建P&ID(管道仪表图)、工艺流程图、电气接线图等2D图形，并能与实时数据绑定。

### 1.2 核心特性
- **可视化编辑**: 拖拽式图形编辑，所见即所得
- **工业元素库**: 预置工业设备符号和管道元件
- **智能连线**: 自动路径计算，正交连线
- **数据绑定**: 图形元素与设备数据实时关联
- **多格式导出**: 支持SVG、PNG、PDF等格式
- **协同编辑**: 多人同时编辑（未来功能）

## 2. 技术选型

### 2.1 图形引擎
- **Konva.js**: 2D Canvas库，性能优秀，API友好
- **备选方案**: 
  - Fabric.js: 功能丰富但体积较大
  - Paper.js: 矢量图形库，适合复杂路径
  - SVG.js: 纯SVG方案，利于导出

### 2.2 技术栈
```typescript
const tech2DStack = {
  graphics: 'Konva.js',           // 2D图形引擎
  reactWrapper: 'react-konva',    // React集成
  stateManagement: 'zustand',     // 状态管理
  persistence: 'IndexedDB',       // 本地存储
  export: {
    svg: 'native',                // SVG导出
    pdf: 'jsPDF',                 // PDF导出
    image: 'canvas.toDataURL'     // 图片导出
  }
}
```

## 3. 架构设计

### 3.1 组件架构
```
┌─────────────────────────────────────────────────┐
│                 2D图形编辑器                      │
├─────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────┬──────────────┐ │
│  │   工具栏      │   画布区域    │   属性面板    │ │
│  │  - 选择工具   │  - 图形渲染   │  - 元素属性   │ │
│  │  - 绘制工具   │  - 网格/标尺  │  - 样式设置   │ │
│  │  - 元素库     │  - 缩放/平移  │  - 数据绑定   │ │
│  └──────────────┴──────────────┴──────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │              图形引擎层                      │ │
│  │   Konva.js / Canvas API / Event System     │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │              数据层                         │ │
│  │   图形数据模型 / 状态管理 / 持久化存储        │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 3.2 数据模型
```typescript
// 图形文档模型
interface GraphicDocument {
  id: string;
  name: string;
  type: 'pid' | 'flowchart' | 'electrical';
  version: string;
  metadata: {
    created: Date;
    modified: Date;
    author: string;
    description?: string;
  };
  canvas: {
    width: number;
    height: number;
    background?: string;
    grid?: GridConfig;
  };
  elements: GraphicElement[];
  connections: Connection[];
  dataBindings: DataBinding[];
}

// 图形元素模型
interface GraphicElement {
  id: string;
  type: ElementType;
  category: 'equipment' | 'pipe' | 'valve' | 'instrument' | 'text' | 'shape';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  style: ElementStyle;
  properties: Record<string, any>;
  locked?: boolean;
  visible?: boolean;
}

// 连接线模型
interface Connection {
  id: string;
  type: 'pipe' | 'wire' | 'signal';
  source: { elementId: string; port: string };
  target: { elementId: string; port: string };
  points: Point[];
  style: ConnectionStyle;
  flow?: FlowConfig;
}

// 数据绑定模型
interface DataBinding {
  elementId: string;
  property: string;
  deviceId: string;
  dataPoint: string;
  transform?: DataTransform;
}
```

## 4. 工业元素库设计

### 4.1 元素分类
```yaml
工业设备:
  泵类:
    - 离心泵 (Centrifugal Pump)
    - 齿轮泵 (Gear Pump)
    - 隔膜泵 (Diaphragm Pump)
    - 真空泵 (Vacuum Pump)
  
  阀门类:
    - 球阀 (Ball Valve)
    - 闸阀 (Gate Valve)
    - 蝶阀 (Butterfly Valve)
    - 调节阀 (Control Valve)
    - 安全阀 (Safety Valve)
  
  容器类:
    - 储罐 (Storage Tank)
    - 反应器 (Reactor)
    - 换热器 (Heat Exchanger)
    - 分离器 (Separator)
  
  仪表类:
    - 压力表 (Pressure Gauge)
    - 温度计 (Thermometer)
    - 流量计 (Flow Meter)
    - 液位计 (Level Gauge)
  
  电气元件:
    - 电机 (Motor)
    - 变压器 (Transformer)
    - 开关 (Switch)
    - 断路器 (Circuit Breaker)

管道配件:
  - 弯头 (Elbow)
  - 三通 (Tee)
  - 异径管 (Reducer)
  - 法兰 (Flange)
```

### 4.2 元素设计规范
```typescript
// 元素模板定义
interface ElementTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  defaultSize: { width: number; height: number };
  ports: Port[];        // 连接点
  properties: Property[]; // 可配置属性
  graphics: {
    type: 'svg' | 'path' | 'composite';
    data: string | GraphicPrimitive[];
  };
  animations?: Animation[]; // 动画定义
}

// 示例：离心泵模板
const centrifugalPumpTemplate: ElementTemplate = {
  id: 'pump_centrifugal',
  name: '离心泵',
  category: 'pump',
  icon: '/icons/pump_centrifugal.svg',
  defaultSize: { width: 80, height: 60 },
  ports: [
    { id: 'inlet', position: { x: 0, y: 0.5 }, direction: 'left' },
    { id: 'outlet', position: { x: 1, y: 0.5 }, direction: 'right' }
  ],
  properties: [
    { name: 'tag', type: 'string', label: '位号' },
    { name: 'flow', type: 'number', label: '流量', unit: 'm³/h' },
    { name: 'pressure', type: 'number', label: '压力', unit: 'bar' }
  ],
  graphics: {
    type: 'svg',
    data: '<svg>...</svg>'
  },
  animations: [
    {
      trigger: 'running',
      type: 'rotation',
      target: 'impeller',
      speed: 'data.rpm'
    }
  ]
}
```

## 5. 交互设计

### 5.1 编辑操作
```typescript
// 编辑器操作接口
interface EditorOperations {
  // 元素操作
  addElement(template: ElementTemplate, position: Point): void;
  deleteElement(elementId: string): void;
  moveElement(elementId: string, delta: Point): void;
  resizeElement(elementId: string, size: Size): void;
  rotateElement(elementId: string, angle: number): void;
  
  // 连接操作
  startConnection(elementId: string, portId: string): void;
  endConnection(elementId: string, portId: string): void;
  deleteConnection(connectionId: string): void;
  
  // 选择操作
  selectElement(elementId: string): void;
  selectMultiple(elementIds: string[]): void;
  clearSelection(): void;
  
  // 编辑操作
  undo(): void;
  redo(): void;
  copy(): void;
  paste(): void;
  
  // 视图操作
  zoomIn(): void;
  zoomOut(): void;
  zoomToFit(): void;
  panTo(position: Point): void;
}
```

### 5.2 智能连线算法
```typescript
// A*寻路算法实现正交连线
class OrthogonalRouter {
  findPath(start: Point, end: Point, obstacles: Rectangle[]): Point[] {
    // 创建网格
    const grid = this.createGrid(start, end, obstacles);
    
    // A*算法寻找最短路径
    const path = this.aStar(grid, start, end);
    
    // 简化路径，只保留转折点
    return this.simplifyPath(path);
  }
  
  private createGrid(start: Point, end: Point, obstacles: Rectangle[]): Grid {
    // 基于障碍物创建可通行网格
    // ...
  }
  
  private aStar(grid: Grid, start: Point, end: Point): Point[] {
    // A*寻路实现
    // ...
  }
  
  private simplifyPath(path: Point[]): Point[] {
    // 路径简化，生成正交线段
    // ...
  }
}
```

## 6. 数据绑定机制

### 6.1 绑定配置
```typescript
// 数据绑定配置界面
interface BindingConfig {
  elementId: string;
  bindings: Array<{
    property: string;      // 元素属性
    source: {
      deviceId: string;    // 设备ID
      dataPoint: string;   // 数据点
    };
    transform?: {
      type: 'linear' | 'threshold' | 'mapping';
      config: any;
    };
    animation?: {
      enabled: boolean;
      duration: number;
      easing: string;
    };
  }>;
}

// 数据转换示例
const colorTransform = {
  type: 'threshold',
  config: {
    thresholds: [
      { value: 0, color: '#888888' },     // 停止-灰色
      { value: 1, color: '#00ff00' },     // 运行-绿色
      { value: 2, color: '#ffff00' },     // 警告-黄色
      { value: 3, color: '#ff0000' }      // 故障-红色
    ]
  }
};
```

### 6.2 实时更新机制
```typescript
class DataBindingEngine {
  private bindings: Map<string, DataBinding[]>;
  private elements: Map<string, GraphicElement>;
  
  // 注册数据绑定
  registerBinding(binding: DataBinding): void {
    const key = `${binding.deviceId}.${binding.dataPoint}`;
    if (!this.bindings.has(key)) {
      this.bindings.set(key, []);
    }
    this.bindings.get(key)!.push(binding);
  }
  
  // 处理数据更新
  updateData(deviceId: string, data: Record<string, any>): void {
    Object.entries(data).forEach(([dataPoint, value]) => {
      const key = `${deviceId}.${dataPoint}`;
      const bindings = this.bindings.get(key);
      
      if (bindings) {
        bindings.forEach(binding => {
          this.applyBinding(binding, value);
        });
      }
    });
  }
  
  // 应用绑定
  private applyBinding(binding: DataBinding, value: any): void {
    const element = this.elements.get(binding.elementId);
    if (!element) return;
    
    // 应用数据转换
    const transformedValue = binding.transform
      ? this.applyTransform(value, binding.transform)
      : value;
    
    // 更新元素属性
    this.updateElementProperty(element, binding.property, transformedValue);
  }
}
```

## 7. 导出功能

### 7.1 导出格式支持
```typescript
class ExportManager {
  // 导出为SVG
  exportSVG(document: GraphicDocument): string {
    const svg = this.convertToSVG(document);
    return svg.outerHTML;
  }
  
  // 导出为PNG
  async exportPNG(document: GraphicDocument, scale: number = 2): Promise<Blob> {
    const canvas = await this.renderToCanvas(document, scale);
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob!), 'image/png');
    });
  }
  
  // 导出为PDF
  async exportPDF(document: GraphicDocument): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: document.canvas.width > document.canvas.height ? 'l' : 'p',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgData = await this.exportPNG(document);
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
    
    return pdf.output('blob');
  }
  
  // 导出为JSON（用于保存和加载）
  exportJSON(document: GraphicDocument): string {
    return JSON.stringify(document, null, 2);
  }
}
```

## 8. 性能优化

### 8.1 渲染优化
- **虚拟化**: 只渲染可视区域内的元素
- **分层渲染**: 静态背景和动态元素分离
- **批量更新**: 合并多个更新操作
- **缓存策略**: 缓存复杂图形的渲染结果

### 8.2 内存优化
- **对象池**: 复用图形对象
- **懒加载**: 按需加载元素模板
- **资源清理**: 及时释放不用的资源

## 9. 集成方案

### 9.1 与现有系统集成
- 作为独立页面集成到导航菜单
- 支持从设备管理页面快速创建图形
- 图形可嵌入到仪表板和报表中
- 支持图形模板复用和共享

### 9.2 API设计
```typescript
// 图形管理API
interface GraphicsAPI {
  // 图形文档管理
  createDocument(doc: Partial<GraphicDocument>): Promise<GraphicDocument>;
  getDocument(id: string): Promise<GraphicDocument>;
  updateDocument(id: string, doc: Partial<GraphicDocument>): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  listDocuments(filter?: any): Promise<GraphicDocument[]>;
  
  // 模板管理
  getTemplates(category?: string): Promise<ElementTemplate[]>;
  createTemplate(template: ElementTemplate): Promise<void>;
  
  // 导出功能
  exportDocument(id: string, format: 'svg' | 'png' | 'pdf'): Promise<Blob>;
}
```

## 10. 开发计划

### Phase 1: 基础功能（2周）
- [ ] 搭建图形编辑器框架
- [ ] 实现基本图形绘制
- [ ] 实现元素拖拽和选择
- [ ] 实现基本的工业元素

### Phase 2: 高级功能（2周）
- [ ] 实现智能连线功能
- [ ] 实现属性面板
- [ ] 实现数据绑定
- [ ] 实现导出功能

### Phase 3: 优化和集成（1周）
- [ ] 性能优化
- [ ] 系统集成
- [ ] 测试和调试