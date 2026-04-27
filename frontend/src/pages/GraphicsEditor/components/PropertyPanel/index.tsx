import React from 'react';
import { Form, Input, InputNumber, Switch, Divider, Empty, Tabs } from 'antd';
import { GraphicElement, DataBinding } from '../../types';
import DataBindingPanel from './DataBindingPanel';
import styles from './index.module.scss';
const { TabPane } = Tabs;

interface PropertyPanelProps {
  selectedElements: GraphicElement[];
  onUpdate: (id: string, updates: Partial<GraphicElement>) => void;
  onDataBindingUpdate?: (elementId: string, bindings: DataBinding[]) => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedElements, onUpdate, onDataBindingUpdate }) => {
  const [form] = Form.useForm();

  // 当选中元素变化时，更新表单
  React.useEffect(() => {
    if (selectedElements.length === 1) {
      const element = selectedElements[0];
      form.setFieldsValue({
        name: element.name,
        x: element.position.x,
        y: element.position.y,
        width: element.size.width,
        height: element.size.height,
        rotation: element.rotation,
        locked: element.locked,
        visible: element.visible,
        ...element.properties,
      });
    }
  }, [selectedElements, form]);

  // 处理属性变化
  const handleValueChange = (changedValues: any) => {
    if (selectedElements.length !== 1) return;

    const element = selectedElements[0];
    const updates: Partial<GraphicElement> = {};

    // 处理基础属性
    if ('name' in changedValues) {
      updates.name = changedValues.name;
    }
    if ('x' in changedValues || 'y' in changedValues) {
      updates.position = {
        x: changedValues.x ?? element.position.x,
        y: changedValues.y ?? element.position.y,
      };
    }
    if ('width' in changedValues || 'height' in changedValues) {
      updates.size = {
        width: changedValues.width ?? element.size.width,
        height: changedValues.height ?? element.size.height,
      };
    }
    if ('rotation' in changedValues) {
      updates.rotation = changedValues.rotation;
    }
    if ('locked' in changedValues) {
      updates.locked = changedValues.locked;
    }
    if ('visible' in changedValues) {
      updates.visible = changedValues.visible;
    }

    // 处理自定义属性
    const customProps = { ...element.properties };
    Object.keys(changedValues).forEach(key => {
      if (!['name', 'x', 'y', 'width', 'height', 'rotation', 'locked', 'visible'].includes(key)) {
        customProps[key] = changedValues[key];
      }
    });
    
    if (Object.keys(customProps).length > 0) {
      updates.properties = customProps;
    }

    onUpdate(element.id, updates);
  };

  // 渲染自定义属性
  const renderCustomProperties = (element: GraphicElement) => {
    const customProps = element.properties || {};
    
    return Object.entries(customProps).map(([key, value]) => {
      // 根据值类型自动推断输入组件
      if (typeof value === 'number') {
        return (
          <Form.Item key={key} label={key} name={key}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        );
      } else if (typeof value === 'boolean') {
        return (
          <Form.Item key={key} label={key} name={key} valuePropName="checked">
            <Switch />
          </Form.Item>
        );
      } else {
        return (
          <Form.Item key={key} label={key} name={key}>
            <Input />
          </Form.Item>
        );
      }
    });
  };

  if (selectedElements.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>属性面板</h3>
        </div>
        <Empty
          description="请选择一个元素"
          className={styles.empty}
        />
      </div>
    );
  }

  if (selectedElements.length > 1) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>属性面板</h3>
          <span className={styles.subtitle}>已选择 {selectedElements.length} 个元素</span>
        </div>
        <div className={styles.multiSelect}>
          <p>批量编辑功能开发中...</p>
        </div>
      </div>
    );
  }

  const element = selectedElements[0];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>属性面板</h3>
        <span className={styles.subtitle}>{element.type}</span>
      </div>

      <Tabs defaultActiveKey="properties" className={styles.tabs}>
        <TabPane tab="属性" key="properties">
          <Form
            form={form}
            layout="horizontal"
            size="small"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            onValuesChange={handleValueChange}
            className={styles.form}
          >
            <div className={styles.section}>
              <h4>基本信息</h4>
              <Form.Item label="名称" name="name">
                <Input />
              </Form.Item>
              <Form.Item label="类型">
                <Input value={element.type} disabled />
              </Form.Item>
            </div>

            <Divider />

            <div className={styles.section}>
              <h4>位置与尺寸</h4>
              <Form.Item label="X 坐标" name="x">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Y 坐标" name="y">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="宽度" name="width">
                <InputNumber min={10} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="高度" name="height">
                <InputNumber min={10} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="旋转角度" name="rotation">
                <InputNumber min={0} max={360} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Divider />

            <div className={styles.section}>
              <h4>显示选项</h4>
              <Form.Item label="锁定" name="locked" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="可见" name="visible" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>

            {Object.keys(element.properties || {}).length > 0 && (
              <>
                <Divider />
                <div className={styles.section}>
                  <h4>设备属性</h4>
                  {renderCustomProperties(element)}
                </div>
              </>
            )}
          </Form>
        </TabPane>

        <TabPane tab="数据绑定" key="binding">
          <DataBindingPanel
            element={element}
            onUpdate={(bindings) => {
              if (onDataBindingUpdate) {
                onDataBindingUpdate(element.id, bindings);
              }
            }}
          />
        </TabPane>

        <TabPane tab="样式" key="style">
          <Form
            layout="horizontal"
            size="small"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            className={styles.form}
          >
            <Form.Item label="填充颜色" name="fill">
              <Input type="color" />
            </Form.Item>
            <Form.Item label="边框颜色" name="stroke">
              <Input type="color" />
            </Form.Item>
            <Form.Item label="边框宽度" name="strokeWidth">
              <InputNumber min={0} max={10} />
            </Form.Item>
            <Form.Item label="透明度" name="opacity">
              <InputNumber min={0} max={1} step={0.1} />
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default PropertyPanel;