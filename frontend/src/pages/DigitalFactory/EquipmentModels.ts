// 高度真实的工业设备3D模型库
import * as THREE from 'three'

// ============ 高级材质系统 ============

// 创建拉丝金属纹理
function createBrushedMetalMaterial(color: number, roughness = 0.4) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.95,
    roughness,
    envMapIntensity: 1.2
  })
}

// 创建工业橡胶材质
function createRubberMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0,
    roughness: 0.98
  })
}

// 创建透明防护罩材质
function createTransparentGuardMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.05,
    transmission: 0.92,
    transparent: true,
    opacity: 0.12,
    thickness: 0.5,
    ior: 1.5
  })
}

// 创建LED材质
function createLEDMaterial(color: number, intensity = 2.5) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    toneMapped: false
  })
}

// 创建设备告警指示器 - 红色闪烁灯
export function createAlarmIndicator(isActive = false) {
  const indicator = new THREE.Group()

  // 指示灯底座
  const baseGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.06, 16)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.6,
    roughness: 0.4
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = 0.03
  indicator.add(base)

  // 告警灯罩
  const lampGeometry = new THREE.SphereGeometry(0.12, 16, 16)
  const lampMaterial = new THREE.MeshStandardMaterial({
    color: isActive ? 0xff0000 : 0x660000,
    emissive: isActive ? 0xff0000 : 0x330000,
    emissiveIntensity: isActive ? 3.0 : 0.5,
    transparent: true,
    opacity: 0.9,
    toneMapped: false
  })
  const lamp = new THREE.Mesh(lampGeometry, lampMaterial)
  lamp.position.y = 0.15
  indicator.add(lamp)

  // 如果激活,添加点光源
  if (isActive) {
    const pointLight = new THREE.PointLight(0xff0000, 1.5, 2)
    pointLight.position.y = 0.15
    indicator.add(pointLight)

    // 添加闪烁动画数据
    ;(indicator as any).alarmLight = lamp
    ;(indicator as any).alarmPointLight = pointLight
    ;(indicator as any).isAlarmActive = true
  }

  indicator.position.y = 2 // 放在设备顶部

  return indicator
}

// ============ 详细组件创建函数 ============

// 创建工业螺栓 - 带六角头和螺纹细节
function createIndustrialBolt(diameter = 0.02, length = 0.05) {
  const bolt = new THREE.Group()

  // 六角螺栓头
  const hexGeometry = new THREE.CylinderGeometry(diameter * 1.8, diameter * 1.8, diameter * 0.6, 6)
  const headMaterial = createBrushedMetalMaterial(0x6b6b6b, 0.5)
  const head = new THREE.Mesh(hexGeometry, headMaterial)
  head.position.y = length / 2 + diameter * 0.3
  head.castShadow = true
  bolt.add(head)

  // 螺栓杆身
  const bodyGeometry = new THREE.CylinderGeometry(diameter, diameter, length, 12)
  const bodyMaterial = createBrushedMetalMaterial(0x808080, 0.45)
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.castShadow = true
  bolt.add(body)

  return bolt
}

// 创建工业电机 - 带散热片和接线盒
function createIndustrialMotor(diameter = 0.25, length = 0.45) {
  const motor = new THREE.Group()

  // 电机主体外壳
  const bodyGeometry = new THREE.CylinderGeometry(diameter, diameter * 0.95, length, 32)
  const bodyMaterial = createBrushedMetalMaterial(0xa8a8a8, 0.35)
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.rotation.z = Math.PI / 2
  body.castShadow = true
  motor.add(body)

  // 前端盖
  const frontCapGeometry = new THREE.CylinderGeometry(diameter * 1.05, diameter, diameter * 0.15, 32)
  const capMaterial = createBrushedMetalMaterial(0x909090, 0.4)
  const frontCap = new THREE.Mesh(frontCapGeometry, capMaterial)
  frontCap.rotation.z = Math.PI / 2
  frontCap.position.x = length / 2 + diameter * 0.075
  frontCap.castShadow = true
  motor.add(frontCap)

  // 散热翅片 - 12片
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const finGeometry = new THREE.BoxGeometry(length * 0.75, diameter * 0.06, diameter * 0.03)
    const finMaterial = createBrushedMetalMaterial(0x707070, 0.55)
    const fin = new THREE.Mesh(finGeometry, finMaterial)
    fin.rotation.y = Math.PI / 2
    fin.rotation.x = angle
    const radius = diameter * 0.52
    fin.position.x = Math.cos(angle) * radius
    fin.position.z = Math.sin(angle) * radius
    fin.castShadow = true
    motor.add(fin)
  }

  // 输出轴
  const shaftGeometry = new THREE.CylinderGeometry(diameter * 0.25, diameter * 0.25, length * 0.5, 16)
  const shaftMaterial = createBrushedMetalMaterial(0xb5b5b5, 0.15)
  const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial)
  shaft.rotation.z = Math.PI / 2
  shaft.position.x = length * 0.75
  shaft.castShadow = true
  motor.add(shaft)

  // 接线盒
  const junctionBoxGeometry = new THREE.BoxGeometry(diameter * 0.6, diameter * 0.5, diameter * 0.35)
  const junctionMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    metalness: 0.2,
    roughness: 0.7
  })
  const junctionBox = new THREE.Mesh(junctionBoxGeometry, junctionMaterial)
  junctionBox.position.y = diameter * 0.75
  junctionBox.position.x = -length * 0.15
  junctionBox.castShadow = true
  motor.add(junctionBox)

  // 铭牌
  const nameplateGeometry = new THREE.BoxGeometry(diameter * 0.5, diameter * 0.25, 0.005)
  const nameplateMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.8,
    roughness: 0.3
  })
  const nameplate = new THREE.Mesh(nameplateGeometry, nameplateMaterial)
  nameplate.position.y = diameter
  nameplate.rotation.x = Math.PI / 2
  motor.add(nameplate)

  return motor
}

// 创建气动缸 - 带活塞杆和气管接口
function createPneumaticCylinder(diameter = 0.08, stroke = 0.45) {
  const cylinder = new THREE.Group()

  // 缸体
  const bodyGeometry = new THREE.CylinderGeometry(diameter, diameter, stroke, 32)
  const bodyMaterial = createBrushedMetalMaterial(0xb8b8b8, 0.35)
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.castShadow = true
  cylinder.add(body)

  // 活塞杆
  const pistonGeometry = new THREE.CylinderGeometry(diameter * 0.35, diameter * 0.35, stroke * 0.7, 20)
  const pistonMaterial = createBrushedMetalMaterial(0xc0c0c0, 0.12)
  const piston = new THREE.Mesh(pistonGeometry, pistonMaterial)
  piston.position.y = stroke * 0.85
  piston.castShadow = true
  cylinder.add(piston)

  // 前端盖
  const frontCapGeometry = new THREE.CylinderGeometry(diameter * 1.15, diameter * 1.15, diameter * 0.2, 32)
  const capMaterial = createBrushedMetalMaterial(0x808080, 0.45)
  const frontCap = new THREE.Mesh(frontCapGeometry, capMaterial)
  frontCap.position.y = stroke / 2 + diameter * 0.1
  frontCap.castShadow = true
  cylinder.add(frontCap)

  // 后端盖
  const rearCap = new THREE.Mesh(frontCapGeometry, capMaterial)
  rearCap.position.y = -stroke / 2 - diameter * 0.1
  rearCap.castShadow = true
  cylinder.add(rearCap)

  // 气管接口 - 2个
  const fittingGeometry = new THREE.CylinderGeometry(diameter * 0.12, diameter * 0.12, diameter * 0.35, 12)
  const fittingMaterial = createBrushedMetalMaterial(0x707070, 0.5)

  const fitting1 = new THREE.Mesh(fittingGeometry, fittingMaterial)
  fitting1.position.set(diameter * 1.05, stroke * 0.35, 0)
  fitting1.rotation.z = Math.PI / 2
  cylinder.add(fitting1)

  const fitting2 = new THREE.Mesh(fittingGeometry, fittingMaterial)
  fitting2.position.set(diameter * 1.05, -stroke * 0.35, 0)
  fitting2.rotation.z = Math.PI / 2
  cylinder.add(fitting2)

  // 安装螺栓 - 4个
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    const bolt = createIndustrialBolt(0.015, 0.04)
    bolt.position.set(
      Math.cos(angle) * diameter * 0.95,
      stroke / 2 + diameter * 0.15,
      Math.sin(angle) * diameter * 0.95
    )
    bolt.rotation.x = Math.PI / 2
    cylinder.add(bolt)
  }

  return cylinder
}

