import { ElementTemplate } from '../types';

// 泵类元素
const pumpTemplates: ElementTemplate[] = [
  {
    id: 'pump_centrifugal',
    name: '离心泵',
    category: 'equipment',
    type: 'pump',
    icon: '/icons/pump_centrifugal.svg',
    defaultSize: { width: 80, height: 60 },
    ports: [
      { id: 'inlet', position: { x: 0, y: 0.5 }, direction: 'left' },
      { id: 'outlet', position: { x: 1, y: 0.5 }, direction: 'right' },
    ],
    properties: [
      { name: 'tag', label: '位号', type: 'string', defaultValue: 'P-001' },
      { name: 'flow', label: '流量', type: 'number', unit: 'm³/h', defaultValue: 0 },
      { name: 'pressure', label: '压力', type: 'number', unit: 'bar', defaultValue: 0 },
      { name: 'status', label: '状态', type: 'select', defaultValue: 'stopped', 
        options: [
          { label: '停止', value: 'stopped' },
          { label: '运行', value: 'running' },
          { label: '故障', value: 'fault' },
        ]
      },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <circle cx="40" cy="30" r="25" fill="#4096ff" opacity="0.8" stroke="#2563eb" stroke-width="2"/>
        <path d="M 15 30 Q 40 10, 65 30 Q 40 50, 15 30" fill="#60a5fa" stroke="#2563eb" stroke-width="1"/>
        <line x1="5" y1="30" x2="15" y2="30" stroke="#333" stroke-width="3"/>
        <line x1="65" y1="30" x2="75" y2="30" stroke="#333" stroke-width="3"/>
      </g>`,
    },
  },
  {
    id: 'pump_gear',
    name: '齿轮泵',
    category: 'equipment',
    type: 'pump',
    icon: '/icons/pump_gear.svg',
    defaultSize: { width: 80, height: 60 },
    ports: [
      { id: 'inlet', position: { x: 0, y: 0.5 }, direction: 'left' },
      { id: 'outlet', position: { x: 1, y: 0.5 }, direction: 'right' },
    ],
    properties: [
      { name: 'tag', label: '位号', type: 'string', defaultValue: 'P-002' },
      { name: 'flow', label: '流量', type: 'number', unit: 'm³/h', defaultValue: 0 },
      { name: 'pressure', label: '压力', type: 'number', unit: 'bar', defaultValue: 0 },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <rect x="20" y="15" width="40" height="30" rx="5" fill="#8b5cf6" opacity="0.8" stroke="#7c3aed" stroke-width="2"/>
        <circle cx="35" cy="30" r="8" fill="#a78bfa" stroke="#7c3aed" stroke-width="1"/>
        <circle cx="45" cy="30" r="8" fill="#a78bfa" stroke="#7c3aed" stroke-width="1"/>
        <line x1="5" y1="30" x2="20" y2="30" stroke="#333" stroke-width="3"/>
        <line x1="60" y1="30" x2="75" y2="30" stroke="#333" stroke-width="3"/>
      </g>`,
    },
  },
];

