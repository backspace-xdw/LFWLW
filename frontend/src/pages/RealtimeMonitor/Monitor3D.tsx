import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Box, Cylinder, Sphere, Line, Html, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { Empty, Tag } from 'antd'
import styles from './monitor3d.module.scss'

interface Monitor3DProps {
  sceneId: string
  deviceData: any
  alarms: any[]
}

// 实时数据显示组件
const DataDisplay: React.FC<{
  position: [number, number, number]
  deviceData: any
  label: string
}> = ({ position, deviceData, label }) => {
  const [pulse, setPulse] = useState(0)

  useFrame((state) => {
    // 创建脉冲动画效果
    setPulse(Math.sin(state.clock.elapsedTime * 2) * 0.5 + 0.5)
  })

  if (!deviceData || deviceData.status === 'offline') {
    return (
      <Billboard position={[position[0], position[1] + 1.2, position[2]]}>
        <Text
          fontSize={0.15}
          color="#999"
          anchorX="center"
          anchorY="middle"
        >
          {label} - 离线
        </Text>
      </Billboard>
    )
  }

  const getStatusColor = () => {
    if (deviceData.data?.temperature > 85) return '#ff4d4f'
    if (deviceData.data?.temperature > 80) return '#fa8c16'
    return '#52c41a'
  }

  return (
    <group>
      {/* 设备名称标签 */}
      <Billboard position={[position[0], position[1] + 1.5, position[2]]}>
        <Text
          fontSize={0.18}
          color="#1890ff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#fff"
        >
          {label}
        </Text>
      </Billboard>

      {/* 实时数据面板 */}
      <Html
        position={[position[0] + 1.2, position[1] + 0.5, position[2]]}
        distanceFactor={2}
        style={{ pointerEvents: 'none' }}
      >
        <div className={styles.dataPanel3d}>
          {deviceData.data?.temperature !== undefined && (
            <div className={styles.dataItem}>
              <span className={styles.label}>温度</span>
              <span
                className={styles.value}
                style={{ color: getStatusColor() }}
              >
                {deviceData.data.temperature.toFixed(1)}°C
              </span>
            </div>
          )}
          {deviceData.data?.pressure !== undefined && (
            <div className={styles.dataItem}>
              <span className={styles.label}>压力</span>
              <span className={styles.value}>
                {deviceData.data.pressure.toFixed(2)} bar
              </span>
            </div>
          )}
          {deviceData.data?.flow !== undefined && (
            <div className={styles.dataItem}>
              <span className={styles.label}>流量</span>
              <span className={styles.value}>
                {deviceData.data.flow.toFixed(1)} m³/h
              </span>
            </div>
          )}
          {deviceData.data?.level !== undefined && (
            <div className={styles.dataItem}>
              <span className={styles.label}>液位</span>
              <span
                className={styles.value}
                style={{
                  color: deviceData.data.level > 90 ? '#fa8c16' :
                         deviceData.data.level < 20 ? '#ff4d4f' : '#52c41a'
                }}
              >
                {deviceData.data.level.toFixed(1)}%
              </span>
            </div>
          )}
          {deviceData.data?.rpm !== undefined && (
            <div className={styles.dataItem}>
              <span className={styles.label}>转速</span>
              <span className={styles.value}>
                {deviceData.data.rpm.toFixed(0)} rpm
              </span>
            </div>
          )}
        </div>
      </Html>

      {/* 状态指示器 - 漂浮在设备上方 */}
      <Billboard position={[position[0], position[1] + 0.8, position[2]]}>
        <Sphere args={[0.08, 16, 16]}>
          <meshStandardMaterial
            color={getStatusColor()}
            emissive={getStatusColor()}
            emissiveIntensity={pulse}
          />
        </Sphere>
      </Billboard>
    </group>
  )
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
    if (meshRef.current && type === 'valve' && deviceData?.status === 'online') {
      // 阀门开关动画
      const openState = deviceData?.data?.open || 0
      meshRef.current.rotation.z = (openState / 100) * Math.PI / 2
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
          </group>
        )
      
      case 'valve':
        return (
          <group position={position}>
            <Box args={[0.4, 0.2, 0.4]}>
              <meshStandardMaterial color={getColor()} />
            </Box>
            <Cylinder ref={meshRef} args={[0.1, 0.1, 0.4, 8]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial color="#666" />
            </Cylinder>
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

  return renderDevice()
}

// 流动粒子效果组件
const FlowParticles: React.FC<{ points: [number, number, number][] }> = ({ points }) => {
  const particlesRef = useRef<THREE.Points>(null)
  const [particlePositions, setParticlePositions] = useState<Float32Array>()

  useEffect(() => {
    if (points.length < 2) return

    // 创建粒子位置数组
    const particleCount = 10
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount
      const index = Math.floor(t * (points.length - 1))
      const nextIndex = Math.min(index + 1, points.length - 1)
      const localT = (t * (points.length - 1)) % 1

      // 线性插值
      positions[i * 3] = points[index][0] + (points[nextIndex][0] - points[index][0]) * localT
      positions[i * 3 + 1] = points[index][1] + (points[nextIndex][1] - points[index][1]) * localT
      positions[i * 3 + 2] = points[index][2] + (points[nextIndex][2] - points[index][2]) * localT
    }

    setParticlePositions(positions)
  }, [points])

  useFrame((state) => {
    if (!particlesRef.current || !particlePositions || points.length < 2) return

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    const particleCount = positions.length / 3

    for (let i = 0; i < particleCount; i++) {
      const t = ((time * 0.2 + i / particleCount) % 1)
      const index = Math.floor(t * (points.length - 1))
      const nextIndex = Math.min(index + 1, points.length - 1)
      const localT = (t * (points.length - 1)) % 1

      positions[i * 3] = points[index][0] + (points[nextIndex][0] - points[index][0]) * localT
      positions[i * 3 + 1] = points[index][1] + (points[nextIndex][1] - points[index][1]) * localT + Math.sin(time * 3 + i) * 0.02
      positions[i * 3 + 2] = points[index][2] + (points[nextIndex][2] - points[index][2]) * localT
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  if (!particlePositions || points.length < 2) return null

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlePositions.length / 3}
          array={particlePositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#00bfff"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
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
        style={{ background: 'linear-gradient(180deg, #e6f4ff 0%, #f0f2f5 100%)' }}
      >
        {/* 灯光 */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* 控制器 */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={3}
          maxDistance={15}
        />

        {/* 网格地板 */}
        <gridHelper args={[10, 10]} />

        {/* 设备模型 */}
        {sceneConfig.devices.map((device, index) => (
          <group key={`device-${index}`}>
            <Device3D
              type={device.type}
              position={device.position}
              deviceData={device.deviceId ? deviceData[device.deviceId] : null}
              label={device.label}
            />
            {/* 实时数据显示 */}
            <DataDisplay
              position={device.position}
              deviceData={device.deviceId ? deviceData[device.deviceId] : null}
              label={device.label}
            />
          </group>
        ))}

        {/* 管道连接 */}
        {sceneConfig.pipes.map((pipe, index) => (
          <Line
            key={`pipe-${index}`}
            points={pipe.points}
            color="#4096ff"
            lineWidth={4}
            opacity={0.8}
          />
        ))}

        {/* 流动效果粒子 (可选) */}
        {sceneConfig.pipes.map((pipe, index) => (
          <FlowParticles key={`flow-${index}`} points={pipe.points} />
        ))}
      </Canvas>

      {/* 场景信息 */}
      <div className={styles.sceneInfo}>
        <Tag color="blue">3D实时监控</Tag>
        <span>设备状态与数据同步显示</span>
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