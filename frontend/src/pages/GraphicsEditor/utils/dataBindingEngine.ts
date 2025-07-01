import { DataBinding, DataTransform, GraphicElement } from '../types';
import { useEditorStore } from '../store/editorStore';

export class DataBindingEngine {
  private bindings: Map<string, DataBinding[]> = new Map();
  private updateCallback: (elementId: string, updates: Partial<GraphicElement>) => void;

  constructor(updateCallback: (elementId: string, updates: Partial<GraphicElement>) => void) {
    this.updateCallback = updateCallback;
  }

  // 注册数据绑定
  registerBinding(binding: DataBinding) {
    const key = `${binding.deviceId}.${binding.dataPoint}`;
    if (!this.bindings.has(key)) {
      this.bindings.set(key, []);
    }
    this.bindings.get(key)!.push(binding);
  }

  // 注册多个绑定
  registerBindings(bindings: DataBinding[]) {
    bindings.forEach(binding => this.registerBinding(binding));
  }

  // 清除绑定
  clearBindings() {
    this.bindings.clear();
  }

  // 处理设备数据更新
  handleDataUpdate(deviceId: string, data: Record<string, any>) {
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

  // 应用数据绑定
  private applyBinding(binding: DataBinding, value: any) {
    const transformedValue = binding.transform
      ? this.applyTransform(value, binding.transform)
      : value;

    const updates: Partial<GraphicElement> = {};

    // 根据属性类型应用更新
    switch (binding.property) {
      case 'visible':
        updates.visible = Boolean(transformedValue);
        break;

      case 'rotation':
        updates.rotation = Number(transformedValue);
        break;

      case 'opacity':
        if (updates.style) {
          updates.style.opacity = Number(transformedValue);
        } else {
          updates.style = { opacity: Number(transformedValue) };
        }
        break;

      case 'fill':
        if (updates.style) {
          updates.style.fill = String(transformedValue);
        } else {
          updates.style = { fill: String(transformedValue) };
        }
        break;

      case 'stroke':
        if (updates.style) {
          updates.style.stroke = String(transformedValue);
        } else {
          updates.style = { stroke: String(transformedValue) };
        }
        break;

      default:
        // 自定义属性
        if (!updates.properties) {
          updates.properties = {};
        }
        updates.properties[binding.property] = transformedValue;
    }

    // 调用更新回调
    this.updateCallback(binding.elementId, updates);
  }

  // 应用数据转换
  private applyTransform(value: any, transform: DataTransform): any {
    switch (transform.type) {
      case 'linear':
        // 线性映射: y = ax + b
        const { scale = 1, offset = 0 } = transform.config;
        return Number(value) * scale + offset;

      case 'threshold':
        // 阈值映射
        const thresholds = transform.config.thresholds || [];
        for (const threshold of thresholds) {
          if (value >= threshold.min && value <= threshold.max) {
            return threshold.value;
          }
        }
        return transform.config.default || value;

      case 'mapping':
        // 值映射
        const mappings = transform.config.mappings || {};
        return mappings[String(value)] || transform.config.default || value;

      case 'expression':
        // 表达式计算（简单实现）
        try {
          // 注意：实际生产环境应该使用更安全的表达式解析器
          const func = new Function('value', `return ${transform.config.expression}`);
          return func(value);
        } catch (error) {
          console.error('Expression evaluation error:', error);
          return value;
        }

      default:
        return value;
    }
  }

  // 获取设备的所有绑定
  getDeviceBindings(deviceId: string): DataBinding[] {
    const deviceBindings: DataBinding[] = [];
    
    this.bindings.forEach((bindings, key) => {
      if (key.startsWith(`${deviceId}.`)) {
        deviceBindings.push(...bindings);
      }
    });

    return deviceBindings;
  }

  // 获取元素的所有绑定
  getElementBindings(elementId: string): DataBinding[] {
    const elementBindings: DataBinding[] = [];
    
    this.bindings.forEach(bindings => {
      const filtered = bindings.filter(b => b.elementId === elementId);
      elementBindings.push(...filtered);
    });

    return elementBindings;
  }
}

// 创建一些预定义的转换
export const predefinedTransforms = {
  // 状态到颜色的映射
  statusToColor: {
    type: 'mapping' as const,
    config: {
      mappings: {
        'stopped': '#888888',
        'running': '#52c41a',
        'fault': '#ff4d4f',
        'warning': '#faad14',
        'closed': '#888888',
        'open': '#52c41a',
        'moving': '#1890ff',
      },
      default: '#888888',
    },
  },

  // 温度到颜色的映射（热力图）
  temperatureToColor: {
    type: 'threshold' as const,
    config: {
      thresholds: [
        { min: -Infinity, max: 20, value: '#1890ff' }, // 冷 - 蓝色
        { min: 20, max: 40, value: '#52c41a' },        // 常温 - 绿色
        { min: 40, max: 60, value: '#faad14' },        // 温 - 黄色
        { min: 60, max: 80, value: '#fa8c16' },        // 热 - 橙色
        { min: 80, max: Infinity, value: '#ff4d4f' },  // 高温 - 红色
      ],
      default: '#888888',
    },
  },

  // 百分比到旋转角度
  percentToRotation: {
    type: 'linear' as const,
    config: {
      scale: 3.6, // 100% = 360度
      offset: 0,
    },
  },

  // 流量到动画速度
  flowToSpeed: {
    type: 'linear' as const,
    config: {
      scale: 0.01, // 流量越大，动画越快
      offset: 0,
    },
  },

  // 布尔值到可见性
  booleanToVisibility: {
    type: 'mapping' as const,
    config: {
      mappings: {
        'true': true,
        'false': false,
        '1': true,
        '0': false,
      },
      default: false,
    },
  },
};