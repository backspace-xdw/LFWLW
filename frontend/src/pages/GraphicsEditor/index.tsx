import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { Layout, Menu, Button, Space, Tooltip, Divider, message } from 'antd';
import {
  SelectOutlined,
  DragOutlined,
  LineOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  ExportOutlined,
  UndoOutlined,
  RedoOutlined,
  DeleteOutlined,
  CopyOutlined,
  ScissorOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import Konva from 'konva';
import { useEditorStore } from './store/editorStore';
import ToolPanel from './components/ToolPanel';
import ElementLibrary from './components/ElementLibrary';
import PropertyPanel from './components/PropertyPanel';
import GridBackground from './components/GridBackground';
import GraphicElement from './components/GraphicElement';
import DataPanel from './components/DataPanel';
import { EditorMode, GraphicElement as GraphicElementType, ElementTemplate, DataBinding } from './types';
import { getTemplate } from './templates';
import { dataSimulator } from './utils/dataSimulator';
import { DataBindingEngine } from './utils/dataBindingEngine';
import styles from './index.module.scss';

const { Sider, Content } = Layout;

const GraphicsEditor: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [selectedTool, setSelectedTool] = useState<EditorMode>('select');
  const [showDataPanel, setShowDataPanel] = useState(false);
  const dataBindingEngineRef = useRef<DataBindingEngine | null>(null);
  
  const {
    elements,
    selectedIds,
    scale,
    addElement,
    updateElement,
    deleteElements,
    clearAll,
    selectElement,
    clearSelection,
    setScale,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorStore();

  // 初始化数据绑定引擎
  useEffect(() => {
    dataBindingEngineRef.current = new DataBindingEngine((elementId, updates) => {
      updateElement(elementId, updates);
    });

    return () => {
      dataBindingEngineRef.current = null;
    };
  }, [updateElement]);

  // 自适应画布大小
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        setStageSize({
          width: container.offsetWidth,
          height: container.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete键删除选中元素
      if (e.key === 'Delete' && selectedIds.length > 0) {
        deleteElements(selectedIds);
      }
      
      // Ctrl+Z 撤销
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Ctrl+Shift+Z 或 Ctrl+Y 重做
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
      
      // Ctrl+A 全选
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        const allIds = elements.map(el => el.id);
        selectElement(allIds, false);
      }
      
      // Esc 清除选择
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements, deleteElements, undo, redo, selectElement, clearSelection]);

  // 处理画布点击
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // 点击空白处清除选择
    if (e.target === e.target.getStage()) {
      clearSelection();
    }
  };

  // 处理元素选择
  const handleElementSelect = (elementId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    if (e.evt.ctrlKey || e.evt.metaKey) {
      // 多选
      selectElement(elementId, true);
    } else {
      // 单选
      selectElement(elementId, false);
    }
  };

  // 处理元素拖拽结束
  const handleElementDragEnd = (elementId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    updateElement(elementId, {
      position: {
        x: node.x(),
        y: node.y(),
      },
    });
  };

  // 处理元素变换
  const handleElementTransform = (elementId: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    updateElement(elementId, {
      position: {
        x: node.x(),
        y: node.y(),
      },
      size: {
        width: node.width() * node.scaleX(),
        height: node.height() * node.scaleY(),
      },
      rotation: node.rotation(),
    });
  };

  // 处理元素库拖放
  const handleElementDrop = (template: ElementTemplate, position: { x: number; y: number }) => {
    if (!stageRef.current) return;

    // 获取相对于画布的坐标
    const stage = stageRef.current;
    const container = stage.container().getBoundingClientRect();
    const pointerPosition = {
      x: (position.x - container.left) / scale,
      y: (position.y - container.top) / scale,
    };

    // 创建新元素
    const newElement: GraphicElementType = {
      id: `element_${Date.now()}`,
      type: template.type,
      category: template.category,
      name: template.name,
      position: {
        x: pointerPosition.x - template.defaultSize.width / 2,
        y: pointerPosition.y - template.defaultSize.height / 2,
      },
      size: template.defaultSize,
      rotation: 0,
      style: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 1,
      },
      ports: template.ports,
      properties: template.properties?.reduce((acc, prop) => {
        acc[prop.name] = prop.defaultValue;
        return acc;
      }, {} as Record<string, any>),
      visible: true,
      locked: false,
    };

    addElement(newElement);
    selectElement(newElement.id, false);
  };

  // 处理画布拖放
  const handleStageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleStageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const templateData = e.dataTransfer.getData('elementTemplate');
      if (templateData) {
        const template = JSON.parse(templateData);
        handleElementDrop(template, { x: e.clientX, y: e.clientY });
      }
    } catch (error) {
      console.error('Failed to parse drop data:', error);
    }
  };

  // 处理缩放
  const handleZoomIn = () => {
    setScale(Math.min(scale * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale / 1.2, 0.1));
  };

  const handleZoomReset = () => {
    setScale(1);
  };

  // 保存图形
  const handleSave = () => {
    const data = {
      elements,
      connections: [], // TODO: 添加连接数据
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('图形已保存');
  };

  // 加载图形
  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          // 验证数据格式
          if (!data.elements || !Array.isArray(data.elements)) {
            throw new Error('Invalid file format');
          }

          // 清空当前画布
          clearAll();
          
          // 加载元素
          data.elements.forEach((element: GraphicElementType) => {
            addElement(element);
          });

          // TODO: 加载连接
          
          message.success('图形已加载');
        } catch (error) {
          message.error('加载失败：文件格式无效');
          console.error('Load error:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // 导出为图片
  const handleExport = () => {
    if (!stageRef.current) return;
    
    const dataURL = stageRef.current.toDataURL({
      pixelRatio: 2,
    });
    
    const link = document.createElement('a');
    link.download = `diagram-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    message.success('图形已导出为PNG');
  };

  // 处理设备数据更新
  const handleDeviceDataUpdate = (deviceId: string, data: any) => {
    if (dataBindingEngineRef.current) {
      dataBindingEngineRef.current.handleDataUpdate(deviceId, data);
    }
  };

  // 更新数据绑定
  const handleDataBindingUpdate = (elementId: string, bindings: DataBinding[]) => {
    if (dataBindingEngineRef.current) {
      // 清除旧的绑定
      dataBindingEngineRef.current.clearBindings();
      
      // 注册新的绑定
      dataBindingEngineRef.current.registerBindings(bindings);
      
      message.success('数据绑定已更新');
    }
  };

  return (
    <Layout className={styles.editor}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <Space split={<Divider type="vertical" />}>
          <Space>
            <Tooltip title="选择工具">
              <Button
                type={selectedTool === 'select' ? 'primary' : 'default'}
                icon={<SelectOutlined />}
                onClick={() => setSelectedTool('select')}
              />
            </Tooltip>
            <Tooltip title="拖动画布">
              <Button
                type={selectedTool === 'pan' ? 'primary' : 'default'}
                icon={<DragOutlined />}
                onClick={() => setSelectedTool('pan')}
              />
            </Tooltip>
            <Tooltip title="连线工具">
              <Button
                type={selectedTool === 'connect' ? 'primary' : 'default'}
                icon={<LineOutlined />}
                onClick={() => setSelectedTool('connect')}
              />
            </Tooltip>
          </Space>

          <Space>
            <Tooltip title="撤销 (Ctrl+Z)">
              <Button
                icon={<UndoOutlined />}
                disabled={!canUndo}
                onClick={undo}
              />
            </Tooltip>
            <Tooltip title="重做 (Ctrl+Y)">
              <Button
                icon={<RedoOutlined />}
                disabled={!canRedo}
                onClick={redo}
              />
            </Tooltip>
          </Space>

          <Space>
            <Tooltip title="删除 (Delete)">
              <Button
                icon={<DeleteOutlined />}
                disabled={selectedIds.length === 0}
                onClick={() => deleteElements(selectedIds)}
              />
            </Tooltip>
            <Tooltip title="复制">
              <Button
                icon={<CopyOutlined />}
                disabled={selectedIds.length === 0}
              />
            </Tooltip>
            <Tooltip title="剪切">
              <Button
                icon={<ScissorOutlined />}
                disabled={selectedIds.length === 0}
              />
            </Tooltip>
          </Space>

          <Space>
            <Tooltip title="放大">
              <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
            </Tooltip>
            <Tooltip title="缩小">
              <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
            </Tooltip>
            <Tooltip title="适应画布">
              <Button icon={<FullscreenOutlined />} onClick={handleZoomReset} />
            </Tooltip>
            <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
          </Space>

          <Space>
            <Tooltip title="保存">
              <Button icon={<SaveOutlined />} onClick={handleSave} />
            </Tooltip>
            <Tooltip title="打开">
              <Button icon={<FolderOpenOutlined />} onClick={handleLoad} />
            </Tooltip>
            <Tooltip title="导出">
              <Button icon={<ExportOutlined />} onClick={handleExport} />
            </Tooltip>
          </Space>

          <Space>
            <Tooltip title="数据面板">
              <Button 
                type={showDataPanel ? 'primary' : 'default'}
                icon={<DatabaseOutlined />} 
                onClick={() => setShowDataPanel(!showDataPanel)}
              />
            </Tooltip>
          </Space>
        </Space>
      </div>

      <Layout className={styles.mainContent}>
        {/* 左侧元素库 */}
        <Sider width={240} className={styles.leftPanel}>
          <ElementLibrary onDragEnd={handleElementDrop} />
        </Sider>

        {/* 中间画布区域 */}
        <Content className={styles.canvasWrapper}>
          <div 
            id="canvas-container" 
            className={styles.canvasContainer}
            onDragOver={handleStageDragOver}
            onDrop={handleStageDrop}
          >
            <Stage
              ref={stageRef}
              width={stageSize.width}
              height={stageSize.height}
              scaleX={scale}
              scaleY={scale}
              onClick={handleStageClick}
              className={styles.stage}
            >
              <Layer>
                <GridBackground
                  width={stageSize.width / scale}
                  height={stageSize.height / scale}
                  gridSize={20}
                />
              </Layer>
              <Layer ref={layerRef}>
                {/* 渲染所有图形元素 */}
                {elements.map((element) => (
                  <GraphicElement
                    key={element.id}
                    element={element}
                    isSelected={selectedIds.includes(element.id)}
                    onSelect={(e) => handleElementSelect(element.id, e)}
                    onDragStart={() => {}}
                    onDragEnd={(e) => handleElementDragEnd(element.id, e)}
                    onTransform={(e) => handleElementTransform(element.id, e)}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </Content>

        {/* 右侧面板 */}
        <Sider width={showDataPanel ? 560 : 280} className={styles.rightPanel}>
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ width: 280, height: '100%' }}>
              <PropertyPanel
                selectedElements={elements.filter(el => selectedIds.includes(el.id))}
                onUpdate={(id, props) => updateElement(id, props)}
                onDataBindingUpdate={handleDataBindingUpdate}
              />
            </div>
            {showDataPanel && (
              <div style={{ width: 280, height: '100%', borderLeft: '1px solid #e8e8e8' }}>
                <DataPanel onDataUpdate={handleDeviceDataUpdate} />
              </div>
            )}
          </div>
        </Sider>
      </Layout>
    </Layout>
  );
};

export default GraphicsEditor;