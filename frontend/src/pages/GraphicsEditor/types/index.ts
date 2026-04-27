// 编辑器模式
export type EditorMode = 'select' | 'pan' | 'connect' | 'draw';

// 点坐标
export interface Point {
  x: number;
  y: number;
}

// 尺寸
export interface Size {
  width: number;
  height: number;
}

// 矩形区域
export interface Rectangle extends Point, Size {}

// 元素类型
export type ElementType = 
  | 'pump' 
  | 'valve' 
  | 'tank' 
  | 'pipe' 
  | 'instrument' 
  | 'motor'
  | 'text'
  | 'shape';

// 元素分类
export type ElementCategory = 
  | 'equipment' 
  | 'pipe' 
  | 'valve' 
  | 'instrument' 
  | 'electrical'
  | 'annotation';

// 元素样式
export interface ElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
}

// 连接点
export interface Port {
  id: string;
  position: { x: number; y: number }; // 相对位置 0-1
  direction: 'left' | 'right' | 'top' | 'bottom';
  type?: 'input' | 'output' | 'bidirectional';
}

// 图形元素
export interface GraphicElement {
  id: string;
  templateId?: string; // 具体模板ID，如 'pump_centrifugal', 'pump_gear' 等
  type: ElementType;
  category: ElementCategory;
  name: string;
  position: Point;
  size: Size;
  rotation: number;
  style: ElementStyle;
  ports?: Port[];
  properties?: Record<string, any>;
  locked?: boolean;
  visible?: boolean;
  zIndex?: number;
}

// 连接线
export interface Connection {
  id: string;
  type: 'pipe' | 'wire' | 'signal';
  source: {
    elementId: string;
    portId: string;
  };
  target: {
    elementId: string;
    portId: string;
  };
  points: Point[];
  style: ConnectionStyle;
  flow?: FlowConfig;
}

// 连接线样式
export interface ConnectionStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  arrow?: boolean;
}

// 流动配置
export interface FlowConfig {
  enabled: boolean;
  direction: 'forward' | 'reverse';
  speed: number;
  particleCount?: number;
}

// 数据绑定
export interface DataBinding {
  elementId: string;
  property: string;
  deviceId: string;
  dataPoint: string;
  transform?: DataTransform;
}

// 数据转换
export interface DataTransform {
  type: 'linear' | 'threshold' | 'mapping' | 'expression';
  config: any;
}

// 图形文档
export interface GraphicDocument {
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
  dataBindings?: DataBinding[];
}

// 网格配置
export interface GridConfig {
  enabled: boolean;
  size: number;
  color: string;
  snapToGrid: boolean;
}

// 元素模板
export interface ElementTemplate {
  id: string;
  name: string;
  category: ElementCategory;
  type: ElementType;
  icon: string;
  defaultSize: Size;
  ports?: Port[];
  properties?: PropertyDefinition[];
  graphics: {
    type: 'svg' | 'path' | 'composite';
    data: string | any;
  };
  preview?: string;
}

// 属性定义
export interface PropertyDefinition {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'select';
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
  unit?: string;
  min?: number;
  max?: number;
}

// 历史记录动作
export interface HistoryAction {
  type: 'add' | 'delete' | 'update' | 'move';
  timestamp: number;
  data: any;
}