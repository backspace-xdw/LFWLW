import React from 'react'
import ReactECharts from 'echarts-for-react'

interface GaugeChartProps {
  title: string
  value: number
  max: number
  unit?: string
  thresholds?: number[]
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  title,
  value,
  max,
  unit = '',
  thresholds = [max * 0.3, max * 0.7, max * 0.9],
}) => {
  const getColor = (val: number) => {
    if (val < thresholds[0]) return '#52c41a'
    if (val < thresholds[1]) return '#1890ff'
    if (val < thresholds[2]) return '#fadb14'
    return '#ff4d4f'
  }

  const option = {
    series: [
      {
        type: 'gauge',
        center: ['50%', '60%'],
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: max,
        splitNumber: 10,
        itemStyle: {
          color: getColor(value),
        },
        progress: {
          show: true,
          width: 20,
        },
        pointer: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            width: 20,
          },
        },
        axisTick: {
          distance: -25,
          splitNumber: 5,
          lineStyle: {
            width: 2,
            color: '#999',
          },
        },
        splitLine: {
          distance: -30,
          length: 10,
          lineStyle: {
            width: 3,
            color: '#999',
          },
        },
        axisLabel: {
          distance: -20,
          color: '#999',
          fontSize: 12,
        },
        anchor: {
          show: false,
        },
        title: {
          show: true,
          offsetCenter: [0, '-10%'],
          fontSize: 16,
          color: '#333',
        },
        detail: {
          valueAnimation: true,
          width: '60%',
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, '25%'],
          fontSize: 28,
          fontWeight: 'bolder',
          formatter: `{value} ${unit}`,
          color: 'inherit',
        },
        data: [
          {
            value: value,
            name: title,
          },
        ],
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 250 }} />
}

export default GaugeChart