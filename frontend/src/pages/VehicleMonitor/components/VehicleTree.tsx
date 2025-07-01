import React, { useState, useMemo } from 'react'
import { Tree, Input, Badge, Tag, Space, Button, Tooltip } from 'antd'
import {
  CarOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ClusterOutlined
} from '@ant-design/icons'
import type { TreeProps, DataNode } from 'antd/es/tree'
import { Vehicle, VehicleGroup } from '../index'
import styles from './VehicleTree.module.scss'

interface VehicleTreeProps {
  groups: VehicleGroup[]
  vehicles: Vehicle[]
  selectedVehicles: string[]
  onSelect: (selectedIds: string[]) => void
  onLocate: (vehicleId: string) => void
}

const VehicleTree: React.FC<VehicleTreeProps> = ({
  groups,
  vehicles,
  selectedVehicles,
  onSelect,
  onLocate
}) => {
  const [searchValue, setSearchValue] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['1', '2'])

  // 构建树形数据
  const treeData = useMemo(() => {
    const buildTreeData = (groups: VehicleGroup[]): DataNode[] => {
      return groups.map(group => {
        const groupVehicles = vehicles.filter(v => v.groupId === group.id)
        const children: DataNode[] = []
        
        // 添加子分组
        if (group.children) {
          children.push(...buildTreeData(group.children))
        }
        
        // 添加车辆
        children.push(...groupVehicles.map(vehicle => ({
          key: vehicle.id,
          title: (
            <div className={styles.vehicleNode}>
              <Space>
                <CarOutlined />
                <span>{vehicle.name}</span>
                <Tag color={vehicle.status === 'online' || vehicle.status === 'moving' ? 'green' : 'default'}>
                  {vehicle.status === 'moving' ? '行驶中' : 
                   vehicle.status === 'stopped' ? '停止' :
                   vehicle.status === 'online' ? '在线' : '离线'}
                </Tag>
              </Space>
              <Tooltip title="定位车辆">
                <Button
                  type="text"
                  size="small"
                  icon={<EnvironmentOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    onLocate(vehicle.id)
                  }}
                />
              </Tooltip>
            </div>
          ),
          icon: <CarOutlined />,
          isLeaf: true,
          vehicle
        })))
        
        return {
          key: group.id,
          title: (
            <div className={styles.groupNode}>
              <Space>
                <TeamOutlined />
                <span>{group.name}</span>
                <Badge count={children.filter(c => c.isLeaf).length} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            </div>
          ),
          icon: <ClusterOutlined />,
          children
        }
      })
    }
    
    return buildTreeData(groups)
  }, [groups, vehicles])

  // 搜索过滤
  const filteredTreeData = useMemo(() => {
    if (!searchValue) return treeData
    
    const filterTree = (data: DataNode[]): DataNode[] => {
      return data.reduce((filtered: DataNode[], node) => {
        const nodeTitle = typeof node.title === 'string' ? node.title : ''
        const matches = nodeTitle.toLowerCase().includes(searchValue.toLowerCase())
        
        if (node.children) {
          const filteredChildren = filterTree(node.children)
          if (filteredChildren.length > 0 || matches) {
            filtered.push({
              ...node,
              children: filteredChildren
            })
          }
        } else if (matches || (node as any).vehicle?.plateNumber?.includes(searchValue)) {
          filtered.push(node)
        }
        
        return filtered
      }, [])
    }
    
    return filterTree(treeData)
  }, [treeData, searchValue])

  const handleSelect: TreeProps['onSelect'] = (selectedKeys) => {
    // 只选择车辆节点（叶子节点）
    const vehicleKeys = selectedKeys.filter(key => {
      const findNode = (nodes: DataNode[]): boolean => {
        for (const node of nodes) {
          if (node.key === key && node.isLeaf) return true
          if (node.children) {
            if (findNode(node.children)) return true
          }
        }
        return false
      }
      return findNode(treeData)
    })
    onSelect(vehicleKeys as string[])
  }

  const getVehicleStats = () => {
    const total = vehicles.length
    const online = vehicles.filter(v => v.status === 'online' || v.status === 'moving').length
    const moving = vehicles.filter(v => v.status === 'moving').length
    
    return { total, online, moving }
  }

  const stats = getVehicleStats()

  return (
    <div className={styles.vehicleTree}>
      <div className={styles.header}>
        <h3>车辆列表</h3>
        <div className={styles.stats}>
          <Space>
            <span>总数: {stats.total}</span>
            <span>在线: {stats.online}</span>
            <span>行驶: {stats.moving}</span>
          </Space>
        </div>
      </div>
      
      <div className={styles.search}>
        <Input
          placeholder="搜索车辆名称或车牌号"
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
        />
      </div>
      
      <div className={styles.treeContainer}>
        <Tree
          showIcon
          checkable
          treeData={filteredTreeData}
          expandedKeys={expandedKeys}
          onExpand={setExpandedKeys}
          checkedKeys={selectedVehicles}
          onSelect={handleSelect}
          onCheck={(checkedKeys) => {
            onSelect(checkedKeys as string[])
          }}
        />
      </div>
    </div>
  )
}

export default VehicleTree