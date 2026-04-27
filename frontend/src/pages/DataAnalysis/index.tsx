import React, { useState, useCallback } from 'react'
import { Card, DatePicker, Button, Space, Tabs, Radio, message } from 'antd'
import {
  LineChartOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import MonitorAnalysis from './components/MonitorAnalysis'
import AlarmAnalysis from './components/AlarmAnalysis'
import RiskAnalysis from './components/RiskAnalysis'
import ComprehensiveReport from './components/ComprehensiveReport'
import request from '@/utils/request'

const { RangePicker } = DatePicker

type DateRange = [dayjs.Dayjs, dayjs.Dayjs]

const DataAnalysis: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>([
    dayjs().subtract(7, 'days'),
    dayjs(),
  ])
  const [activeTab, setActiveTab] = useState('monitor')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleQuickRange = (days: number) => {
    setDateRange([dayjs().subtract(days, days <= 1 ? 'hours' : 'days'), dayjs()])
    setRefreshKey(k => k + 1)
  }

  const handleQuery = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  const handleExport = async () => {
    try {
      const typeMap: Record<string, string> = {
        monitor: 'instrument',
        alarm: 'alarm',
      }
      const exportType = typeMap[activeTab]
      if (!exportType) {
        message.warning('当前页面暂不支持导出')
        return
      }
      const res = await request.post('/api/v1/analysis/export', {
        type: exportType,
        startTime: dateRange[0].toISOString(),
        endTime: dateRange[1].toISOString(),
      }, { responseType: 'blob' } as any)
      const blob = new Blob([res as any], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `analysis_${exportType}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('导出成功')
    } catch {
      message.error('导出失败')
    }
  }

  const tabItems = [
    {
      key: 'monitor',
      label: <span><LineChartOutlined /> 监测参数分析</span>,
      children: <MonitorAnalysis dateRange={dateRange} refreshKey={refreshKey} />,
    },
    {
      key: 'alarm',
      label: <span><AlertOutlined /> 告警统计分析</span>,
      children: <AlarmAnalysis dateRange={dateRange} refreshKey={refreshKey} />,
    },
    {
      key: 'risk',
      label: <span><ThunderboltOutlined /> 风险趋势分析</span>,
      children: <RiskAnalysis dateRange={dateRange} refreshKey={refreshKey} />,
    },
    {
      key: 'report',
      label: <span><FileTextOutlined /> 综合分析报告</span>,
      children: <ComprehensiveReport dateRange={dateRange} refreshKey={refreshKey} />,
    },
  ]

  return (
    <div className={styles.dataAnalysis}>
      <Card className={styles.filterCard}>
        <div className={styles.filterBar}>
          <Space wrap>
            <span className={styles.filterLabel}>分析周期:</span>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as DateRange)}
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
            />
            <Radio.Group
              size="small"
              onChange={e => handleQuickRange(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value={24}>24小时</Radio.Button>
              <Radio.Button value={7}>7天</Radio.Button>
              <Radio.Button value={30}>30天</Radio.Button>
            </Radio.Group>
          </Space>
          <Space>
            <Button type="primary" onClick={handleQuery}>查询分析</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
          </Space>
        </div>
      </Card>

      <Card className={styles.chartCard}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  )
}

export default DataAnalysis
