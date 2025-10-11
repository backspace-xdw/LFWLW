import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Box, Cylinder, Sphere, Line, Html, Billboard, Cone, Torus } from '@react-three/drei'
import * as THREE from 'three'
import { Card, Tag, Progress, Badge, Statistic } from 'antd'
import styles from './demo3d.module.scss'

// 动态数据生成器
const generateRealtimeData = () => {
  const baseTemp = 75 + Math.random() * 15
  const basePressure = 5 + Math.random() * 3
  const baseFlow = 100 + Math.random() * 50

  return {
    pump1: {
      status: 'online',
      data: {
        temperature: baseTemp + Math.sin(Date.now() / 1000) * 5,
        pressure: basePressure + Math.cos(Date.now() / 1000) * 0.5,
        flow: baseFlow + Math.sin(Date.now() / 500) * 10,
        rpm: 1450 + Math.sin(Date.now() / 2000) * 50
      }
    },
    tank1: {
      status: 'online',
      data: {
        temperature: baseTemp - 5 + Math.sin(Date.now() / 1500) * 3,
        pressure: basePressure - 1,
        level: 50 + Math.sin(Date.now() / 3000) * 30
      }
    },
    valve1: {
      status: 'online',
      data: {
        temperature: baseTemp - 10,
        pressure: basePressure,
        open: 50 + Math.sin(Date.now() / 2000) * 50
      }
    },
    reactor1: {
      status: 'online',
      data: {
        temperature: baseTemp + 20 + Math.sin(Date.now() / 1000) * 10,
        pressure: basePressure + 2,
        concentration: 85 + Math.sin(Date.now() / 2500) * 10
      }
    }
  }
}

