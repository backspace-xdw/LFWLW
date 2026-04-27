import React, { useState, useEffect } from 'react';
import { Form, Select, Button, Empty, message } from 'antd';
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
  const [devices, setDevices] = useState(mockDevices);
  const [dataPointsMap, setDataPointsMap] = useState<Record<string, any[]>>(mockDataPoints as any);

  // 从API加载真实设备列表
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/devices?pageSize=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        if (json.code === 0 && json.data?.items?.length > 0) {
          setDevices(json.data.items.map((d: any) => ({ id: d.deviceId, name: d.name, type: d.type })));
        }
      })
      .catch(() => {});
  }, []);

  // 当绑定选择了设备时，加载该设备的参数列表
  const loadDeviceSchema = (deviceId: string) => {
    if (dataPointsMap[deviceId]) return;
    const token = localStorage.getItem('token');
    fetch(`/api/v1/data/schema/${deviceId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        if (json.code === 0 && json.data?.parameters) {
          setDataPointsMap(prev => ({
            ...prev,
            [deviceId]: json.data.parameters.map((p: any) => ({
              id: p.name,
              name: p.name,
              type: p.type,
              unit: p.unit,
            })),
          }));
        }
      })
      .catch(() => {});
  };

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

  // 默认设备列表（API失败时的降级数据）
  const mockDevices = [
    { id: 'PUMP_001', name: '离心泵-01', type: 'pump' },
    { id: 'VALVE_002', name: '电动阀门-02', type: 'valve' },
    { id: 'SENSOR_003', name: '温度传感器-03', type: 'sensor' },
    { id: 'MOTOR_004', name: '三相电机-04', type: 'motor' },
    { id: 'TANK_005', name: '储罐-05', type: 'tank' },
  ];

  // 默认数据点列表（API失败时的降级数据）
  const mockDataPoints = {
    PUMP_001: [
      { id: 'temperature', name: '温度', type: 'number', unit: '°C' },
      { id: 'pressure', name: '压力', type: 'number', unit: 'MPa' },
      { id: 'flow', name: '流量', type: 'number', unit: 'm³/h' },
      { id: 'rpm', name: '转速', type: 'number', unit: 'rpm' },
    ],
    VALVE_002: [
      { id: 'temperature', name: '温度', type: 'number', unit: '°C' },
      { id: 'pressure', name: '压力', type: 'number', unit: 'MPa' },
      { id: 'position', name: '开度', type: 'number', unit: '%' },
    ],
    TANK_005: [
      { id: 'temperature', name: '温度', type: 'number', unit: '°C' },
      { id: 'level', name: '液位', type: 'number', unit: '%' },
      { id: 'pressure', name: '压力', type: 'number', unit: 'MPa' },
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
    if (field === 'deviceId') {
      loadDeviceSchema(value);
    }
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
                  {devices.map(device => (
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
                  {binding.deviceId && dataPointsMap[binding.deviceId]?.map(point => (
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