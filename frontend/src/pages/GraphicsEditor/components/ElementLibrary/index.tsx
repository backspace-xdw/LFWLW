import React, { useState } from 'react';
import { Collapse, Input, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { ElementTemplate, ElementCategory } from '../../types';
import { elementTemplates } from '../../templates';
import ElementItem from './ElementItem';
import styles from './index.module.scss';

const { Search } = Input;

interface ElementLibraryProps {
  onDragEnd: (template: ElementTemplate, position: { x: number; y: number }) => void;
}

const ElementLibrary: React.FC<ElementLibraryProps> = ({ onDragEnd }) => {
  const [searchText, setSearchText] = useState('');
  const [activeKeys, setActiveKeys] = useState<string[]>(['equipment', 'valve']);

  // 按类别分组元素
  const groupedElements = elementTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    
    // 搜索过滤
    if (searchText && !template.name.toLowerCase().includes(searchText.toLowerCase())) {
      return acc;
    }
    
    acc[template.category].push(template);
    return acc;
  }, {} as Record<ElementCategory, ElementTemplate[]>);

  // 类别信息
  const categoryInfo: Record<ElementCategory, { name: string; icon: string }> = {
    equipment: { name: '工业设备', icon: '⚙️' },
    valve: { name: '阀门', icon: '🔧' },
    pipe: { name: '管道', icon: '📐' },
    instrument: { name: '仪表', icon: '📊' },
    electrical: { name: '电气元件', icon: '⚡' },
    annotation: { name: '标注', icon: '📝' },
  };

  return (
    <div className={styles.library}>
      <div className={styles.header}>
        <h3>元素库</h3>
        <Search
          placeholder="搜索元素"
          allowClear
          size="small"
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          className={styles.search}
        />
      </div>

      <Collapse
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(keys as string[])}
        className={styles.collapse}
        expandIconPosition="end"
        items={Object.entries(groupedElements)
          .filter(([_, templates]) => templates.length > 0)
          .map(([category, templates]) => {
            const info = categoryInfo[category as ElementCategory];
            
            return {
              key: category,
              label: (
                <span className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>{info.icon}</span>
                  <span>{info.name}</span>
                  <span className={styles.count}>({templates.length})</span>
                </span>
              ),
              children: (
                <div className={styles.elementGrid}>
                  {templates.map((template) => (
                    <ElementItem
                      key={template.id}
                      template={template}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </div>
              ),
            };
          })}
      />

      {Object.keys(groupedElements).length === 0 && (
        <Empty
          description="没有找到匹配的元素"
          className={styles.empty}
        />
      )}
    </div>
  );
};

export default ElementLibrary;