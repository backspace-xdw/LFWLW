import React, { useState, useEffect } from 'react';
import { Card, Switch, Button, Space, Tag, Divider } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { dataSimulator } from '../../utils/dataSimulator';
import styles from './index.module.scss';

interface DataPanelProps {
  onDataUpdate: (deviceId: string, data: any) => void;
}

interface DeviceSimulation {
  deviceId: string;
  deviceType: string;
  name: string;
  running: boolean;
  data: Record<string, any>;
}

const DataPanel: React.FC<DataPanelProps> = ({ onDataUpdate }) => {
  const [simulations, setSimulations] = useState<DeviceSimulation[]>([
    { deviceId: 'PUMP_001', deviceType: 'pump', name: '离心泵1号', running: false, data: {} },
    { deviceId: 'PUMP_002', deviceType: 'pump', name: '离心泵2号', running: false, data: {} },
    { deviceId: 'VALVE_001', deviceType: 'valve', name: '球阀1号', running: false, data: {} },
    { deviceId: 'TANK_001', deviceType: 'tank', name: '储罐1号', running: false, data: {} },
    { deviceId: 'MOTOR_001', deviceType: 'motor', name: '电机1号', running: false, data: {} },
  ]);

  // 启动/停止模拟
  const toggleSimulation = (deviceId: string) => {
    const device = simulations.find(s => s.deviceId === deviceId);
    if (!device) return;

    if (device.running) {
      dataSimulator.stopSimulation(deviceId);
      dataSimulator.unsubscribe(deviceId);
    } else {
      // 订阅数据更新
      dataSimulator.subscribe(deviceId, (update) => {
        // 更新本地状态
        setSimulations(prev => prev.map(s => 
          s.deviceId === deviceId ? { ...s, data: update.data } : s
        ));
        
        // 通知父组件
        onDataUpdate(deviceId, update.data);
      });
      
      // 开始模拟
      dataSimulator.startSimulation(deviceId, device.deviceType, 1000);
    }

    // 更新运行状态
    setSimulations(prev => prev.map(s => 
      s.deviceId === deviceId ? { ...s, running: !s.running } : s
    ));
  };

  // 启动所有
  const startAll = () => {
    simulations.forEach(device => {
      if (!device.running) {
        toggleSimulation(device.deviceId);
      }
    });
  };

  // 停止所有
  const stopAll = () => {
    simulations.forEach(device => {
      if (device.running) {
        toggleSimulation(device.deviceId);
      }
    });
  };

  // 清理
  useEffect(() => {
    return () => {
      dataSimulator.dispose();
    };
  }, []);

  // 格式化数据显示
  const formatValue = (key: string, value: any): string => {
    if (typeof value === 'number') {
      return value.toFixed(1);
    }
    return String(value);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>数据模拟面板</h3>
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={startAll}
          >
            全部启动
          </Button>
          <Button
            size="small"
            icon={<PauseCircleOutlined />}
            onClick={stopAll}
          >
            全部停止
          </Button>
        </Space>
      </div>

      <div className={styles.devices}>
        {simulations.map(device => (
          <Card
            key={device.deviceId}
            size="small"
            title={
              <div className={styles.deviceHeader}>
                <span>{device.name}</span>
                <Switch
                  size="small"
                  checked={device.running}
                  onChange={() => toggleSimulation(device.deviceId)}
                />
              </div>
            }
            className={styles.deviceCard}
          >
            <div className={styles.deviceInfo}>
              <div className={styles.deviceId}>ID: {device.deviceId}</div>
              <div className={styles.deviceType}>类型: {device.deviceType}</div>
            </div>
            
            {device.running && Object.keys(device.data).length > 0 && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div className={styles.dataList}>
                  {Object.entries(device.data).map(([key, value]) => (
                    <div key={key} className={styles.dataItem}>
                      <span className={styles.dataKey}>{key}:</span>
                      {key === 'status' ? (
                        <Tag color={
                          value === 'running' ? 'green' : 
                          value === 'stopped' ? 'default' : 
                          value === 'fault' ? 'red' : 
                          value === 'open' ? 'green' :
                          value === 'closed' ? 'default' :
                          'blue'
                        }>
                          {value}
                        </Tag>
                      ) : (
                        <span className={styles.dataValue}>
                          {formatValue(key, value)}
                          {typeof value === 'number' && getUnit(device.deviceType, key)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

// 获取单位
const getUnit = (deviceType: string, key: string): string => {
  const units: Record<string, Record<string, string>> = {
    pump: {
      flow: ' m³/h',
      pressure: ' bar',
      temperature: ' °C',
      speed: ' rpm',
      current: ' A',
    },
    valve: {
      position: ' %',
    },
    tank: {
      level: ' %',
      temperature: ' °C',
      pressure: ' bar',
    },
    motor: {
      speed: ' rpm',
      current: ' A',
      power: ' kW',
      temperature: ' °C',
    },
  };

  return units[deviceType]?.[key] || '';
};

export default DataPanel;