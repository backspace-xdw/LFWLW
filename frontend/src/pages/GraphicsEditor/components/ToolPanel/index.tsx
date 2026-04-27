import React from 'react';
import { Button, Tooltip } from 'antd';
import {
  SelectOutlined,
  DragOutlined,
  LineOutlined,
  FontSizeOutlined,
  BorderOutlined,
} from '@ant-design/icons';
import { EditorMode } from '../../types';
import styles from './index.module.scss';

interface ToolPanelProps {
  selectedTool: EditorMode;
  onToolChange: (tool: EditorMode) => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({ selectedTool, onToolChange }) => {
  const tools = [
    { id: 'select', icon: <SelectOutlined />, title: '选择工具' },
    { id: 'pan', icon: <DragOutlined />, title: '拖动画布' },
    { id: 'connect', icon: <LineOutlined />, title: '连线工具' },
    { id: 'text', icon: <FontSizeOutlined />, title: '文本工具' },
    { id: 'shape', icon: <BorderOutlined />, title: '形状工具' },
  ];

  return (
    <div className={styles.toolPanel}>
      {tools.map(tool => (
        <Tooltip key={tool.id} title={tool.title} placement="right">
          <Button
            type={selectedTool === tool.id ? 'primary' : 'default'}
            icon={tool.icon}
            onClick={() => onToolChange(tool.id as EditorMode)}
            className={styles.toolButton}
          />
        </Tooltip>
      ))}
    </div>
  );
};

export default ToolPanel;