// 阀门类元素
const valveTemplates: ElementTemplate[] = [
  {
    id: 'valve_ball',
    name: '球阀',
    category: 'valve',
    type: 'valve',
    icon: '/icons/valve_ball.svg',
    defaultSize: { width: 60, height: 60 },
    ports: [
      { id: 'inlet', position: { x: 0, y: 0.5 }, direction: 'left' },
      { id: 'outlet', position: { x: 1, y: 0.5 }, direction: 'right' },
    ],
    properties: [
      { name: 'tag', label: '位号', type: 'string', defaultValue: 'V-001' },
      { name: 'position', label: '开度', type: 'number', unit: '%', defaultValue: 0, min: 0, max: 100 },
      { name: 'type', label: '类型', type: 'select', defaultValue: 'manual',
        options: [
          { label: '手动', value: 'manual' },
          { label: '电动', value: 'electric' },
          { label: '气动', value: 'pneumatic' },
        ]
      },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <line x1="5" y1="30" x2="25" y2="30" stroke="#333" stroke-width="3"/>
        <line x1="35" y1="30" x2="55" y2="30" stroke="#333" stroke-width="3"/>
        <rect x="25" y="20" width="10" height="20" fill="#52c41a" stroke="#389e0d" stroke-width="2"/>
        <circle cx="30" cy="30" r="8" fill="#73d13d" stroke="#389e0d" stroke-width="1"/>
        <line x1="30" y1="20" x2="30" y2="10" stroke="#333" stroke-width="2"/>
      </g>`,
    },
  },
  {
    id: 'valve_gate',
    name: '闸阀',
    category: 'valve',
    type: 'valve',
    icon: '/icons/valve_gate.svg',
    defaultSize: { width: 60, height: 60 },
    ports: [
      { id: 'inlet', position: { x: 0, y: 0.5 }, direction: 'left' },
      { id: 'outlet', position: { x: 1, y: 0.5 }, direction: 'right' },
    ],
    properties: [
      { name: 'tag', label: '位号', type: 'string', defaultValue: 'V-002' },
      { name: 'position', label: '开度', type: 'number', unit: '%', defaultValue: 0, min: 0, max: 100 },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <line x1="5" y1="30" x2="20" y2="30" stroke="#333" stroke-width="3"/>
        <line x1="40" y1="30" x2="55" y2="30" stroke="#333" stroke-width="3"/>
        <path d="M 20 20 L 40 20 L 40 40 L 20 40 Z" fill="#faad14" stroke="#d48806" stroke-width="2"/>
        <rect x="27" y="10" width="6" height="20" fill="#ffc53d" stroke="#d48806" stroke-width="1"/>
        <circle cx="30" cy="8" r="3" fill="#d48806"/>
      </g>`,
    },
  },
  {
    id: 'valve_check',
    name: '止回阀',
    category: 'valve',
    type: 'valve',
    icon: '/icons/valve_check.svg',
    defaultSize: { width: 60, height: 60 },
    ports: [
      { id: 'inlet', position: { x: 0, y: 0.5 }, direction: 'left' },
      { id: 'outlet', position: { x: 1, y: 0.5 }, direction: 'right' },
    ],
    properties: [
      { name: 'tag', label: '位号', type: 'string', defaultValue: 'V-003' },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <line x1="5" y1="30" x2="25" y2="30" stroke="#333" stroke-width="3"/>
        <line x1="35" y1="30" x2="55" y2="30" stroke="#333" stroke-width="3"/>
        <circle cx="30" cy="30" r="10" fill="none" stroke="#13c2c2" stroke-width="2"/>
        <path d="M 25 30 L 35 25 L 35 35 Z" fill="#36cfc9" stroke="#13c2c2" stroke-width="1"/>
      </g>`,
    },
  },
];

// 容器类元素
const tankTemplates: ElementTemplate[] = [
  {
    id: 'tank_storage',
    name: '储罐',
    category: 'equipment',
    type: 'tank',
    icon: '/icons/tank_storage.svg',
    defaultSize: { width: 100, height: 120 },
    ports: [
      { id: 'inlet_top', position: { x: 0.5, y: 0 }, direction: 'top' },
      { id: 'outlet_bottom', position: { x: 0.5, y: 1 }, direction: 'bottom' },
      { id: 'inlet_side', position: { x: 0, y: 0.3 }, direction: 'left' },
      { id: 'outlet_side', position: { x: 1, y: 0.7 }, direction: 'right' },
    ],
    properties: [
      { name: 'tag', label: '位号', type: 'string', defaultValue: 'T-001' },
      { name: 'level', label: '液位', type: 'number', unit: '%', defaultValue: 50, min: 0, max: 100 },
      { name: 'temperature', label: '温度', type: 'number', unit: '°C', defaultValue: 25 },
      { name: 'pressure', label: '压力', type: 'number', unit: 'bar', defaultValue: 1 },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <rect x="20" y="20" width="60" height="80" rx="5" fill="#1890ff" opacity="0.3" stroke="#0050b3" stroke-width="2"/>
        <rect x="20" y="60" width="60" height="40" fill="#40a9ff" opacity="0.6"/>
        <path d="M 20 25 Q 50 15, 80 25" stroke="#0050b3" stroke-width="2" fill="none"/>
        <path d="M 20 95 Q 50 105, 80 95" stroke="#0050b3" stroke-width="2" fill="none"/>
      </g>`,
    },
  },
  {
    id: 'tank_reactor',
    name: '反应器',
    category: 'equipment',
    type: 'tank',
    icon: '/icons/tank_reactor.svg',
    defaultSize: { width: 100, height: 120 },
    ports: [
      { id: 'inlet_1', position: { x: 0.3, y: 0 }, direction: 'top' },
      { id: 'inlet_2', position: { x: 0.7, y: 0 }, direction: 'top' },
      { id: 'outlet', position: { x: 0.5, y: 1 }, direction: 'bottom' },
      { id: 'agitator', position: { x: 0.5, y: 0.3 }, direction: 'top', type: 'input' },
    ],
    properties: [
      { name: 'tag', label: '位号', type: 'string', defaultValue: 'R-001' },
      { name: 'temperature', label: '温度', type: 'number', unit: '°C', defaultValue: 80 },
      { name: 'pressure', label: '压力', type: 'number', unit: 'bar', defaultValue: 2 },
      { name: 'agitatorSpeed', label: '搅拌速度', type: 'number', unit: 'rpm', defaultValue: 0 },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <ellipse cx="50" cy="30" rx="30" ry="10" fill="#f5222d" opacity="0.3" stroke="#cf1322" stroke-width="2"/>
        <rect x="20" y="30" width="60" height="60" fill="#ff4d4f" opacity="0.3" stroke="#cf1322" stroke-width="2"/>
        <ellipse cx="50" cy="90" rx="30" ry="10" fill="#f5222d" opacity="0.3" stroke="#cf1322" stroke-width="2"/>
        <line x1="50" y1="20" x2="50" y2="70" stroke="#cf1322" stroke-width="3"/>
        <path d="M 40 60 L 60 60 M 35 70 L 65 70" stroke="#cf1322" stroke-width="2"/>
      </g>`,
    },
  },
];

// 仪表类元素
const instrumentTemplates: ElementTemplate[] = [
  {
    id: 'instrument_pressure',
    name: '压力表',
    category: 'instrument',
    type: 'instrument',
    icon: '/icons/instrument_pressure.svg',
    defaultSize: { width: 50, height: 50 },
    ports: [
      { id: 'connection', position: { x: 0.5, y: 1 }, direction: 'bottom' },
    ],
    properties: [
      { name: 'tag', label: '位号', type: 'string', defaultValue: 'PI-001' },
      { name: 'value', label: '读数', type: 'number', unit: 'bar', defaultValue: 0 },
      { name: 'range', label: '量程', type: 'string', defaultValue: '0-10 bar' },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <circle cx="25" cy="25" r="20" fill="white" stroke="#ff4d4f" stroke-width="2"/>
        <text x="25" y="30" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff4d4f">PI</text>
        <line x1="25" y1="45" x2="25" y2="50" stroke="#333" stroke-width="2"/>
      </g>`,
    },
  },
  {
    id: 'instrument_temperature',
    name: '温度计',
    category: 'instrument',
    type: 'instrument',
    icon: '/icons/instrument_temperature.svg',
    defaultSize: { width: 50, height: 50 },
    ports: [
      { id: 'connection', position: { x: 0.5, y: 1 }, direction: 'bottom' },
    ],
    properties: [
      { name: 'tag', label: '位号', type: 'string', defaultValue: 'TI-001' },
      { name: 'value', label: '读数', type: 'number', unit: '°C', defaultValue: 25 },
      { name: 'range', label: '量程', type: 'string', defaultValue: '0-100°C' },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <circle cx="25" cy="25" r="20" fill="white" stroke="#fa8c16" stroke-width="2"/>
        <text x="25" y="30" text-anchor="middle" font-size="12" font-weight="bold" fill="#fa8c16">TI</text>
        <line x1="25" y1="45" x2="25" y2="50" stroke="#333" stroke-width="2"/>
      </g>`,
    },
  },
  {
    id: 'instrument_flow',
    name: '流量计',
    category: 'instrument',
    type: 'instrument',
    icon: '/icons/instrument_flow.svg',
    defaultSize: { width: 60, height: 40 },
    ports: [
      { id: 'inlet', position: { x: 0, y: 0.5 }, direction: 'left' },
      { id: 'outlet', position: { x: 1, y: 0.5 }, direction: 'right' },
    ],
    properties: [
      { name: 'tag', label: '位号', type: 'string', defaultValue: 'FI-001' },
      { name: 'value', label: '读数', type: 'number', unit: 'm³/h', defaultValue: 0 },
      { name: 'totalizer', label: '累计', type: 'number', unit: 'm³', defaultValue: 0 },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <line x1="5" y1="20" x2="15" y2="20" stroke="#333" stroke-width="3"/>
        <line x1="45" y1="20" x2="55" y2="20" stroke="#333" stroke-width="3"/>
        <circle cx="30" cy="20" r="15" fill="white" stroke="#52c41a" stroke-width="2"/>
        <text x="30" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#52c41a">FI</text>
      </g>`,
    },
  },
  {
    id: 'instrument_level',
    name: '液位计',
    category: 'instrument',
    type: 'instrument',
    icon: '/icons/instrument_level.svg',
    defaultSize: { width: 50, height: 50 },
    ports: [
      { id: 'connection', position: { x: 0, y: 0.5 }, direction: 'left' },
    ],
    properties: [
      { name: 'tag', label: '位号', type: 'string', defaultValue: 'LI-001' },
      { name: 'value', label: '读数', type: 'number', unit: '%', defaultValue: 50, min: 0, max: 100 },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <circle cx="25" cy="25" r="20" fill="white" stroke="#1890ff" stroke-width="2"/>
        <text x="25" y="30" text-anchor="middle" font-size="12" font-weight="bold" fill="#1890ff">LI</text>
      </g>`,
    },
  },
];

// 管道类元素
const pipeTemplates: ElementTemplate[] = [
  {
    id: 'pipe_straight',
    name: '直管',
    category: 'pipe',
    type: 'pipe',
    icon: '/icons/pipe_straight.svg',
    defaultSize: { width: 100, height: 20 },
    ports: [
      { id: 'inlet', position: { x: 0, y: 0.5 }, direction: 'left' },
      { id: 'outlet', position: { x: 1, y: 0.5 }, direction: 'right' },
    ],
    properties: [
      { name: 'diameter', label: '管径', type: 'string', defaultValue: 'DN100' },
      { name: 'material', label: '材质', type: 'select', defaultValue: 'CS',
        options: [
          { label: '碳钢', value: 'CS' },
          { label: '不锈钢', value: 'SS' },
          { label: 'PVC', value: 'PVC' },
        ]
      },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <line x1="0" y1="10" x2="100" y2="10" stroke="#666" stroke-width="8"/>
      </g>`,
    },
  },
  {
    id: 'pipe_elbow',
    name: '弯头',
    category: 'pipe',
    type: 'pipe',
    icon: '/icons/pipe_elbow.svg',
    defaultSize: { width: 60, height: 60 },
    ports: [
      { id: 'inlet', position: { x: 0, y: 0.5 }, direction: 'left' },
      { id: 'outlet', position: { x: 0.5, y: 0 }, direction: 'top' },
    ],
    properties: [
      { name: 'angle', label: '角度', type: 'select', defaultValue: '90',
        options: [
          { label: '90°', value: '90' },
          { label: '45°', value: '45' },
        ]
      },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <path d="M 5 30 L 25 30 Q 30 30, 30 25 L 30 5" stroke="#666" stroke-width="8" fill="none"/>
      </g>`,
    },
  },
  {
    id: 'pipe_tee',
    name: '三通',
    category: 'pipe',
    type: 'pipe',
    icon: '/icons/pipe_tee.svg',
    defaultSize: { width: 80, height: 60 },
    ports: [
      { id: 'inlet', position: { x: 0, y: 0.5 }, direction: 'left' },
      { id: 'outlet1', position: { x: 1, y: 0.5 }, direction: 'right' },
      { id: 'outlet2', position: { x: 0.5, y: 0 }, direction: 'top' },
    ],
    properties: [],
    graphics: {
      type: 'svg',
      data: `<g>
        <line x1="5" y1="30" x2="75" y2="30" stroke="#666" stroke-width="8"/>
        <line x1="40" y1="30" x2="40" y2="5" stroke="#666" stroke-width="8"/>
      </g>`,
    },
  },
];

// 电气元件
const electricalTemplates: ElementTemplate[] = [
  {
    id: 'motor_3phase',
    name: '三相电机',
    category: 'electrical',
    type: 'motor',
    icon: '/icons/motor_3phase.svg',
    defaultSize: { width: 60, height: 60 },
    ports: [
      { id: 'power', position: { x: 0.5, y: 0 }, direction: 'top', type: 'input' },
      { id: 'shaft', position: { x: 0.5, y: 1 }, direction: 'bottom', type: 'output' },
    ],
    properties: [
      { name: 'tag', label: '位号', type: 'string', defaultValue: 'M-001' },
      { name: 'power', label: '功率', type: 'number', unit: 'kW', defaultValue: 15 },
      { name: 'speed', label: '转速', type: 'number', unit: 'rpm', defaultValue: 0 },
      { name: 'current', label: '电流', type: 'number', unit: 'A', defaultValue: 0 },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <circle cx="30" cy="30" r="25" fill="#faad14" opacity="0.8" stroke="#d48806" stroke-width="2"/>
        <text x="30" y="36" text-anchor="middle" font-size="20" font-weight="bold" fill="white">M</text>
        <line x1="30" y1="5" x2="30" y2="15" stroke="#333" stroke-width="3"/>
        <line x1="30" y1="45" x2="30" y2="55" stroke="#333" stroke-width="3"/>
      </g>`,
    },
  },
];