// 创建工业传感器
function createIndustrialSensor(type: 'proximity' | 'photoelectric' | 'laser' = 'photoelectric') {
  const sensor = new THREE.Group()

  // 传感器外壳
  const bodyGeometry = new THREE.CylinderGeometry(0.028, 0.028, 0.09, 20)
  const bodyMaterial = createBrushedMetalMaterial(0xa0a0a0, 0.35)
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.castShadow = true
  sensor.add(body)

  // 感应头
  const headGeometry = new THREE.CylinderGeometry(0.022, 0.028, 0.018, 20)
  const headMaterial = type === 'laser'
    ? new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.3, roughness: 0.6 })
    : createBrushedMetalMaterial(0x707070, 0.45)
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = 0.054
  head.castShadow = true
  sensor.add(head)

  // 指示灯
  const ledGeometry = new THREE.SphereGeometry(0.006, 12, 12)
  const ledMaterial = createLEDMaterial(0x00ff00, 2.2)
  const led = new THREE.Mesh(ledGeometry, ledMaterial)
  led.position.set(0.018, 0.025, 0)
  sensor.add(led)

  // LED光晕
  const ledLight = new THREE.PointLight(0x00ff00, 0.4, 0.15)
  ledLight.position.copy(led.position)
  sensor.add(ledLight)

  // 电缆连接
  const cableGeometry = new THREE.CylinderGeometry(0.007, 0.007, 0.16, 10)
  const cableMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.8
  })
  const cable = new THREE.Mesh(cableGeometry, cableMaterial)
  cable.position.y = -0.125
  sensor.add(cable)

  // 安装螺纹
  const threadGeometry = new THREE.CylinderGeometry(0.032, 0.032, 0.025, 16)
  const threadMaterial = createBrushedMetalMaterial(0x909090, 0.5)
  const thread = new THREE.Mesh(threadGeometry, threadMaterial)
  thread.position.y = -0.0575
  sensor.add(thread)

  return sensor
}

// ============ 主设备创建函数 ============

