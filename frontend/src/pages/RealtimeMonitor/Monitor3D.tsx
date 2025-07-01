import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Box, Cylinder, Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Empty, Tag } from 'antd'
import styles from './monitor3d.module.scss'

interface Monitor3DProps {
  sceneId: string
  deviceData: any
  alarms: any[]
}

// 3D设备组件
const Device3D: React.FC<{
  type: string
  position: [number, number, number]
  deviceData?: any
  label?: string
}> = ({ type, position, deviceData, label }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // 旋转动画
  useFrame((state, delta) => {
    if (meshRef.current && type === 'pump' && deviceData?.status === 'online') {
      meshRef.current.rotation.y += delta * 2
    }
  })

  // 根据设备状态获取颜色
  const getColor = () => {
    if (!deviceData) return '#666'
    if (deviceData.status === 'offline') return '#999'
    if (deviceData.data?.temperature > 85) return '#ff4d4f'
    if (deviceData.data?.temperature > 80) return '#fa8c16'
    return '#52c41a'
  }

  const renderDevice = () => {
    switch (type) {
      case 'pump':
        return (
          <group position={position}>
            <Cylinder ref={meshRef} args={[0.3, 0.3, 0.6, 8]}>
              <meshStandardMaterial color={getColor()} />
            </Cylinder>
            <Sphere args={[0.4]} position={[0, 0, 0]}>
              <meshStandardMaterial color={getColor()} opacity={0.8} transparent />
            </Sphere>
            {label && (
              <Text
                position={[0, -0.8, 0]}
                fontSize={0.2}
                color="black"
                anchorX="center"
                anchorY="middle"
              >
                {label}
              </Text>
            )}
          </group>
        )
      
      case 'tank':
        return (
          <group position={position}>
            <Cylinder args={[0.6, 0.6, 1.5, 16]}>
              <meshStandardMaterial color="#4096ff" opacity={0.7} transparent />
            </Cylinder>
            {/* 液位显示 */}
            {deviceData?.data?.level && (
              <Cylinder
                args={[0.58, 0.58, 1.5 * (deviceData.data.level / 100), 16]}
                position={[0, -0.75 + (1.5 * deviceData.data.level / 100) / 2, 0]}
              >
                <meshStandardMaterial color="#1890ff" />
              </Cylinder>
            )}
            {label && (
              <Text
                position={[0, -1.2, 0]}
                fontSize={0.2}
                color="black"
                anchorX="center"
                anchorY="middle"
              >
                {label}
              </Text>
            )}
          </group>
        )
      
      case 'valve':
        return (
          <group position={position}>
            <Box args={[0.4, 0.2, 0.4]}>
              <meshStandardMaterial color={getColor()} />
            </Box>
            <Cylinder args={[0.1, 0.1, 0.4, 8]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial color="#666" />
            </Cylinder>
            {label && (
              <Text
                position={[0, -0.5, 0]}
                fontSize={0.15}
                color="black"
                anchorX="center"
                anchorY="middle"
              >
                {label}
              </Text>
            )}
          </group>
        )
      
      default:
        return (
          <Box args={[0.5, 0.5, 0.5]} position={position}>
            <meshStandardMaterial color={getColor()} />
          </Box>
        )
    }
  }

  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {renderDevice()}
      {hovered && deviceData && (
        <Html position={position}>
          <div className={styles.tooltip}>
            <div>{label}</div>
            {deviceData.data?.temperature && (
              <div>温度: {deviceData.data.temperature.toFixed(1)}°C</div>
            )}
            {deviceData.data?.pressure && (
              <div>压力: {deviceData.data.pressure.toFixed(2)} bar</div>
            )}
            {deviceData.data?.level && (
              <div>液位: {deviceData.data.level.toFixed(1)}%</div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// HTML组件（用于3D场景中的HTML元素）
const Html: React.FC<{
  position: [number, number, number]
  children: React.ReactNode
}> = ({ position, children }) => {
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[0, 0]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <div
        style={{
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>
    </group>
  )
}

const Monitor3D: React.FC<Monitor3DProps> = ({ sceneId, deviceData, alarms }) => {
  // 3D场景配置
  const getSceneConfig = () => {
    if (sceneId === 'scene_003') {
      return {
        devices: [
          { type: 'pump', position: [-3, 0, 0], deviceId: 'PUMP_001', label: '主循环泵' },
          { type: 'valve', position: [-1, 0, 0], deviceId: 'VALVE_002', label: '进料阀' },
          { type: 'tank', position: [1, 0, 0], deviceId: 'TANK_005', label: '储罐-5' },
          { type: 'pump', position: [3, 0, 0], deviceId: 'MOTOR_004', label: '驱动电机' },
        ],
        pipes: [
          { points: [[-3, 0, 0], [-1, 0, 0]] },
          { points: [[-1, 0, 0], [1, 0, 0]] },
          { points: [[1, 0, 0], [3, 0, 0]] },
        ],
      }
    }
    return { devices: [], pipes: [] }
  }

  const sceneConfig = getSceneConfig()

  if (sceneConfig.devices.length === 0) {
    return (
      <div className={styles.empty}>
        <Empty description="暂无3D场景数据" />
      </div>
    )
  }

  return (
    <div className={styles.monitor3d}>
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ background: '#f0f2f5' }}
      >
        {/* 灯光 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* 控制器 */}
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

        {/* 网格地板 */}
        <gridHelper args={[10, 10]} />
        
        {/* 设备 */}
        {sceneConfig.devices.map((device, index) => (
          <Device3D
            key={index}
            type={device.type}
            position={device.position}
            deviceData={device.deviceId ? deviceData[device.deviceId] : null}
            label={device.label}
          />
        ))}

        {/* 管道 */}
        {sceneConfig.pipes.map((pipe, index) => (
          <Line
            key={index}
            points={pipe.points}
            color="#666"
            lineWidth={3}
          />
        ))}
      </Canvas>

      {/* 场景信息 */}
      <div className={styles.sceneInfo}>
        <Tag color="blue">3D设备展示</Tag>
        <span>鼠标悬停查看数据</span>
      </div>

      {/* 控制提示 */}
      <div className={styles.controls}>
        <div>左键拖动: 旋转</div>
        <div>右键拖动: 平移</div>
        <div>滚轮: 缩放</div>
      </div>
    </div>
  )
}

export default Monitor3D