// 标注元素
const annotationTemplates: ElementTemplate[] = [
  {
    id: 'text_label',
    name: '文本标签',
    category: 'annotation',
    type: 'text',
    icon: '/icons/text_label.svg',
    defaultSize: { width: 100, height: 30 },
    ports: [],
    properties: [
      { name: 'text', label: '文本', type: 'string', defaultValue: '标签文本' },
      { name: 'fontSize', label: '字号', type: 'number', defaultValue: 14, min: 10, max: 48 },
      { name: 'color', label: '颜色', type: 'color', defaultValue: '#333333' },
    ],
    graphics: {
      type: 'svg',
      data: `<g>
        <text x="50" y="15" text-anchor="middle" font-size="14" fill="#333">文本标签</text>
      </g>`,
    },
  },
];

// 导出所有模板
export const elementTemplates: ElementTemplate[] = [
  ...pumpTemplates,
  ...valveTemplates,
  ...tankTemplates,
  ...instrumentTemplates,
  ...pipeTemplates,
  ...electricalTemplates,
  ...annotationTemplates,
];

// 按类别导出
export const templatesByCategory = {
  equipment: [...pumpTemplates, ...tankTemplates],
  valve: valveTemplates,
  pipe: pipeTemplates,
  instrument: instrumentTemplates,
  electrical: electricalTemplates,
  annotation: annotationTemplates,
};

// 获取模板
export const getTemplate = (id: string): ElementTemplate | undefined => {
  return elementTemplates.find(t => t.id === id);
};