// 创建超真实开箱机 KCKX20
export function createDetailedBoxOpener() {
  const machine = new THREE.Group()

  // 基础框架 - 使用工业铝型材
  const frameProfile = 0.08
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    metalness: 0.25,
    roughness: 0.65
  })

  // 四个立柱
  const legPositions: [number, number, number][] = [
    [-1.45, 0.42, -1.65],
    [1.45, 0.42, -1.65],
    [-1.45, 0.42, 1.65],
    [1.45, 0.42, 1.65]
  ]

  legPositions.forEach(([x, y, z]) => {
    const legGeometry = new THREE.BoxGeometry(frameProfile, 0.84, frameProfile)
    const leg = new THREE.Mesh(legGeometry, frameMaterial)
    leg.position.set(x, y, z)
    leg.castShadow = true
    machine.add(leg)

    // 每根立柱上的螺栓 - 8个
    for (let i = 0; i < 4; i++) {
      const bolt = createIndustrialBolt(0.018, 0.045)
      const boltX = x + (i % 2 === 0 ? -frameProfile/2 - 0.02 : frameProfile/2 + 0.02)
      const boltZ = z + (i < 2 ? -frameProfile/2 - 0.02 : frameProfile/2 + 0.02)
      bolt.position.set(boltX, 0.08, boltZ)
      machine.add(bolt)

      const topBolt = createIndustrialBolt(0.018, 0.045)
      topBolt.position.set(boltX, 0.76, boltZ)
      machine.add(topBolt)
    }
  })

  // 横梁连接
  const beamGeometry1 = new THREE.BoxGeometry(3.1, frameProfile, frameProfile)
  const beamGeometry2 = new THREE.BoxGeometry(frameProfile, frameProfile, 3.5)

  const beamPositions: { geometry: THREE.BoxGeometry, position: [number, number, number] }[] = [
    { geometry: beamGeometry1, position: [0, 0.08, -1.65] },
    { geometry: beamGeometry1, position: [0, 0.08, 1.65] },
    { geometry: beamGeometry1, position: [0, 0.76, -1.65] },
    { geometry: beamGeometry1, position: [0, 0.76, 1.65] },
    { geometry: beamGeometry2, position: [-1.45, 0.08, 0] },
    { geometry: beamGeometry2, position: [1.45, 0.08, 0] },
    { geometry: beamGeometry2, position: [-1.45, 0.76, 0] },
    { geometry: beamGeometry2, position: [1.45, 0.76, 0] }
  ]

  beamPositions.forEach(({ geometry, position }) => {
    const beam = new THREE.Mesh(geometry, frameMaterial)
    beam.position.set(...position)
    beam.castShadow = true
    machine.add(beam)
  })

  // 工作平台 - 不锈钢板
  const platformGeometry = new THREE.BoxGeometry(2.9, 0.06, 3.3)
  const platformMaterial = createBrushedMetalMaterial(0xc0c0c0, 0.25)
  const platform = new THREE.Mesh(platformGeometry, platformMaterial)
  platform.position.y = 0.88
  platform.castShadow = true
  platform.receiveShadow = true
  machine.add(platform)

  // 输送辊轴系统 - 14根精密辊轴
  const rollerMaterial = createRubberMaterial()

  for (let i = 0; i < 14; i++) {
    const rollerGeometry = new THREE.CylinderGeometry(0.042, 0.042, 3.2, 24)
    const roller = new THREE.Mesh(rollerGeometry, rollerMaterial)
    roller.rotation.z = Math.PI / 2
    roller.position.set(-1.35 + i * 0.21, 0.94, 0)
    roller.castShadow = true
    machine.add(roller)

    // 辊轴轴承座 - 左右各一个
    const bearingGeometry = new THREE.BoxGeometry(0.11, 0.11, 0.11)
    const bearingMaterial = createBrushedMetalMaterial(0x606060, 0.5)

    const leftBearing = new THREE.Mesh(bearingGeometry, bearingMaterial)
    leftBearing.position.set(-1.35 + i * 0.21, 0.94, -1.6)
    leftBearing.castShadow = true
    machine.add(leftBearing)

    const rightBearing = new THREE.Mesh(bearingGeometry, bearingMaterial)
    rightBearing.position.set(-1.35 + i * 0.21, 0.94, 1.6)
    rightBearing.castShadow = true
    machine.add(rightBearing)

    // 轴承固定螺栓 - 每个轴承4个
    for (let j = 0; j < 4; j++) {
      const angle = (j / 4) * Math.PI * 2
      const bolt = createIndustrialBolt(0.012, 0.035)
      const boltOffset = 0.07
      bolt.position.set(
        -1.35 + i * 0.21 + Math.cos(angle) * boltOffset,
        0.94 + Math.sin(angle) * boltOffset,
        -1.6
      )
      machine.add(bolt)
    }
  }

  // 开箱机构 - 4组气动推板系统
  for (let i = 0; i < 4; i++) {
    const pusherAssembly = new THREE.Group()

    // 气缸
    const cylinder = createPneumaticCylinder(0.055, 0.42)
    cylinder.rotation.x = Math.PI / 2
    cylinder.position.z = -0.32
    pusherAssembly.add(cylinder)

    // 推板
    const pusherGeometry = new THREE.BoxGeometry(0.14, 0.62, 0.048)
    const pusherMaterial = createBrushedMetalMaterial(0xb0b0b0, 0.35)
    const pusher = new THREE.Mesh(pusherGeometry, pusherMaterial)
    pusher.position.z = 0.12
    pusher.castShadow = true
    pusherAssembly.add(pusher)

    // 推板加强筋
    const ribGeometry = new THREE.BoxGeometry(0.14, 0.05, 0.03)
    for (let j = -1; j <= 1; j++) {
      const rib = new THREE.Mesh(ribGeometry, pusherMaterial)
      rib.position.set(0, j * 0.2, 0.09)
      pusherAssembly.add(rib)
    }

    // 安装支架
    const bracketGeometry = new THREE.BoxGeometry(0.18, 0.12, 0.16)
    const bracketMaterial = createBrushedMetalMaterial(0x707070, 0.5)
    const bracket = new THREE.Mesh(bracketGeometry, bracketMaterial)
    bracket.position.z = -0.54
    bracket.castShadow = true
    pusherAssembly.add(bracket)

    pusherAssembly.position.set(-1.15 + i * 0.77, 1.25, 0)
    machine.add(pusherAssembly)
  }

  // 侧面透明防护罩
  const guardMaterial = createTransparentGuardMaterial()
  const leftGuardGeometry = new THREE.BoxGeometry(0.09, 1.05, 3.3)
  const leftGuard = new THREE.Mesh(leftGuardGeometry, guardMaterial)
  leftGuard.position.set(-1.54, 1.35, 0)
  machine.add(leftGuard)

  const rightGuard = new THREE.Mesh(leftGuardGeometry, guardMaterial)
  rightGuard.position.set(1.54, 1.35, 0)
  machine.add(rightGuard)

  // 驱动电机 - ABB电机
  const driveMotor = createIndustrialMotor(0.16, 0.32)
  driveMotor.position.set(1.75, 1.05, 0)
  machine.add(driveMotor)

  // 电机到主辊轴的传动皮带轮
  const pulleyGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 24)
  const pulleyMaterial = createBrushedMetalMaterial(0x505050, 0.4)
  const pulley1 = new THREE.Mesh(pulleyGeometry, pulleyMaterial)
  pulley1.rotation.z = Math.PI / 2
  pulley1.position.set(1.59, 1.05, 0)
  machine.add(pulley1)

  const pulley2 = new THREE.Mesh(pulleyGeometry, pulleyMaterial)
  pulley2.rotation.z = Math.PI / 2
  pulley2.position.set(1.35, 0.94, 0)
  machine.add(pulley2)

  // 控制柜 - Siemens PLC柜
  const cabinetGeometry = new THREE.BoxGeometry(0.52, 0.72, 0.38)
  const cabinetMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    metalness: 0.15,
    roughness: 0.65
  })
  const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial)
  cabinet.position.set(-1.72, 1.24, 1.45)
  cabinet.castShadow = true
  machine.add(cabinet)

  // 柜门把手
  const handleGeometry = new THREE.BoxGeometry(0.08, 0.015, 0.015)
  const handleMaterial = createBrushedMetalMaterial(0xa0a0a0, 0.3)
  const handle = new THREE.Mesh(handleGeometry, handleMaterial)
  handle.position.set(-1.52, 1.35, 1.66)
  machine.add(handle)

  // 触摸屏HMI - Siemens TP700
  const hmiGeometry = new THREE.BoxGeometry(0.34, 0.24, 0.045)
  const hmiMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0x3498db,
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.2
  })
  const hmi = new THREE.Mesh(hmiGeometry, hmiMaterial)
  hmi.position.set(-1.72, 1.42, 1.68)
  machine.add(hmi)

  // HMI边框
  const hmiFrameGeometry = new THREE.BoxGeometry(0.36, 0.26, 0.03)
  const hmiFrameMaterial = createBrushedMetalMaterial(0x707070, 0.4)
  const hmiFrame = new THREE.Mesh(hmiFrameGeometry, hmiFrameMaterial)
  hmiFrame.position.set(-1.72, 1.42, 1.64)
  machine.add(hmiFrame)

  // 状态指示灯阵列 - RGB三色
  const ledData: { pos: [number, number, number], color: number }[] = [
    { pos: [-1.62, 1.64, 1.68], color: 0x00ff00 },  // 绿色 - 运行
    { pos: [-1.72, 1.64, 1.68], color: 0xff0000 },  // 红色 - 故障
    { pos: [-1.82, 1.64, 1.68], color: 0x0099ff }   // 蓝色 - 待机
  ]

  ledData.forEach(({ pos, color }) => {
    const ledGeometry = new THREE.SphereGeometry(0.019, 16, 16)
    const ledMaterial = createLEDMaterial(color, 2.8)
    const led = new THREE.Mesh(ledGeometry, ledMaterial)
    led.position.set(...pos)
    machine.add(led)

    // LED光源
    const ledLight = new THREE.PointLight(color, 0.5, 0.5)
    ledLight.position.set(...pos)
    machine.add(ledLight)
  })

  // 光电传感器阵列 - 6个传感器检测纸箱
  for (let i = 0; i < 6; i++) {
    const sensor = createIndustrialSensor('photoelectric')
    sensor.position.set(-0.95 + i * 0.38, 1.15, -1.68)
    sensor.rotation.x = Math.PI / 2
    machine.add(sensor)
  }

  // 急停按钮 - 红色蘑菇头
  const emergencyButtonGeometry = new THREE.CylinderGeometry(0.058, 0.058, 0.075, 24)
  const emergencyMaterial = createLEDMaterial(0xff0000, 0.8)
  const emergencyButton = new THREE.Mesh(emergencyButtonGeometry, emergencyMaterial)
  emergencyButton.position.set(-1.72, 1.60, 1.28)
  emergencyButton.castShadow = true
  machine.add(emergencyButton)

  // 急停按钮底座
  const emergencyBaseGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 24)
  const emergencyBaseMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.3,
    roughness: 0.7
  })
  const emergencyBase = new THREE.Mesh(emergencyBaseGeometry, emergencyBaseMaterial)
  emergencyBase.position.set(-1.72, 1.54, 1.28)
  machine.add(emergencyBase)

  // 安全警示条纹
  const warningGeometry = new THREE.BoxGeometry(3.15, 0.09, 0.045)
  const warningMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    metalness: 0.15,
    roughness: 0.6
  })
  const warningStripe = new THREE.Mesh(warningGeometry, warningMaterial)
  warningStripe.position.set(0, 1.78, -1.69)
  machine.add(warningStripe)

  // 设备铭牌 - 黄铜材质
  const nameplateGeometry = new THREE.BoxGeometry(0.32, 0.16, 0.008)
  const nameplateMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.25
  })
  const nameplate = new THREE.Mesh(nameplateGeometry, nameplateMaterial)
  nameplate.position.set(0, 1.72, 1.69)
  machine.add(nameplate)

  return machine
}

// ============ 其他工业设备创建函数 ============

