import React, { useMemo } from 'react'
import { Tree, Empty, Tag } from 'antd'
import {
  ApartmentOutlined,
  EnvironmentOutlined,
  CheckCircleFilled,
  WarningFilled,
  CloseCircleFilled,
  MinusCircleFilled,
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import type { Instrument } from './index'
import styles from './deviceTree.module.scss'

interface Props {
  instruments: Instrument[]
  selectedIds: string[]
  onCheckChange: (ids: string[]) => void
  onNodeClick: (instrumentId: string) => void
}

// 单设备状态 → 图标 + 颜色
function statusIcon(inst: Instrument) {
  if (inst.deviceStatus === 'offline') {
    return <MinusCircleFilled style={{ color: '#8898b8' }} />
  }
  if (inst.deviceStatus === 'fault') {
    return <CloseCircleFilled style={{ color: '#ffa940' }} />
  }
  if (inst.alarmStatus !== 'none') {
    return <WarningFilled style={{ color: '#ff5e6c' }} />
  }
  return <CheckCircleFilled style={{ color: '#52e0a6' }} />
}

const DeviceTree: React.FC<Props> = ({ instruments, selectedIds, onCheckChange, onNodeClick }) => {
  // 按监测类型分组
  const treeData: DataNode[] = useMemo(() => {
    const groupMap = new Map<string, Instrument[]>()
    instruments.forEach(inst => {
      if (!groupMap.has(inst.monitorType)) groupMap.set(inst.monitorType, [])
      groupMap.get(inst.monitorType)!.push(inst)
    })

    const groups: DataNode[] = []
    Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
      .forEach(([type, list]) => {
        const alarmingCount = list.filter(i => i.alarmStatus !== 'none').length
        groups.push({
          key: `__group__${type}`,
          title: (
            <span className={styles.groupTitle}>
              <ApartmentOutlined className={styles.groupIcon} />
              <span className={styles.groupName}>{type}</span>
              <Tag className={styles.countTag}>{list.length}</Tag>
              {alarmingCount > 0 && (
                <Tag color="error" className={styles.countTag}>报警 {alarmingCount}</Tag>
              )}
            </span>
          ),
          children: list.map(inst => ({
            key: inst.id,
            title: (
              <span
                className={styles.leafTitle}
                onClick={(e) => {
                  e.stopPropagation()
                  onNodeClick(inst.id)
                }}
              >
                <span className={styles.leafIcon}>{statusIcon(inst)}</span>
                <span className={styles.leafId}>{inst.id}</span>
                <span className={styles.leafLoc} title={inst.location}>{inst.location}</span>
              </span>
            ),
          })),
        })
      })

    return [
      {
        key: '__all__',
        title: (
          <span className={styles.rootTitle}>
            <EnvironmentOutlined className={styles.rootIcon} />
            <span>全部设备</span>
            <Tag color="processing" className={styles.countTag}>{instruments.length}</Tag>
          </span>
        ),
        children: groups,
      },
    ]
  }, [instruments, onNodeClick])

  return (
    <div className={styles.treeWrap}>
      <div className={styles.header}>
        <ApartmentOutlined /> 设备树
      </div>

      <div className={styles.content}>
        {instruments.length === 0 ? (
          <Empty description="暂无设备" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Tree
            checkable
            defaultExpandAll
            checkedKeys={selectedIds}
            onCheck={(checked) => {
              const keys = (Array.isArray(checked) ? checked : checked.checked) as React.Key[]
              // 只保留叶子节点 (非 __all__ / __group__)
              const ids = keys
                .map(k => String(k))
                .filter(k => !k.startsWith('__'))
              onCheckChange(ids)
            }}
            blockNode
            showIcon={false}
            treeData={treeData}
            className={styles.tree}
          />
        )}
      </div>

      <div className={styles.footer}>
        {selectedIds.length > 0 ? (
          <span>已勾选 <b className={styles.highlight}>{selectedIds.length}</b> 台</span>
        ) : (
          <span>未勾选 (展示全部)</span>
        )}
      </div>
    </div>
  )
}

export default DeviceTree
