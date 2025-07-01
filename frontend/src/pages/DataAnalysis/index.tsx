import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Table,
  Statistic,
  Space,
  Tabs,
  message,
  Spin,
  Empty,
  Tag,
  Radio,
} from 'antd'
import {
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  DotChartOutlined,
} from '@ant-design/icons'
import { Line, Column, Pie, Scatter } from '@ant-design/plots'
import moment from 'moment'
import styles from './index.module.scss'

const { RangePicker } = DatePicker
const { TabPane } = Tabs

interface DeviceDataPoint {
  timestamp: string
  deviceId: string
  deviceName: string
  temperature: number
  pressure: number
  flow?: number
  level?: number
  status: string
}

interface AnalysisData {
  summary: {
    avgTemperature: number
    avgPressure: number
    maxTemperature: number
    minTemperature: number
    maxPressure: number
    minPressure: number
    alarmCount: number
    dataPoints: number
  }
  trends: DeviceDataPoint[]
  distribution: {
    temperature: { range: string; count: number }[]
    pressure: { range: string; count: number }[]
  }
  deviceComparison: {
    deviceId: string
    deviceName: string
    avgTemperature: number
    avgPressure: number
    alarmCount: number
  }[]
  correlation: {
    x: number
    y: number
    type: string
  }[]
}

const DataAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment]>([
    moment().subtract(7, 'days'),
    moment(),
  ])
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([])
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [activeTab, setActiveTab] = useState('trends')
  const [trendParameter, setTrendParameter] = useState<'temperature' | 'pressure'>('temperature')

  // 获取设备列表
  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      // 模拟设备数据
      const mockDevices = [
        { id: 'PUMP_001', name: '主循环泵' },
        { id: 'VALVE_002', name: '进料阀' },
        { id: 'SENSOR_003', name: '温度传感器' },
        { id: 'MOTOR_004', name: '驱动电机' },
        { id: 'TANK_005', name: '储罐' },
      ]
      setDevices(mockDevices)
      setSelectedDevices(['PUMP_001', 'VALVE_002']) // 默认选择前两个
    } catch (error) {
      message.error('获取设备列表失败')
    }
  }

  // 获取分析数据
  const fetchAnalysisData = async () => {
    setLoading(true)
    try {
      // 模拟分析数据
      const trendData = generateTrendData()
      console.log('Trend data sample:', trendData.slice(0, 5)) // 调试信息
      console.log('Selected devices:', selectedDevices)
      console.log('Device colors mapping:', deviceColors)
      
      const mockData: AnalysisData = {
        summary: {
          avgTemperature: 75.5,
          avgPressure: 3.2,
          maxTemperature: 95.8,
          minTemperature: 62.3,
          maxPressure: 4.5,
          minPressure: 2.1,
          alarmCount: 23,
          dataPoints: 1680,
        },
        trends: trendData,
        distribution: {
          temperature: [
            { range: '60-70°C', count: 120 },
            { range: '70-80°C', count: 450 },
            { range: '80-90°C', count: 280 },
            { range: '90-100°C', count: 50 },
          ],
          pressure: [
            { range: '2-2.5 bar', count: 180 },
            { range: '2.5-3 bar', count: 320 },
            { range: '3-3.5 bar', count: 260 },
            { range: '3.5-4 bar', count: 140 },
          ],
        },
        deviceComparison: selectedDevices.map(id => ({
          deviceId: id,
          deviceName: devices.find(d => d.id === id)?.name || id,
          avgTemperature: 70 + Math.random() * 20,
          avgPressure: 2.5 + Math.random() * 1.5,
          alarmCount: Math.floor(Math.random() * 15),
        })),
        correlation: generateCorrelationData(),
      }
      setAnalysisData(mockData)
    } catch (error) {
      message.error('获取分析数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 生成趋势数据
  const generateTrendData = () => {
    const data: DeviceDataPoint[] = []
    const startDate = dateRange[0].valueOf()
    const endDate = dateRange[1].valueOf()
    const interval = (endDate - startDate) / 100

    selectedDevices.forEach((deviceId, deviceIndex) => {
      const deviceName = devices.find(d => d.id === deviceId)?.name || deviceId
      console.log(`Generating data for device ${deviceIndex}: ${deviceId} (${deviceName})`)
      
      for (let i = 0; i < 100; i++) {
        data.push({
          timestamp: moment(startDate + interval * i).format('YYYY-MM-DD HH:mm'),
          deviceId,
          deviceName,
          temperature: 70 + Math.random() * 20 + Math.sin(i / 10) * 5,
          pressure: 3 + Math.random() * 1 + Math.cos(i / 10) * 0.5,
          status: 'normal',
        })
      }
    })

    // Log unique device names in the data
    const uniqueDevices = [...new Set(data.map(d => d.deviceName))]
    console.log('Unique devices in trend data:', uniqueDevices)
    console.log('Total data points:', data.length)
    
    // Sort data by timestamp to ensure proper rendering
    data.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    console.log('Data sorted by timestamp')
    
    return data
  }

  // 生成相关性数据
  const generateCorrelationData = () => {
    const data = []
    for (let i = 0; i < 200; i++) {
      const temperature = 60 + Math.random() * 40
      const pressure = 2 + (temperature - 60) * 0.05 + Math.random() * 0.5
      data.push({
        x: temperature,
        y: pressure,
        type: '温度-压力',
      })
    }
    return data
  }

  // 定义设备颜色映射
  const deviceColors: Record<string, string> = {
    '主循环泵': '#1890ff',
    '进料阀': '#52c41a',
    '温度传感器': '#fa8c16',
    '驱动电机': '#722ed1',
    '储罐': '#eb2f96',
  }

  // 预处理数据，确保每个设备的数据有正确的顺序
  const processedTrendData = React.useMemo(() => {
    if (!analysisData?.trends) return []
    
    // 获取唯一的设备名称
    const uniqueDeviceNames = Array.from(new Set(analysisData.trends.map(d => d.deviceName)))
    console.log('Unique device names in data:', uniqueDeviceNames)
    
    return analysisData.trends
  }, [analysisData?.trends])

  // 创建颜色映射函数
  const getColorForDevice = (deviceName: string) => {
    return deviceColors[deviceName] || '#999999'
  }

  // 获取设备名称的顺序（用于颜色映射）
  const deviceNameOrder = React.useMemo(() => {
    if (!processedTrendData.length) return []
    const names: string[] = []
    const seen = new Set<string>()
    
    processedTrendData.forEach(item => {
      if (!seen.has(item.deviceName)) {
        seen.add(item.deviceName)
        names.push(item.deviceName)
      }
    })
    
    console.log('Device name order:', names)
    return names
  }, [processedTrendData])
  
  // 创建颜色数组（按设备出现顺序）
  const colorPalette = deviceNameOrder.map(name => deviceColors[name] || '#999999')
  console.log('Color palette:', colorPalette)
  
  // 趋势图配置
  const trendConfig: any = {
    data: processedTrendData,
    xField: 'timestamp',
    yField: trendParameter,
    seriesField: 'deviceName',
    colorField: 'deviceName', // 明确指定颜色字段
    smooth: true,
    // 使用映射后的颜色数组
    color: colorPalette,
    // 设置线条样式
    lineStyle: {
      lineWidth: 2,
    },
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    xAxis: {
      type: 'time',
      mask: 'MM-DD HH:mm',
    },
    yAxis: {
      title: {
        text: trendParameter === 'temperature' ? '温度 (°C)' : '压力 (bar)',
      },
    },
    legend: false, // Hide default legend since we're using custom legend
    tooltip: {
      showCrosshairs: true,
      shared: true,
      customContent: (title: string, items: any[]) => {
        if (!items || items.length === 0) return ''
        
        return `
          <div style="padding: 12px; background: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            <div style="margin-bottom: 8px; font-weight: 500; color: #333;">${title}</div>
            ${items.map(item => {
              const deviceName = item.data?.deviceName || item.name
              const color = getColorForDevice(deviceName)
              const value = item.data?.[trendParameter] || item.value
              const unit = trendParameter === 'temperature' ? '°C' : 'bar'
              
              return `
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; margin-right: 8px;"></span>
                  <span style="color: ${color}; margin-right: 16px; font-weight: 500;">${deviceName}:</span>
                  <span style="color: #666;">${value?.toFixed(2)} ${unit}</span>
                </div>
              `
            }).join('')}
          </div>
        `
      },
    },
    slider: {
      start: 0,
      end: 1,
    },
    // Meta configuration for better color mapping
    meta: {
      deviceName: {
        type: 'cat',
        values: deviceNameOrder,
      },
    },
    onReady: (plot: any) => {
      console.log('Chart ready, plot instance:', plot)
      console.log('Chart options:', plot.options)
      console.log('Color configuration:', plot.options.color)
      console.log('Data sample:', plot.options.data?.slice(0, 5))
    },
  }

  // 柱状图配置
  const columnConfig = {
    data: analysisData?.distribution.temperature || [],
    xField: 'range',
    yField: 'count',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
  }

  // 饼图配置
  const pieConfig = {
    data: analysisData?.deviceComparison.map(d => ({
      type: d.deviceName,
      value: d.alarmCount,
    })) || [],
    angleField: 'value',
    colorField: 'type',
    color: (type: string) => {
      return deviceColors[type] || '#1890ff'
    },
    radius: 0.9,
    label: {
      type: 'inner',
      offset: '-30%',
      content: ({ percent }: any) => `${(percent * 100).toFixed(0)}%`,
      style: {
        fontSize: 14,
        textAlign: 'center',
        fill: '#fff',
        fontWeight: 'bold',
      },
    },
    legend: {
      position: 'bottom',
      itemName: {
        style: (item: any) => {
          const color = deviceColors[item.value] || '#1890ff'
          return {
            fill: color,
            fontWeight: 500,
          }
        },
      },
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  }

  // 散点图配置
  const scatterConfig = {
    data: analysisData?.correlation || [],
    xField: 'x',
    yField: 'y',
    colorField: 'type',
    size: 5,
    shape: 'circle',
    yAxis: {
      title: {
        text: '压力 (bar)',
      },
    },
    xAxis: {
      title: {
        text: '温度 (°C)',
      },
      grid: {
        line: {
          style: {
            stroke: '#eee',
          },
        },
      },
    },
    pointStyle: {
      fillOpacity: 0.8,
    },
  }

  // 导出数据
  const handleExport = () => {
    if (!analysisData) {
      message.warning('暂无数据可导出')
      return
    }

    // 转换为CSV格式
    const csvContent = convertToCSV(analysisData.trends)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `data_analysis_${moment().format('YYYYMMDD_HHmmss')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('数据导出成功')
  }

  // 转换为CSV
  const convertToCSV = (data: DeviceDataPoint[]) => {
    const headers = ['时间', '设备ID', '设备名称', '温度(°C)', '压力(bar)', '状态']
    const rows = data.map(d => [
      d.timestamp,
      d.deviceId,
      d.deviceName,
      d.temperature.toFixed(2),
      d.pressure.toFixed(2),
      d.status,
    ])
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')
  }

  return (
    <div className={styles.dataAnalysis}>
      {/* 筛选条件 */}
      <Card className={styles.filterCard}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Space>
              <span>时间范围:</span>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [moment.Moment, moment.Moment])}
                showTime
                format="YYYY-MM-DD HH:mm"
              />
            </Space>
          </Col>
          <Col span={10}>
            <Space>
              <span>选择设备:</span>
              <Select
                mode="multiple"
                style={{ width: 400 }}
                placeholder="请选择设备"
                value={selectedDevices}
                onChange={setSelectedDevices}
              >
                {devices.map(device => (
                  <Select.Option key={device.id} value={device.id}>
                    {device.name}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={fetchAnalysisData}
                loading={loading}
              >
                查询分析
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={!analysisData}
              >
                导出数据
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setAnalysisData(null)
                  setSelectedDevices([])
                }}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计概览 */}
      {analysisData && (
        <Row gutter={16} className={styles.summaryRow}>
          <Col span={4}>
            <Card>
              <Statistic
                title="平均温度"
                value={analysisData.summary.avgTemperature}
                precision={1}
                suffix="°C"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="平均压力"
                value={analysisData.summary.avgPressure}
                precision={2}
                suffix="bar"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="最高温度"
                value={analysisData.summary.maxTemperature}
                precision={1}
                suffix="°C"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="最低温度"
                value={analysisData.summary.minTemperature}
                precision={1}
                suffix="°C"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="告警次数"
                value={analysisData.summary.alarmCount}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="数据点数"
                value={analysisData.summary.dataPoints}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 分析图表 */}
      <Card className={styles.chartCard}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <LineChartOutlined />
                趋势分析
              </span>
            }
            key="trends"
          >
            {loading ? (
              <div className={styles.loading}>
                <Spin size="large" />
              </div>
            ) : analysisData ? (
              <div>
                <Row justify="end" style={{ marginBottom: 16 }}>
                  <Col>
                    <Radio.Group 
                      value={trendParameter} 
                      onChange={e => setTrendParameter(e.target.value)}
                      buttonStyle="solid"
                    >
                      <Radio.Button value="temperature">温度趋势</Radio.Button>
                      <Radio.Button value="pressure">压力趋势</Radio.Button>
                    </Radio.Group>
                  </Col>
                </Row>
                <div style={{ position: 'relative' }}>
                  <Line 
                    {...trendConfig} 
                    onReady={(plot: any) => {
                      console.log('Chart ready, plot instance:', plot)
                      console.log('Chart options:', plot.options)
                    }}
                  />
                  {/* Custom legend with colored text */}
                  <div style={{ 
                    position: 'absolute', 
                    right: 10, 
                    top: 10,
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '8px 12px',
                    borderRadius: 4,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                  }}>
                    {deviceNameOrder.map((deviceName, index) => (
                      <div 
                        key={deviceName} 
                        style={{ 
                          marginBottom: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <span style={{
                          display: 'inline-block',
                          width: 20,
                          height: 3,
                          backgroundColor: colorPalette[index],
                          borderRadius: 1
                        }} />
                        <span style={{ 
                          color: colorPalette[index],
                          fontWeight: 500,
                          fontSize: 14
                        }}>
                          {deviceName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Empty description="暂无数据，请先进行查询" />
            )}
          </TabPane>

          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                分布统计
              </span>
            }
            key="distribution"
          >
            {analysisData ? (
              <Row gutter={16}>
                <Col span={12}>
                  <h4>温度分布</h4>
                  <Column {...columnConfig} />
                </Col>
                <Col span={12}>
                  <h4>压力分布</h4>
                  <Column
                    {...columnConfig}
                    data={analysisData.distribution.pressure}
                    yAxis={{ title: { text: '数量' } }}
                  />
                </Col>
              </Row>
            ) : (
              <Empty description="暂无数据，请先进行查询" />
            )}
          </TabPane>

          <TabPane
            tab={
              <span>
                <PieChartOutlined />
                设备对比
              </span>
            }
            key="comparison"
          >
            {analysisData ? (
              <Row gutter={16}>
                <Col span={12}>
                  <h4>告警分布</h4>
                  <Pie {...pieConfig} />
                </Col>
                <Col span={12}>
                  <h4>性能对比</h4>
                  <Table
                    dataSource={analysisData.deviceComparison}
                    rowKey="deviceId"
                    size="small"
                    columns={[
                      {
                        title: '设备名称',
                        dataIndex: 'deviceName',
                        key: 'deviceName',
                        render: (text: string) => (
                          <span style={{ 
                            color: deviceColors[text] || '#1890ff',
                            fontWeight: 500 
                          }}>
                            {text}
                          </span>
                        ),
                      },
                      {
                        title: '平均温度',
                        dataIndex: 'avgTemperature',
                        key: 'avgTemperature',
                        render: (val: number) => `${val.toFixed(1)}°C`,
                      },
                      {
                        title: '平均压力',
                        dataIndex: 'avgPressure',
                        key: 'avgPressure',
                        render: (val: number) => `${val.toFixed(2)} bar`,
                      },
                      {
                        title: '告警次数',
                        dataIndex: 'alarmCount',
                        key: 'alarmCount',
                        render: (val: number) => (
                          <Tag color={val > 10 ? 'red' : val > 5 ? 'orange' : 'green'}>
                            {val}
                          </Tag>
                        ),
                      },
                    ]}
                  />
                </Col>
              </Row>
            ) : (
              <Empty description="暂无数据，请先进行查询" />
            )}
          </TabPane>

          <TabPane
            tab={
              <span>
                <DotChartOutlined />
                相关性分析
              </span>
            }
            key="correlation"
          >
            {analysisData ? (
              <div>
                <h4>温度-压力相关性</h4>
                <Scatter {...scatterConfig} />
              </div>
            ) : (
              <Empty description="暂无数据，请先进行查询" />
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default DataAnalysis