// 创建金属检测机 M001/M002
export function createDetailedMetalDetector() {
  const machine = new THREE.Group()

  // 主机架 - 不锈钢材质
  const frameGeometry = new THREE.BoxGeometry(1.25, 1.4, 0.18)
  const frameMaterial = createBrushedMetalMaterial(0xb0b0b0, 0.3)
  const frame = new THREE.Mesh(frameGeometry, frameMaterial)
  frame.position.y = 0.7
  frame.castShadow = true
  machine.add(frame)

  // 检测通道 - 铝合金门框
  const channelGeometry = new THREE.BoxGeometry(0.95, 0.95, 0.12)
  const channelMaterial = createBrushedMetalMaterial(0x9eb4c8, 0.35)
  const channel = new THREE.Mesh(channelGeometry, channelMaterial)
  channel.position.y = 0.7
  channel.castShadow = true
  machine.add(channel)

  // 检测通道内部 - 深色防护罩
  const innerGeometry = new THREE.BoxGeometry(0.85, 0.85, 0.06)
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    metalness: 0.4,
    roughness: 0.6
  })
  const inner = new THREE.Mesh(innerGeometry, innerMaterial)
  inner.position.y = 0.7
  machine.add(inner)

  // 电磁线圈组 - 上下各3组
  const coilGeometry = new THREE.TorusGeometry(0.38, 0.025, 16, 32)
  const coilMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8722d,
    metalness: 0.9,
    roughness: 0.2
  })

  for (let i = 0; i < 3; i++) {
    // 顶部线圈
    const topCoil = new THREE.Mesh(coilGeometry, coilMaterial)
    topCoil.rotation.x = Math.PI / 2
    topCoil.position.set(-0.25 + i * 0.25, 1.15, 0)
    topCoil.castShadow = true
    machine.add(topCoil)

    // 底部线圈
    const bottomCoil = new THREE.Mesh(coilGeometry, coilMaterial)
    bottomCoil.rotation.x = Math.PI / 2
    bottomCoil.position.set(-0.25 + i * 0.25, 0.25, 0)
    bottomCoil.castShadow = true
    machine.add(bottomCoil)

    // 侧面线圈
    const leftCoil = new THREE.Mesh(coilGeometry, coilMaterial)
    leftCoil.rotation.y = Math.PI / 2
    leftCoil.position.set(-0.42, 0.7, -0.25 + i * 0.25)
    leftCoil.castShadow = true
    machine.add(leftCoil)

    const rightCoil = new THREE.Mesh(coilGeometry, coilMaterial)
    rightCoil.rotation.y = Math.PI / 2
    rightCoil.position.set(0.42, 0.7, -0.25 + i * 0.25)
    rightCoil.castShadow = true
    machine.add(rightCoil)
  }

  // 控制面板 - 触摸屏显示
  const panelGeometry = new THREE.BoxGeometry(0.32, 0.22, 0.04)
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0x3498db,
    emissiveIntensity: 0.5,
    metalness: 0.7,
    roughness: 0.3
  })
  const panel = new THREE.Mesh(panelGeometry, panelMaterial)
  panel.position.set(-0.75, 1.28, 0)
  panel.rotation.y = Math.PI / 6
  machine.add(panel)

  // 状态指示灯 - 绿色/红色
  const greenLED = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 16, 16),
    createLEDMaterial(0x00ff00, 2.5)
  )
  greenLED.position.set(-0.58, 1.35, 0.05)
  machine.add(greenLED)

  const greenLight = new THREE.PointLight(0x00ff00, 0.6, 0.4)
  greenLight.position.copy(greenLED.position)
  machine.add(greenLight)

  const redLED = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 16, 16),
    createLEDMaterial(0xff0000, 2.5)
  )
  redLED.position.set(-0.54, 1.35, 0.05)
  machine.add(redLED)

  const redLight = new THREE.PointLight(0xff0000, 0.6, 0.4)
  redLight.position.copy(redLED.position)
  machine.add(redLight)

  // 输送带辊轴 - 进料和出料
  for (let i = 0; i < 6; i++) {
    const rollerGeometry = new THREE.CylinderGeometry(0.032, 0.032, 0.95, 20)
    const roller = new THREE.Mesh(rollerGeometry, createRubberMaterial())
    roller.rotation.z = Math.PI / 2
    roller.position.set(-0.5 + i * 0.2, 0.62, 0)
    roller.castShadow = true
    machine.add(roller)
  }

  // 底座支撑腿 - 4个可调节腿
  const legGeometry = new THREE.CylinderGeometry(0.035, 0.045, 0.58, 16)
  const legMaterial = createBrushedMetalMaterial(0x707070, 0.4)
  const legPositions: [number, number, number][] = [
    [-0.55, 0.29, -0.45],
    [0.55, 0.29, -0.45],
    [-0.55, 0.29, 0.45],
    [0.55, 0.29, 0.45]
  ]

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, legMaterial)
    leg.position.set(...pos)
    leg.castShadow = true
    machine.add(leg)

    // 可调节底脚
    const footGeometry = new THREE.CylinderGeometry(0.055, 0.055, 0.025, 16)
    const foot = new THREE.Mesh(footGeometry, createBrushedMetalMaterial(0x606060, 0.5))
    foot.position.set(pos[0], 0.015, pos[2])
    machine.add(foot)
  })

  // 剔除装置 - 气动推杆
  const rejector = createPneumaticCylinder(0.045, 0.32)
  rejector.rotation.z = -Math.PI / 2
  rejector.position.set(0.78, 0.62, 0)
  machine.add(rejector)

  // 设备铭牌
  const nameplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.12, 0.005),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 })
  )
  nameplate.position.set(0, 1.35, 0.095)
  machine.add(nameplate)

  return machine
}