// 3D数据显示面板
const DataPanel3D: React.FC<{ position: [number, number, number], data: any, title: string }> = ({ position, data, title }) => {
  const [pulse, setPulse] = useState(0)

  useFrame((state) => {
    setPulse(Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5)
  })

  const getColor = (value: number, type: string) => {
    if (type === 'temperature') {
      if (value > 90) return '#ff4d4f'
      if (value > 80) return '#fa8c16'
      return '#52c41a'
    }
    return '#1890ff'
  }

  return (
    <group>
      {/* 标题 */}
      <Billboard position={[position[0], position[1] + 1.8, position[2]]}>
        <Text fontSize={0.25} color="#1890ff" fontWeight="bold">
          {title}
        </Text>
      </Billboard>

      {/* 状态指示器 */}
      <Billboard position={[position[0], position[1] + 1.3, position[2]]}>
        <Sphere args={[0.1, 16, 16]}>
          <meshStandardMaterial
            color={data.status === 'online' ? '#52c41a' : '#d9d9d9'}
            emissive={data.status === 'online' ? '#52c41a' : '#666'}
            emissiveIntensity={pulse}
          />
        </Sphere>
      </Billboard>

      {/* 数据面板 */}
      <Html position={[position[0] + 1.5, position[1] + 0.3, position[2]]} distanceFactor={2}>
        <div className={styles.dataCard}>
          {data.data?.temperature && (
            <div className={styles.dataRow}>
              <span className={styles.label}>温度</span>
              <span className={styles.value} style={{ color: getColor(data.data.temperature, 'temperature') }}>
                {data.data.temperature.toFixed(1)}°C
              </span>
            </div>
          )}
          {data.data?.pressure && (
            <div className={styles.dataRow}>
              <span className={styles.label}>压力</span>
              <span className={styles.value}>{data.data.pressure.toFixed(2)} bar</span>
            </div>
          )}
          {data.data?.flow && (
            <div className={styles.dataRow}>
              <span className={styles.label}>流量</span>
              <span className={styles.value}>{data.data.flow.toFixed(1)} m³/h</span>
            </div>
          )}
          {data.data?.level && (
            <div className={styles.dataRow}>
              <span className={styles.label}>液位</span>
              <Progress percent={data.data.level} size="small" />
            </div>
          )}
          {data.data?.rpm && (
            <div className={styles.dataRow}>
              <span className={styles.label}>转速</span>
              <span className={styles.value}>{data.data.rpm.toFixed(0)} rpm</span>
            </div>
          )}
          {data.data?.open !== undefined && (
            <div className={styles.dataRow}>
              <span className={styles.label}>开度</span>
              <Progress percent={data.data.open} size="small" strokeColor="#1890ff" />
            </div>
          )}
          {data.data?.concentration && (
            <div className={styles.dataRow}>
              <span className={styles.label}>浓度</span>
              <span className={styles.value}>{data.data.concentration.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}

// 泵设备模型
const Pump3D: React.FC<{ position: [number, number, number], data: any }> = ({ position, data }) => {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current && data?.status === 'online') {
      meshRef.current.rotation.y += delta * 2
    }
  })

  const color = data?.data?.temperature > 85 ? '#ff4d4f' : '#52c41a'

  return (
    <group position={position}>
      <Cylinder ref={meshRef} args={[0.4, 0.4, 0.8, 8]}>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </Cylinder>
      <Torus args={[0.5, 0.1, 8, 16]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
      </Torus>
      <Box args={[0.2, 1.2, 0.2]} position={[0.6, 0, 0]}>
        <meshStandardMaterial color="#333" />
      </Box>
    </group>
  )
}

// 储罐模型
const Tank3D: React.FC<{ position: [number, number, number], data: any }> = ({ position, data }) => {
  const level = data?.data?.level || 0

  return (
    <group position={position}>
      {/* 罐体 */}
      <Cylinder args={[0.8, 0.8, 2, 16]}>
        <meshStandardMaterial color="#4096ff" metalness={0.3} roughness={0.5} transparent opacity={0.3} />
      </Cylinder>
      {/* 液位 */}
      <Cylinder
        args={[0.75, 0.75, 2 * (level / 100), 16]}
        position={[0, -1 + (2 * level / 100) / 2, 0]}
      >
        <meshStandardMaterial color="#00bfff" />
      </Cylinder>
      {/* 顶部 */}
      <Cone args={[0.8, 0.4, 16]} position={[0, 1.2, 0]}>
        <meshStandardMaterial color="#4096ff" metalness={0.5} roughness={0.3} />
      </Cone>
    </group>
  )
}

// 阀门模型
const Valve3D: React.FC<{ position: [number, number, number], data: any }> = ({ position, data }) => {
  const handleRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (handleRef.current && data?.data?.open !== undefined) {
      handleRef.current.rotation.z = (data.data.open / 100) * Math.PI / 2
    }
  })

  return (
    <group position={position}>
      <Box args={[0.4, 0.3, 0.4]}>
        <meshStandardMaterial color="#faad14" metalness={0.7} roughness={0.3} />
      </Box>
      <Cylinder args={[0.15, 0.15, 0.6]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#666" />
      </Cylinder>
      <Cylinder ref={handleRef} args={[0.05, 0.05, 0.5]} position={[0, 0.25, 0]}>
        <meshStandardMaterial color="#ff4d4f" />
      </Cylinder>
    </group>
  )
}

// 反应器模型
const Reactor3D: React.FC<{ position: [number, number, number], data: any }> = ({ position, data }) => {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  const color = data?.data?.temperature > 95 ? '#ff4d4f' : '#722ed1'

  return (
    <group position={position}>
      <Sphere args={[0.8, 32, 32]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </Sphere>
      <Cylinder args={[0.15, 0.15, 0.5]} position={[0, 1, 0]}>
        <meshStandardMaterial color="#666" />
      </Cylinder>
      <Cylinder args={[0.15, 0.15, 0.5]} position={[0, -1, 0]}>
        <meshStandardMaterial color="#666" />
      </Cylinder>
      <Torus ref={meshRef} args={[0.9, 0.05, 8, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#faad14" emissive="#faad14" emissiveIntensity={0.3} />
      </Torus>
    </group>
  )
}

// 流动粒子
const FlowParticles: React.FC<{ start: [number, number, number], end: [number, number, number] }> = ({ start, end }) => {
  const particlesRef = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (particlesRef.current) {
      const time = state.clock.elapsedTime
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array

      for (let i = 0; i < 20; i++) {
        const t = ((time * 0.3 + i * 0.05) % 1)
        positions[i * 3] = start[0] + (end[0] - start[0]) * t
        positions[i * 3 + 1] = start[1] + (end[1] - start[1]) * t
        positions[i * 3 + 2] = start[2] + (end[2] - start[2]) * t
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  const positions = new Float32Array(20 * 3)
  for (let i = 0; i < 20; i++) {
    const t = i / 20
    positions[i * 3] = start[0] + (end[0] - start[0]) * t
    positions[i * 3 + 1] = start[1] + (end[1] - start[1]) * t
    positions[i * 3 + 2] = start[2] + (end[2] - start[2]) * t
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={20} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#00bfff" transparent opacity={0.8} />
    </points>
  )
}

const Demo3D: React.FC = () => {
  const [deviceData, setDeviceData] = useState(generateRealtimeData())

  // 模拟实时数据更新
  useEffect(() => {
    const timer = setInterval(() => {
      setDeviceData(generateRealtimeData())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.demo3d}>
      <Card title="3D工业设备实时监控演示" className={styles.card}>
        <div className={styles.canvasContainer}>
          <Canvas
            camera={{ position: [8, 6, 8], fov: 45 }}
            shadows
          >
            {/* 灯光配置 */}
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <pointLight position={[-10, 10, -10]} intensity={0.5} color="#fff5b8" />
            <spotLight position={[0, 10, 0]} intensity={0.3} angle={Math.PI / 4} />

            {/* 控制器 */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={true}
              autoRotateSpeed={0.5}
              maxPolarAngle={Math.PI * 0.45}
              minDistance={5}
              maxDistance={20}
            />

            {/* 地面 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#f0f0f0" />
            </mesh>
            <gridHelper args={[20, 20]} position={[0, -0.99, 0]} />

            {/* 设备模型 */}
            <Pump3D position={[-4, 0, 0]} data={deviceData.pump1} />
            <Tank3D position={[0, 0, 0]} data={deviceData.tank1} />
            <Valve3D position={[-2, 0, 0]} data={deviceData.valve1} />
            <Reactor3D position={[4, 0, 0]} data={deviceData.reactor1} />

            {/* 管道连接 */}
            <Line points={[[-4, 0, 0], [-2, 0, 0]]} color="#4096ff" lineWidth={5} />
            <Line points={[[-2, 0, 0], [0, 0, 0]]} color="#4096ff" lineWidth={5} />
            <Line points={[[0, 0, 0], [4, 0, 0]]} color="#4096ff" lineWidth={5} />

            {/* 流动效果 */}
            <FlowParticles start={[-4, 0, 0]} end={[-2, 0, 0]} />
            <FlowParticles start={[-2, 0, 0]} end={[0, 0, 0]} />
            <FlowParticles start={[0, 0, 0]} end={[4, 0, 0]} />

            {/* 数据显示 */}
            <DataPanel3D position={[-4, 0, 0]} data={deviceData.pump1} title="循环泵 P-101" />
            <DataPanel3D position={[-2, 0, 0]} data={deviceData.valve1} title="控制阀 V-201" />
            <DataPanel3D position={[0, 0, 0]} data={deviceData.tank1} title="储罐 T-301" />
            <DataPanel3D position={[4, 0, 0]} data={deviceData.reactor1} title="反应器 R-401" />

            {/* 场景标题 */}
            <Billboard position={[0, 4, 0]}>
              <Text fontSize={0.5} color="#1890ff" fontWeight="bold">
                化工生产线 - 实时监控系统
              </Text>
            </Billboard>
          </Canvas>
        </div>

        {/* 操作提示 */}
        <div className={styles.controls}>
          <Tag color="blue">自动旋转中</Tag>
          <span>鼠标左键: 旋转 | 右键: 平移 | 滚轮: 缩放</span>
        </div>

        {/* 统计信息 */}
        <div className={styles.stats}>
          <Statistic title="设备总数" value={4} suffix="台" />
          <Statistic title="在线设备" value={4} suffix="台" valueStyle={{ color: '#52c41a' }} />
          <Statistic
            title="平均温度"
            value={deviceData.pump1.data.temperature.toFixed(1)}
            suffix="°C"
            valueStyle={{ color: deviceData.pump1.data.temperature > 85 ? '#ff4d4f' : '#52c41a' }}
          />
          <Statistic title="系统压力" value={deviceData.pump1.data.pressure.toFixed(2)} suffix="bar" />
        </div>
      </Card>
    </div>
  )
}

export default Demo3D