import React, { useState } from 'react';
import { Form, Select, Button, Space, Empty, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { GraphicElement, DataBinding } from '../../types';
import styles from './DataBindingPanel.module.scss';

const { Option } = Select;

interface DataBindingPanelProps {
  element: GraphicElement;
  onUpdate: (bindings: DataBinding[]) => void;
}

interface BindingItem {
  id: string;
  property: string;
  deviceId: string;
  dataPoint: string;
  transform?: {
    type: 'linear' | 'threshold' | 'mapping';
    config: any;
  };
}

const DataBindingPanel: React.FC<DataBindingPanelProps> = ({ element, onUpdate }) => {
  const [bindings, setBindings] = useState<BindingItem[]>([]);

  // 可绑定的属性列表
  const bindableProperties = [
    { key: 'visible', label: '可见性', type: 'boolean' },
    { key: 'rotation', label: '旋转角度', type: 'number' },
    { key: 'opacity', label: '透明度', type: 'number' },
    { key: 'fill', label: '填充色', type: 'color' },
    { key: 'stroke', label: '边框色', type: 'color' },
  ];

  // 根据元素类型添加特定属性
  if (element.type === 'pump') {
    bindableProperties.push(
      { key: 'status', label: '运行状态', type: 'string' },
      { key: 'speed', label: '转速', type: 'number' }
    );
  } else if (element.type === 'valve') {
    bindableProperties.push(
      { key: 'position', label: '开度', type: 'number' }
    );
  } else if (element.type === 'tank') {
    bindableProperties.push(
      { key: 'level', label: '液位', type: 'number' },
      { key: 'temperature', label: '温度', type: 'number' }
    );
  }

  // 模拟设备列表（实际应从API获取）
  const mockDevices = [
    { id: 'PUMP_001', name: '离心泵1号', type: 'pump' },
    { id: 'PUMP_002', name: '离心泵2号', type: 'pump' },
    { id: 'VALVE_001', name: '球阀1号', type: 'valve' },
    { id: 'TANK_001', name: '储罐1号', type: 'tank' },
  ];

  // 模拟数据点列表（实际应根据设备ID从API获取）
  const mockDataPoints = {
    PUMP_001: [
      { id: 'status', name: '运行状态', type: 'boolean' },
      { id: 'speed', name: '转速', type: 'number', unit: 'rpm' },
      { id: 'flow', name: '流量', type: 'number', unit: 'm³/h' },
      { id: 'pressure', name: '压力', type: 'number', unit: 'bar' },
    ],
    VALVE_001: [
      { id: 'position', name: '开度', type: 'number', unit: '%' },
      { id: 'status', name: '状态', type: 'string' },
    ],
    TANK_001: [
      { id: 'level', name: '液位', type: 'number', unit: '%' },
      { id: 'temperature', name: '温度', type: 'number', unit: '°C' },
      { id: 'pressure', name: '压力', type: 'number', unit: 'bar' },
    ],
  };

  // 添加绑定
  const addBinding = () => {
    const newBinding: BindingItem = {
      id: `binding_${Date.now()}`,
      property: '',
      deviceId: '',
      dataPoint: '',
    };
    setBindings([...bindings, newBinding]);
  };

  // 删除绑定
  const removeBinding = (id: string) => {
    setBindings(bindings.filter(b => b.id !== id));
  };

  // 更新绑定
  const updateBinding = (id: string, field: string, value: any) => {
    setBindings(bindings.map(b => 
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  // 应用绑定
  const applyBindings = () => {
    const validBindings = bindings.filter(b => 
      b.property && b.deviceId && b.dataPoint
    );

    const dataBindings: DataBinding[] = validBindings.map(b => ({
      elementId: element.id,
      property: b.property,
      deviceId: b.deviceId,
      dataPoint: b.dataPoint,
      transform: b.transform,
    }));

    onUpdate(dataBindings);
    message.success('数据绑定已更新');
  };

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addBinding}
          block
        >
          添加数据绑定
        </Button>
      </div>

      {bindings.length === 0 ? (
        <Empty
          description="暂无数据绑定"
          className={styles.empty}
        />
      ) : (
        <div className={styles.bindings}>
          {bindings.map((binding, index) => (
            <div key={binding.id} className={styles.bindingItem}>
              <div className={styles.bindingHeader}>
                <span>绑定 {index + 1}</span>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeBinding(binding.id)}
                  danger
                />
              </div>

              <Form.Item label="属性" className={styles.formItem}>
                <Select
                  value={binding.property}
                  onChange={(value) => updateBinding(binding.id, 'property', value)}
                  placeholder="选择要绑定的属性"
                  size="small"
                >
                  {bindableProperties.map(prop => (
                    <Option key={prop.key} value={prop.key}>
                      {prop.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="设备" className={styles.formItem}>
                <Select
                  value={binding.deviceId}
                  onChange={(value) => {
                    updateBinding(binding.id, 'deviceId', value);
                    updateBinding(binding.id, 'dataPoint', ''); // 清空数据点
                  }}
                  placeholder="选择设备"
                  size="small"
                >
                  {mockDevices.map(device => (
                    <Option key={device.id} value={device.id}>
                      {device.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="数据点" className={styles.formItem}>
                <Select
                  value={binding.dataPoint}
                  onChange={(value) => updateBinding(binding.id, 'dataPoint', value)}
                  placeholder="选择数据点"
                  disabled={!binding.deviceId}
                  size="small"
                >
                  {binding.deviceId && mockDataPoints[binding.deviceId as keyof typeof mockDataPoints]?.map(point => (
                    <Option key={point.id} value={point.id}>
                      {point.name} {point.unit && `(${point.unit})`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="转换" className={styles.formItem}>
                <Select
                  value={binding.transform?.type}
                  onChange={(value) => {
                    if (value) {
                      updateBinding(binding.id, 'transform', { type: value, config: {} });
                    } else {
                      updateBinding(binding.id, 'transform', undefined);
                    }
                  }}
                  placeholder="选择数据转换"
                  size="small"
                  allowClear
                >
                  <Option value="linear">线性映射</Option>
                  <Option value="threshold">阈值映射</Option>
                  <Option value="mapping">值映射</Option>
                </Select>
              </Form.Item>
            </div>
          ))}
        </div>
      )}

      {bindings.length > 0 && (
        <div className={styles.footer}>
          <Button type="primary" onClick={applyBindings} block>
            应用绑定
          </Button>
        </div>
      )}
    </div>
  );
};

export default DataBindingPanel;