// 创建X光检测系统 M003
export function createDetailedXRayInspector() {
  const machine = new THREE.Group()

  // 主机柜体 - 铅板内衬防辐射
  const cabinetGeometry = new THREE.BoxGeometry(2.8, 1.65, 1.35)
  const cabinetMaterial = new THREE.MeshStandardMaterial({
    color: 0x3c4e5e,
    metalness: 0.3,
    roughness: 0.6
  })
  const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial)
  cabinet.position.y = 0.825
  cabinet.castShadow = true
  machine.add(cabinet)

  // X射线防护铅帘 - 入口和出口
  const curtainGeometry = new THREE.BoxGeometry(0.12, 0.95, 0.85)
  const curtainMaterial = new THREE.MeshStandardMaterial({
    color: 0x505050,
    metalness: 0.1,
    roughness: 0.9
  })

  const entranceCurtain = new THREE.Mesh(curtainGeometry, curtainMaterial)
  entranceCurtain.position.set(-1.46, 0.75, 0)
  machine.add(entranceCurtain)

  const exitCurtain = new THREE.Mesh(curtainGeometry, curtainMaterial)
  exitCurtain.position.set(1.46, 0.75, 0)
  machine.add(exitCurtain)

  // X射线发生器外壳
  const generatorGeometry = new THREE.BoxGeometry(0.45, 0.38, 0.32)
  const generatorMaterial = createBrushedMetalMaterial(0x808080, 0.25)
  const generator = new THREE.Mesh(generatorGeometry, generatorMaterial)
  generator.position.set(-0.85, 1.35, 0.45)
  generator.castShadow = true
  machine.add(generator)

  // X射线管散热器 - 铜制散热片
  for (let i = 0; i < 8; i++) {
    const finGeometry = new THREE.BoxGeometry(0.45, 0.03, 0.012)
    const finMaterial = new THREE.MeshStandardMaterial({
      color: 0xb87333,
      metalness: 0.9,
      roughness: 0.15
    })
    const fin = new THREE.Mesh(finGeometry, finMaterial)
    fin.position.set(-0.85, 1.35 + (i - 4) * 0.045, 0.62)
    machine.add(fin)
  }

  // 探测器阵列 - CCD传感器
  const detectorGeometry = new THREE.BoxGeometry(0.72, 0.52, 0.18)
  const detectorMaterial = createBrushedMetalMaterial(0x505050, 0.4)
  const detector = new THREE.Mesh(detectorGeometry, detectorMaterial)
  detector.position.set(-0.85, 0.45, -0.48)
  detector.castShadow = true
  machine.add(detector)

  // 高压电缆 - 连接X射线管
  const cableGeometry = new THREE.CylinderGeometry(0.028, 0.028, 0.55, 12)
  const cableMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    metalness: 0.2,
    roughness: 0.7
  })
  const cable = new THREE.Mesh(cableGeometry, cableMaterial)
  cable.rotation.x = Math.PI / 2
  cable.position.set(-0.85, 1.55, 0.22)
  machine.add(cable)

  // 双显示器系统 - 操作界面
  for (let i = 0; i < 2; i++) {
    const monitorGeometry = new THREE.BoxGeometry(0.55, 0.38, 0.048)
    const monitorMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x2980b9,
      emissiveIntensity: 0.7,
      metalness: 0.8,
      roughness: 0.2
    })
    const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial)
    monitor.position.set(0.85 + i * 0.62, 1.42, 0.7)
    monitor.rotation.y = -Math.PI / 8
    machine.add(monitor)

    // 显示器支架
    const standGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.32, 12)
    const standMaterial = createBrushedMetalMaterial(0x606060, 0.4)
    const stand = new THREE.Mesh(standGeometry, standMaterial)
    stand.position.set(0.85 + i * 0.62, 1.10, 0.65)
    machine.add(stand)
  }

  // 输送带系统 - 不锈钢网带
  const beltGeometry = new THREE.BoxGeometry(2.6, 0.02, 0.75)
  const beltMaterial = new THREE.MeshStandardMaterial({
    color: 0xb0b0b0,
    metalness: 0.85,
    roughness: 0.4
  })
  const belt = new THREE.Mesh(beltGeometry, beltMaterial)
  belt.position.set(0, 0.72, 0)
  machine.add(belt)

  // 传送辊轴 - 20根精密辊
  for (let i = 0; i < 20; i++) {
    const rollerGeometry = new THREE.CylinderGeometry(0.028, 0.028, 0.78, 16)
    const roller = new THREE.Mesh(rollerGeometry, createBrushedMetalMaterial(0x808080, 0.3))
    roller.rotation.z = Math.PI / 2
    roller.position.set(-1.3 + i * 0.14, 0.68, 0)
    roller.castShadow = true
    machine.add(roller)
  }

  // 辐射警示灯 - 黄色频闪灯
  const warningLightGeometry = new THREE.CylinderGeometry(0.055, 0.065, 0.12, 16)
  const warningMaterial = createLEDMaterial(0xffcc00, 1.8)
  const warningLight = new THREE.Mesh(warningLightGeometry, warningMaterial)
  warningLight.position.set(0, 1.72, 0)
  machine.add(warningLight)

  const warningGlow = new THREE.PointLight(0xffcc00, 0.8, 1.5)
  warningGlow.position.set(0, 1.72, 0)
  machine.add(warningGlow)

  // 辐射标识 - 黄黑相间
  const radiationGeometry = new THREE.CircleGeometry(0.15, 32)
  const radiationMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    emissive: 0xffcc00,
    emissiveIntensity: 0.4,
    metalness: 0.2,
    roughness: 0.6
  })
  const radiationSign = new THREE.Mesh(radiationGeometry, radiationMaterial)
  radiationSign.position.set(-1.4, 1.28, 0.68)
  radiationSign.rotation.y = Math.PI / 2
  machine.add(radiationSign)

  const radiationSign2 = new THREE.Mesh(radiationGeometry, radiationMaterial)
  radiationSign2.position.set(1.4, 1.28, 0.68)
  radiationSign2.rotation.y = -Math.PI / 2
  machine.add(radiationSign2)

  // 紧急停止按钮 - 红色
  const emergencyButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.08, 24),
    createLEDMaterial(0xff0000, 0.9)
  )
  emergencyButton.position.set(1.25, 1.58, 0.7)
  machine.add(emergencyButton)

  // 控制按钮阵列 - 启动/停止/复位
  const buttonColors = [0x00ff00, 0xff0000, 0xffcc00]
  for (let i = 0; i < 3; i++) {
    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.025, 20),
      createLEDMaterial(buttonColors[i], 1.5)
    )
    button.position.set(0.45 + i * 0.12, 1.58, 0.7)
    machine.add(button)
  }

  // 支撑底座 - 工业级
  const baseGeometry = new THREE.BoxGeometry(2.9, 0.15, 1.45)
  const baseMaterial = createBrushedMetalMaterial(0x505050, 0.5)
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = 0.075
  base.castShadow = true
  machine.add(base)

  // 铭牌
  const nameplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.18, 0.006),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 })
  )
  nameplate.position.set(0, 1.62, 0.68)
  machine.add(nameplate)

  return machine
}

