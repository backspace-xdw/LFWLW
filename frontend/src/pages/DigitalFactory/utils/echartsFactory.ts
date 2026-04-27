/**
 * ECharts配置工厂
 * 统一图表配置，提供暗色主题预设和渐变色生成器
 */

// ===== 暗色主题颜色 =====
export const darkThemeColors = {
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  axisLine: 'rgba(255, 255, 255, 0.3)',
  primary: '#00e2cf',
  secondary: '#00b3a6',
  background: '#0c1f55',
  grid: 'rgba(255, 255, 255, 0.1)',
}

// ===== 渐变色配置 =====
export const gradients = {
  // 青色渐变（垂直）
  cyanVertical: {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: '#00e2cf' },
      { offset: 0.5, color: '#00b3a6' },
      { offset: 1, color: '#0c1f55' },
    ],
  },
  // 青色渐变（水平）
  cyanHorizontal: {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 1,
    y2: 0,
    colorStops: [
      { offset: 0, color: '#0c1f55' },
      { offset: 1, color: '#00e2cf' },
    ],
  },
  // 面积图填充渐变
  areaFill: {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: 'rgba(0, 226, 207, 0.3)' },
      { offset: 1, color: 'rgba(12, 31, 85, 0.1)' },
    ],
  },
  // 弱色渐变（用于最后一条数据）
  weakHorizontal: {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 1,
    y2: 0,
    colorStops: [
      { offset: 0, color: 'rgba(12, 31, 85, 0.3)' },
      { offset: 0.5, color: 'rgba(0, 226, 207, 0.4)' },
      { offset: 1, color: 'rgba(0, 226, 207, 0.6)' },
    ],
  },
}

// ===== 通用网格配置 =====
export const createGridConfig = (
  left = '10%',
  right = '10%',
  top = '15%',
  bottom = '15%',
  containLabel = false
) => ({
  left,
  right,
  top,
  bottom,
  containLabel,
})

// ===== 通用轴标签配置 =====
export const createAxisLabel = (fontSize = 8, color = darkThemeColors.text) => ({
  show: true,
  color,
  fontSize,
})

// ===== 通用轴线配置 =====
export const createAxisLine = (color = darkThemeColors.axisLine) => ({
  lineStyle: { color },
})

// ===== 创建类别轴配置 =====
export const createCategoryAxis = (
  data: string[],
  fontSize = 8
) => ({
  type: 'category' as const,
  data,
  axisLabel: createAxisLabel(fontSize),
  axisLine: createAxisLine(),
})

// ===== 创建数值轴配置 =====
export const createValueAxis = (
  min = 0,
  max = 100,
  interval = 20,
  fontSize = 8,
  formatter?: string
) => ({
  type: 'value' as const,
  min,
  max,
  interval,
  axisLabel: {
    ...createAxisLabel(fontSize),
    ...(formatter && { formatter }),
  },
  axisLine: createAxisLine(),
  splitLine: { show: false },
})

// ===== 本日工序合格率图表配置 =====
export const createQualificationRateOption = (
  inspectionCount: number,
  defectCount: number
) => ({
  grid: createGridConfig('10%', '20%', '15%', '20%'),
  xAxis: {
    type: 'category' as const,
    data: ['安检人数', '不合格人数'],
    axisLabel: createAxisLabel(10),
    axisLine: createAxisLine(),
  },
  yAxis: {
    type: 'value' as const,
    min: 0,
    max: 1000,
    interval: 200,
    axisLabel: createAxisLabel(8),
    axisLine: createAxisLine(),
    splitLine: { show: false },
  },
  series: [
    {
      name: '山形柱状图',
      type: 'pictorialBar',
      symbol: 'path://M0,10 L10,10 C5.5,10 5.5,5 5,0 C4.5,5 4.5,10 0,10 z',
      data: [inspectionCount, defectCount],
      symbolRepeat: false,
      symbolClip: true,
      symbolSize: ['60%', '100%'],
      itemStyle: {
        color: gradients.cyanVertical,
      },
      label: {
        show: true,
        position: 'top',
        color: darkThemeColors.text,
        fontSize: 10,
        fontWeight: 'bold',
      },
      z: 10,
    },
  ],
})

// ===== 产品合格率图表配置 =====
export const createProductQualityOption = (
  dates: string[],
  rates: number[]
) => ({
  grid: createGridConfig('10%', '10%', '25%', '15%'),
  title: {
    text: '本日合格率',
    top: 0,
    left: 0,
    textStyle: {
      color: darkThemeColors.text,
      fontSize: 9,
      fontWeight: 'normal' as const,
    },
  },
  xAxis: createCategoryAxis(dates),
  yAxis: [
    createValueAxis(0, 500, 100),
    {
      ...createValueAxis(0, 100, 20),
      axisLabel: {
        ...createAxisLabel(8),
        formatter: '{value}%',
      },
    },
  ],
  series: [
    {
      name: '合格率',
      type: 'line',
      data: rates,
      smooth: true,
      lineStyle: {
        width: 2,
        color: darkThemeColors.primary,
      },
      itemStyle: {
        color: darkThemeColors.primary,
      },
      areaStyle: {
        color: gradients.areaFill,
      },
      symbol: 'circle',
      symbolSize: 6,
      label: {
        show: true,
        position: 'top',
        color: darkThemeColors.text,
        fontSize: 8,
      },
    },
  ],
})

// ===== 仓库存料图表配置 =====
export const createInventoryOption = (
  years: string[],
  levels: number[],
  highlightLastItem = true
) => {
  const data = levels.map((value, index) => {
    if (highlightLastItem && index === levels.length - 1) {
      return {
        value,
        itemStyle: {
          color: gradients.weakHorizontal,
        },
      }
    }
    return value
  })

  const pictorialData = levels.map((value) => ({
    value,
    symbolSize: [10, 10],
  }))

  return {
    grid: createGridConfig('3%', '10%', '12%', '5%', true),
    xAxis: {
      type: 'value' as const,
      min: 0,
      max: 1000,
      interval: 200,
      axisLabel: createAxisLabel(8),
      axisLine: createAxisLine(),
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: years,
      axisLabel: createAxisLabel(8),
      axisLine: createAxisLine(),
    },
    series: [
      {
        name: '库存量',
        type: 'bar',
        data,
        barWidth: 10,
        itemStyle: {
          color: gradients.cyanHorizontal,
        },
        label: { show: false },
      },
      {
        name: '顶部装饰',
        type: 'pictorialBar',
        data: pictorialData,
        symbolPosition: 'end',
        symbol: 'diamond',
        symbolOffset: ['50%', 0],
        itemStyle: {
          color: '#6dfff3',
        },
        z: 3,
      },
    ],
  }
}