// 创建检重秤 M004
export function createDetailedCheckweigher() {
  const machine = new THREE.Group()

  // ========== 底座基础 ==========
  // 坚固的底座框架（白色）- 增加长度和宽度
  const baseGeometry = new THREE.BoxGeometry(1.8, 0.15, 1.4)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.4
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = 0.075
  base.castShadow = true
  base.receiveShadow = true
  machine.add(base)

  // 底座防滑脚垫（4个角）- 调整宽度位置
  const footPositions: [number, number, number][] = [
    [-0.85, 0.02, -0.68],
    [0.85, 0.02, -0.68],
    [-0.85, 0.02, 0.68],
    [0.85, 0.02, 0.68]
  ]
  footPositions.forEach(pos => {
    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.04, 16),
      new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 0.9 })
    )
    foot.position.set(...pos)
    machine.add(foot)
  })

  // ========== 主框架结构（白色）==========
  // 左右两侧立柱（更加结实的设计）
  const pillarGeometry = new THREE.BoxGeometry(0.08, 1.0, 0.08)
  const pillarMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.4
  })

  const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial)
  leftPillar.position.set(-0.8, 0.65, 0)
  leftPillar.castShadow = true
  machine.add(leftPillar)

  const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial)
  rightPillar.position.set(0.8, 0.65, 0)
  rightPillar.castShadow = true
  machine.add(rightPillar)

  // 前后横梁（白色）- 增加长度，调整宽度位置
  const beamGeometry = new THREE.BoxGeometry(1.76, 0.08, 0.08)
  const frontBeam = new THREE.Mesh(beamGeometry, pillarMaterial)
  frontBeam.position.set(0, 1.1, -0.62)
  frontBeam.castShadow = true
  machine.add(frontBeam)

  const backBeam = new THREE.Mesh(beamGeometry, pillarMaterial)
  backBeam.position.set(0, 1.1, 0.62)
  backBeam.castShadow = true
  machine.add(backBeam)

  // 顶部盖板（白色）- 增加长度和宽度
  const topCover = new THREE.Mesh(
    new THREE.BoxGeometry(1.76, 0.03, 1.32),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.4
    })
  )
  topCover.position.set(0, 1.165, 0)
  topCover.castShadow = true
  machine.add(topCover)

  // ========== 称重传感器系统 ==========
  // 4个高精度称重传感器（悬浮安装）- 调整位置（增加宽度间距）
  const sensorPositions: [number, number, number][] = [
    [-0.58, 0.55, -0.45],
    [0.58, 0.55, -0.45],
    [-0.58, 0.55, 0.45],
    [0.58, 0.55, 0.45]
  ]

  sensorPositions.forEach(pos => {
    // 传感器底座（固定在框架上）- 白色
    const sensorBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.06, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.3,
        roughness: 0.4
      })
    )
    sensorBase.position.set(pos[0], pos[1] - 0.03, pos[2])
    sensorBase.castShadow = true
    machine.add(sensorBase)

    // 称重传感器本体（S型梁式传感器）
    const sensorBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x404040,
        metalness: 0.9,
        roughness: 0.2
      })
    )
    sensorBody.position.set(pos[0], pos[1] + 0.06, pos[2])
    sensorBody.castShadow = true
    machine.add(sensorBody)

    // 传感器顶部安装点（连接称重平台）
    const sensorTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.05, 16),
      createBrushedMetalMaterial(0x808080, 0.25)
    )
    sensorTop.position.set(pos[0], pos[1] + 0.145, pos[2])
    machine.add(sensorTop)

    // 传感器信号线
    const cableGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.15, 8)
    const cableMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8
    })
    const cable = new THREE.Mesh(cableGeometry, cableMaterial)
    cable.position.set(pos[0] + 0.05, pos[1], pos[2])
    cable.rotation.z = Math.PI / 2
    machine.add(cable)
  })

  // ========== 称重平台 ==========
  // 平台底板（白色）- 增加长度和宽度
  const platformBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.04, 1.2),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.4
    })
  )
  platformBase.position.y = 0.7
  platformBase.castShadow = true
  platformBase.receiveShadow = true
  machine.add(platformBase)

  // 称重平台（食品级不锈钢）- 增加长度和宽度
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.06, 1.25),
    new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      metalness: 0.85,
      roughness: 0.15,
      envMapIntensity: 1.2
    })
  )
  platform.position.y = 0.75
  platform.castShadow = true
  platform.receiveShadow = true
  machine.add(platform)

  // 平台防护栏杆（两侧）- 增加长度，调整宽度位置
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0x404040,
    metalness: 0.7,
    roughness: 0.3
  })

  // 左侧防护栏
  const leftRail = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.15, 0.02),
    railMaterial
  )
  leftRail.position.set(0, 0.86, -0.64)
  machine.add(leftRail)

  // 右侧防护栏
  const rightRail = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.15, 0.02),
    railMaterial
  )
  rightRail.position.set(0, 0.86, 0.64)
  machine.add(rightRail)

  // ========== 控制面板系统 ==========
  // 控制柜主体（安装在左侧立柱上）- 白色，调整位置
  const controlBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.45, 0.12),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.4
    })
  )
  controlBox.position.set(-0.9, 0.95, 0)
  controlBox.rotation.y = Math.PI / 8
  controlBox.castShadow = true
  machine.add(controlBox)

  // 控制按钮组（触摸按键）
  const buttonColors = [0x00ff00, 0xffaa00, 0xff0000, 0x0088ff]

  buttonColors.forEach((color, i) => {
    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.015, 16),
      new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        metalness: 0.6,
        roughness: 0.3
      })
    )
    button.position.set(-0.92 + i * 0.06, 0.95, 0.05)
    button.rotation.x = Math.PI / 2
    button.rotation.z = Math.PI / 8
    machine.add(button)
  })

  // ========== 输送滚轮系统（向右运输）==========
  // 精密同步滚轮（16个）- 增加滚轮长度适应更宽的平台
  for (let i = 0; i < 16; i++) {
    // 滚轮轴承座（安装在Z方向两端）- 调整到更宽的位置
    const bearingHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.05, 0.04),
      createBrushedMetalMaterial(0x606060, 0.4)
    )
    bearingHousing.position.set(-0.7 + i * 0.09, 0.72, -0.65)
    machine.add(bearingHousing)

    const bearingHousing2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.05, 0.04),
      createBrushedMetalMaterial(0x606060, 0.4)
    )
    bearingHousing2.position.set(-0.7 + i * 0.09, 0.72, 0.65)
    machine.add(bearingHousing2)

    // 滚轮本体（不锈钢）- 沿Z方向横跨传送带，增加长度
    const roller = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.3, 20),
      new THREE.MeshStandardMaterial({
        color: 0xd0d0d0,
        metalness: 0.8,
        roughness: 0.25
      })
    )
    // 绕X轴旋转90度，使圆柱体从竖直(Y)变为横向(Z)
    roller.rotation.x = Math.PI / 2
    roller.position.set(-0.7 + i * 0.09, 0.75, 0)
    roller.castShadow = true
    machine.add(roller)

    // 滚轮防滑纹理（橡胶包覆）- 增加长度
    const rubberCoating = new THREE.Mesh(
      new THREE.CylinderGeometry(0.037, 0.037, 1.15, 20),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.95,
        metalness: 0
      })
    )
    rubberCoating.rotation.x = Math.PI / 2
    rubberCoating.position.set(-0.7 + i * 0.09, 0.75, 0)
    machine.add(rubberCoating)
  }

  // ========== 自动剔除系统 ==========
  // 剔除装置底座（白色）- 调整到右侧末端
  const rejectorBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.2, 0.25),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.4
    })
  )
  rejectorBase.position.set(0.88, 0.75, -0.5)
  rejectorBase.castShadow = true
  machine.add(rejectorBase)

  // 气动推杆组件
  const rejector = createPneumaticCylinder(0.045, 0.35)
  rejector.rotation.z = -Math.PI / 2
  rejector.rotation.y = Math.PI / 4
  rejector.position.set(0.88, 0.75, -0.48)
  machine.add(rejector)

  // 推板（用于推走不合格产品）
  const pusherPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.15, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0xff6600,
      metalness: 0.3,
      roughness: 0.7
    })
  )
  pusherPlate.position.set(1.05, 0.75, -0.48)
  pusherPlate.castShadow = true
  machine.add(pusherPlate)

  // 不合格品收集槽
  const rejectChute = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.35, 0.3),
    new THREE.MeshStandardMaterial({
      color: 0xff3300,
      metalness: 0.2,
      roughness: 0.6,
      transparent: true,
      opacity: 0.6
    })
  )
  rejectChute.position.set(1.05, 0.55, -0.65)
  rejectChute.rotation.x = Math.PI / 6
  machine.add(rejectChute)

  // ========== 状态指示灯塔 ==========
  // 三色信号灯柱（工业标准）- 白色底座，调整位置
  const signalTowerBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 0.08, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.4
    })
  )
  signalTowerBase.position.set(-0.88, 0.72, 0.38)
  machine.add(signalTowerBase)

  const signalTowerPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.35, 12),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.4
    })
  )
  signalTowerPole.position.set(-0.88, 0.94, 0.38)
  machine.add(signalTowerPole)

  // 三色指示灯（绿-黄-红，从下到上）
  const towerLedColors = [0x00ff00, 0xffcc00, 0xff0000]
  // const towerLedLabels = ['正常', '警告', '错误'] // 暂未使用

  towerLedColors.forEach((color, idx) => {
    // LED灯罩
    const ledHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16),
      new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        emissive: color,
        emissiveIntensity: idx === 0 ? 1.5 : 0.3  // 绿灯亮起
      })
    )
    ledHousing.position.set(-0.88, 0.8 + idx * 0.08, 0.38)
    machine.add(ledHousing)

    // 点光源效果
    const ledLight = new THREE.PointLight(
      color,
      idx === 0 ? 1.2 : 0.2,  // 绿灯最亮
      0.5
    )
    ledLight.position.copy(ledHousing.position)
    machine.add(ledLight)
  })

  // ========== 安全光栅传感器 ==========
  // 发射端 - 调整到更宽的位置
  const sensorEmitter = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.5, 0.06),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.4
    })
  )
  sensorEmitter.position.set(-0.78, 0.9, -0.68)
  machine.add(sensorEmitter)

  // 接收端
  const sensorReceiver = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.5, 0.06),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.4
    })
  )
  sensorReceiver.position.set(-0.78, 0.9, 0.68)
  machine.add(sensorReceiver)

  // 安全光束可视化（多条红外线）- 增加光束长度
  for (let i = 0; i < 5; i++) {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.002, 0.002, 1.36, 8),
      new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3
      })
    )
    beam.position.set(-0.78, 0.7 + i * 0.1, 0)
    beam.rotation.x = Math.PI / 2
    machine.add(beam)
  }

  // ========== 称重精度标识和铭牌 ==========
  // 精度等级标识牌 - 调整到右侧末端
  const accuracyPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.12, 0.008),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.7
    })
  )
  accuracyPlate.position.set(0.82, 0.5, 0.42)
  accuracyPlate.rotation.y = -Math.PI / 2
  machine.add(accuracyPlate)

  // 品牌铭牌（金色）
  const nameplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.14, 0.008),
    new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xd4af37,
      emissiveIntensity: 0.2
    })
  )
  nameplate.position.set(0.82, 0.95, 0.42)
  nameplate.rotation.y = -Math.PI / 2
  machine.add(nameplate)

  // 技术参数标签
  const specLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0xffffff,
      emissiveIntensity: 0.5
    })
  )
  specLabel.position.set(0.821, 0.75, 0)
  specLabel.rotation.y = -Math.PI / 2
  machine.add(specLabel)

  // ========== 电气接线盒 ==========
  const electricalBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.2, 0.1),
    new THREE.MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.5,
      roughness: 0.6
    })
  )
  electricalBox.position.set(0.8, 0.25, -0.35)
  electricalBox.castShadow = true
  machine.add(electricalBox)

  // 接线端子
  for (let i = 0; i < 3; i++) {
    const terminal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8),
      new THREE.MeshStandardMaterial({
        color: i === 0 ? 0xffaa00 : i === 1 ? 0x0088ff : 0x00ff00,
        metalness: 0.8,
        roughness: 0.3
      })
    )
    terminal.position.set(0.8, 0.32, -0.38 + i * 0.04)
    terminal.rotation.x = Math.PI / 2
    machine.add(terminal)
  }

  // ========== 急停按钮 ==========
  const emergencyStopBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.04, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      metalness: 0.6,
      roughness: 0.4
    })
  )
  emergencyStopBase.position.set(-0.95, 0.75, 0.32)
  emergencyStopBase.rotation.x = Math.PI / 2
  machine.add(emergencyStopBase)

  const emergencyStopButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.025, 16),
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.4,
      roughness: 0.5,
      emissive: 0xff0000,
      emissiveIntensity: 0.3
    })
  )
  emergencyStopButton.position.set(-0.95, 0.75, 0.34)
  emergencyStopButton.rotation.x = Math.PI / 2
  machine.add(emergencyStopButton)

  return machine
}

// 创建切片机
export function createDetailedSlicer() {
  const group = new THREE.Group()
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.3, 1.1),
    createBrushedMetalMaterial(0x6a9bd3, 0.4)
  )
  box.position.y = 0.65
  box.castShadow = true
  group.add(box)
  return group
}

export function createDetailedPacker() {
  const group = new THREE.Group()
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 1.6, 1.3),
    createBrushedMetalMaterial(0x60c880, 0.45)
  )
  box.position.y = 0.8
  box.castShadow = true
  group.add(box)
  return group
}

export function createDetailedPalletizer() {
  const group = new THREE.Group()
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 2.6, 1.6),
    createBrushedMetalMaterial(0xd95c4c, 0.4)
  )
  box.position.y = 1.3
  box.castShadow = true
  group.add(box)
  return group
}

export function createDetailedLaminator() {
  const group = new THREE.Group()
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 1.1, 1.4),
    createBrushedMetalMaterial(0xe3a82c, 0.42)
  )
  box.position.y = 0.55
  box.castShadow = true
  group.add(box)
  return group
}

// 创建真实的LUTRUN滚筒输送线 - 根据参考图片重新实现
export function createRealisticRollerConveyor(
  length = 2.0,
  width = 0.6,
  options?: {
    shortenLeftFrameEnd?: number    // 从终点缩短左侧框架的长度(米),负值表示延长
    shortenRightFrameEnd?: number   // 从终点缩短右侧框架的长度(米),负值表示延长
    shortenLeftBeltEnd?: number     // 只缩短左侧履带的长度(米),不影响框架
    shortenRightBeltEnd?: number    // 只缩短右侧履带的长度(米),不影响框架
    diagonalLeftEnd?: boolean       // 左端口改为45度斜角，用于连接斜向传送带
  }
) {
  const conveyor = new THREE.Group()

  // 参考图片特征：
  // 1. 米黄色/金色不锈钢侧边框架
  // 2. 黑色密集滚筒（高密度排列）
  // 3. 圆形支撑腿（可调节高度）
  // 4. LUTRUN蓝色标识

  // === 简化版本 - 高性能 ===

  // 侧边框架 - 金黄色金属框架（简化）
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9b583,  // 金黄色边框
    metalness: 0.7,
    roughness: 0.3
  })

  const frameHeight = 0.12  // 减少边框高度
  const frameWidth = 0.03

  // 传送带抬高高度（通过支撑腿实现）- 与送料机高度对齐
  const elevationHeight = 0.35

  // 计算左侧框架的实际长度和位置偏移
  const shortenLeftEnd = options?.shortenLeftFrameEnd || 0
  const leftFrameLength = length - shortenLeftEnd  // 负值会延长框架
  const leftFrameZOffset = -shortenLeftEnd / 2  // 向起点方向偏移(负值向终点偏移)

  // 左侧框架（单个几何体）
  const leftFrameGeo = new THREE.BoxGeometry(frameWidth, frameHeight, leftFrameLength)
  const leftFrame = new THREE.Mesh(leftFrameGeo, frameMaterial)
  leftFrame.position.set(-width / 2, elevationHeight + frameHeight / 2, leftFrameZOffset)
  conveyor.add(leftFrame)

  // 计算右侧框架的实际长度和位置偏移
  const shortenRightEnd = options?.shortenRightFrameEnd || 0
  const rightFrameLength = length - shortenRightEnd  // 负值会延长框架
  const rightFrameZOffset = -shortenRightEnd / 2  // 向起点方向偏移(负值向终点偏移)

  // 右侧框架（单个几何体）
  const rightFrameGeo = new THREE.BoxGeometry(frameWidth, frameHeight, rightFrameLength)
  const rightFrame = new THREE.Mesh(rightFrameGeo, frameMaterial)
  rightFrame.position.set(width / 2, elevationHeight + frameHeight / 2, rightFrameZOffset)
  conveyor.add(rightFrame)

  // 白色橡胶滚筒 - 密集排列（减少数量）
  const rollerMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,  // 改为浅灰色滚筒
    metalness: 0,
    roughness: 0.95
  })

  const rollerDiameter = 0.05
  const rollerSpacing = 0.15  // 增加间距以减少滚筒数量
  const rollerCount = Math.floor(length / rollerSpacing)

  // 使用合并几何体优化性能
  for (let i = 0; i < rollerCount; i++) {
    const z = -length / 2 + rollerSpacing / 2 + i * rollerSpacing

    const rollerGeo = new THREE.CylinderGeometry(
      rollerDiameter / 2,
      rollerDiameter / 2,
      width - frameWidth * 2,
      12  // 减少段数提高性能
    )
    const roller = new THREE.Mesh(rollerGeo, rollerMaterial)
    roller.rotation.z = Math.PI / 2
    roller.position.set(0, elevationHeight + frameHeight / 2, z)
    conveyor.add(roller)
  }

  // 镂空支撑腿 - 根据长度动态计算数量（开放框架结构，允许其他传送带从下方穿过）
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0xa0a0a0,
    metalness: 0.6,
    roughness: 0.4
  })

  const legHeight = elevationHeight  // 支撑腿高度等于抬高高度
  const legThickness = 0.015  // 支柱厚度（细支柱）
  const legFrameSize = 0.1  // 框架尺寸（支柱之间的间距）

  // 计算需要的腿数量:每0.8米一对腿
  const legSpacing = 0.8
  const numLegPairs = Math.max(2, Math.ceil(length / legSpacing))

  const legPositions: [number, number, number][] = []

  // 生成左右两侧的腿位置
  for (let i = 0; i < numLegPairs; i++) {
    const zPos = -length / 2 + 0.15 + (i * (length - 0.3) / (numLegPairs - 1))
    // 腿的Y坐标：从地面(0)到传送带底部(elevationHeight)
    legPositions.push([-width / 2 + 0.08, legHeight / 2, zPos])
    legPositions.push([width / 2 - 0.08, legHeight / 2, zPos])
  }

  legPositions.forEach(pos => {
    // 创建镂空框架结构 - 4根细长的垂直支柱组成矩形框架
    const verticalPostGeo = new THREE.BoxGeometry(legThickness, legHeight, legThickness)

    // 前左支柱
    const post1 = new THREE.Mesh(verticalPostGeo, legMaterial)
    post1.position.set(pos[0] - legFrameSize/2, legHeight / 2, pos[2] - legFrameSize/2)
    conveyor.add(post1)

    // 前右支柱
    const post2 = new THREE.Mesh(verticalPostGeo, legMaterial)
    post2.position.set(pos[0] + legFrameSize/2, legHeight / 2, pos[2] - legFrameSize/2)
    conveyor.add(post2)

    // 后左支柱
    const post3 = new THREE.Mesh(verticalPostGeo, legMaterial)
    post3.position.set(pos[0] - legFrameSize/2, legHeight / 2, pos[2] + legFrameSize/2)
    conveyor.add(post3)

    // 后右支柱
    const post4 = new THREE.Mesh(verticalPostGeo, legMaterial)
    post4.position.set(pos[0] + legFrameSize/2, legHeight / 2, pos[2] + legFrameSize/2)
    conveyor.add(post4)

    // 顶部横向连接杆（X方向，连接前两根和后两根支柱）
    const topCrossBarGeoX = new THREE.BoxGeometry(legFrameSize + legThickness, legThickness, legThickness)
    const topCrossBar1 = new THREE.Mesh(topCrossBarGeoX, legMaterial)
    topCrossBar1.position.set(pos[0], legHeight - legThickness/2, pos[2] - legFrameSize/2)
    conveyor.add(topCrossBar1)

    const topCrossBar2 = new THREE.Mesh(topCrossBarGeoX, legMaterial)
    topCrossBar2.position.set(pos[0], legHeight - legThickness/2, pos[2] + legFrameSize/2)
    conveyor.add(topCrossBar2)

    // 顶部横向连接杆（Z方向，连接左右两侧）
    const topCrossBarGeoZ = new THREE.BoxGeometry(legThickness, legThickness, legFrameSize + legThickness)
    const topCrossBar3 = new THREE.Mesh(topCrossBarGeoZ, legMaterial)
    topCrossBar3.position.set(pos[0] - legFrameSize/2, legHeight - legThickness/2, pos[2])
    conveyor.add(topCrossBar3)

    const topCrossBar4 = new THREE.Mesh(topCrossBarGeoZ, legMaterial)
    topCrossBar4.position.set(pos[0] + legFrameSize/2, legHeight - legThickness/2, pos[2])
    conveyor.add(topCrossBar4)

    // 中部横向支撑杆（可选，增加结构强度）
    const midHeight = legHeight / 2
    const midCrossBar1 = new THREE.Mesh(topCrossBarGeoX, legMaterial)
    midCrossBar1.position.set(pos[0], midHeight, pos[2] - legFrameSize/2)
    conveyor.add(midCrossBar1)

    const midCrossBar2 = new THREE.Mesh(topCrossBarGeoX, legMaterial)
    midCrossBar2.position.set(pos[0], midHeight, pos[2] + legFrameSize/2)
    conveyor.add(midCrossBar2)

    // 底部调节脚（4个小脚垫，分别在4个支柱下方）
    const footGeo = new THREE.BoxGeometry(legThickness * 1.8, 0.02, legThickness * 1.8)

    const foot1 = new THREE.Mesh(footGeo, legMaterial)
    foot1.position.set(pos[0] - legFrameSize/2, 0.01, pos[2] - legFrameSize/2)
    conveyor.add(foot1)

    const foot2 = new THREE.Mesh(footGeo, legMaterial)
    foot2.position.set(pos[0] + legFrameSize/2, 0.01, pos[2] - legFrameSize/2)
    conveyor.add(foot2)

    const foot3 = new THREE.Mesh(footGeo, legMaterial)
    foot3.position.set(pos[0] - legFrameSize/2, 0.01, pos[2] + legFrameSize/2)
    conveyor.add(foot3)

    const foot4 = new THREE.Mesh(footGeo, legMaterial)
    foot4.position.set(pos[0] + legFrameSize/2, 0.01, pos[2] + legFrameSize/2)
    conveyor.add(foot4)
  })

  // 履带皮带 - 深灰色橡胶材质
  const beltMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,  // 改为深灰色履带
    metalness: 0,
    roughness: 0.9
  })

  // 计算履带的实际长度和位置偏移
  const shortenLeftBelt = options?.shortenLeftBeltEnd || 0
  const shortenRightBelt = options?.shortenRightBeltEnd || 0
  const beltLength = length - shortenLeftBelt - shortenRightBelt
  const beltZOffset = (shortenRightBelt - shortenLeftBelt) / 2

  // 顶部履带表面 - 连续平面
  const topBeltGeo = new THREE.BoxGeometry(width - frameWidth * 4, 0.012, beltLength)
  const topBelt = new THREE.Mesh(topBeltGeo, beltMaterial)
  topBelt.position.set(0, elevationHeight + frameHeight + rollerDiameter / 2 + 0.006, beltZOffset)
  topBelt.castShadow = true
  conveyor.add(topBelt)

  // 侧面履带 - 左侧
  const leftSideBeltGeo = new THREE.BoxGeometry(0.012, rollerDiameter * 0.8, beltLength)
  const leftSideBelt = new THREE.Mesh(leftSideBeltGeo, beltMaterial)
  leftSideBelt.position.set(-width / 2 + frameWidth * 2 + 0.006, elevationHeight + frameHeight / 2, beltZOffset)
  conveyor.add(leftSideBelt)

  // 侧面履带 - 右侧
  const rightSideBeltGeo = new THREE.BoxGeometry(0.012, rollerDiameter * 0.8, beltLength)
  const rightSideBelt = new THREE.Mesh(rightSideBeltGeo, beltMaterial)
  rightSideBelt.position.set(width / 2 - frameWidth * 2 - 0.006, elevationHeight + frameHeight / 2, beltZOffset)
  conveyor.add(rightSideBelt)

  // 前端履带弧面或斜角端口
  if (options?.diagonalLeftEnd) {
    // 创建45度斜角的三角形端口
    const diagonalCutDepth = width * 0.6  // 斜切深度
    const shape = new THREE.Shape()

    // 定义三角形形状（从上往下看）
    const halfWidth = (width - frameWidth * 4) / 2
    shape.moveTo(-halfWidth, 0)
    shape.lineTo(halfWidth, 0)
    shape.lineTo(halfWidth, diagonalCutDepth)
    shape.lineTo(-halfWidth, 0)

    const extrudeSettings = {
      depth: 0.012,
      bevelEnabled: false
    }

    const diagonalEndGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    const diagonalEnd = new THREE.Mesh(diagonalEndGeo, beltMaterial)
    diagonalEnd.rotation.x = -Math.PI / 2
    diagonalEnd.position.set(0, elevationHeight + frameHeight + rollerDiameter / 2 + 0.006, -length / 2 + shortenLeftBelt + diagonalCutDepth / 2)
    conveyor.add(diagonalEnd)
  } else {
    // 常规圆弧端口
    const frontBeltGeo = new THREE.CylinderGeometry(
      rollerDiameter / 2 + 0.012,
      rollerDiameter / 2 + 0.012,
      width - frameWidth * 4,
      12,
      1,
      false,
      0,
      Math.PI
    )
    const frontBelt = new THREE.Mesh(frontBeltGeo, beltMaterial)
    frontBelt.rotation.z = Math.PI / 2
    frontBelt.rotation.x = Math.PI / 2
    frontBelt.position.set(0, elevationHeight + frameHeight / 2, -length / 2 + shortenLeftBelt)
    conveyor.add(frontBelt)
  }

  // 后端履带弧面
  const backBeltGeo = new THREE.CylinderGeometry(
    rollerDiameter / 2 + 0.012,
    rollerDiameter / 2 + 0.012,
    width - frameWidth * 4,
    12,
    1,
    false,
    0,
    Math.PI
  )
  const backBelt = new THREE.Mesh(backBeltGeo, beltMaterial)
  backBelt.rotation.z = Math.PI / 2
  backBelt.rotation.x = -Math.PI / 2
  backBelt.position.set(0, elevationHeight + frameHeight / 2, length / 2 - shortenRightBelt)
  conveyor.add(backBelt)

  // LUTRUN蓝色标识（简化）
  const labelGeo = new THREE.BoxGeometry(0.12, 0.02, 0.006)
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0x3498db,
    metalness: 0.1,
    roughness: 0.7
  })
  const label = new THREE.Mesh(labelGeo, labelMat)
  label.position.set(0, elevationHeight + frameHeight + 0.015, 0)
  label.rotation.x = -Math.PI / 2
  conveyor.add(label)

  return conveyor
}
