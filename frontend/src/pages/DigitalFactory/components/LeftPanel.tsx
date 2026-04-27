/**
 * 左侧面板组件
 * 包含4个统计图表：本日工序合格率、产品合格率、仓库存料、产线异常信息、设备报警
 */
import React from 'react'
import { Card } from 'antd'
import ReactECharts from 'echarts-for-react'
import { LeftPanelProps, AlarmRecord, ProductionLineException } from '../types'
import { TitleDecoration } from './TitleDecoration'
import {
  createQualificationRateOption,
  createProductQualityOption,
  createInventoryOption,
} from '../utils/echartsFactory'
import styles from '../index.module.scss'

// 告警等级样式映射
const alarmLevelStyles: Record<string, string> = {
  high: styles.alarmLevelHigh,
  medium: styles.alarmLevelMedium,
  low: styles.alarmLevelLow,
}

const alarmLevelText: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

// 重复数据用于无缝滚动
const repeatData = <T,>(data: T[], times: number): T[] => {
  return Array(times).fill(data).flat()
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  qualificationRate,
  productQuality,
  inventory,
  exceptions,
  alarms,
}) => {
  // 重复数据用于无缝滚动
  const repeatedExceptions = repeatData(exceptions, 3)
  const repeatedAlarms = repeatData(alarms, 3)

  return (
    <div className={styles.leftPanel}>
      {/* 本日工序合格率 */}
      <Card
        style={{ marginTop: '4px' }}
        className={`${styles.card} ${styles.noBorder}`}
        title={
          <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
            <div style={{ paddingLeft: '5%' }}>本日工序合格率</div>
            <TitleDecoration gradientId="titleLineGradient1" color="cyan" />
          </div>
        }
        variant="borderless"
      >
        <ReactECharts
          option={createQualificationRateOption(
            qualificationRate.inspectionCount,
            qualificationRate.defectCount
          )}
          style={{ height: '120px' }}
        />
      </Card>

      {/* 产品合格率 */}
      <Card
        style={{ marginTop: '4px' }}
        className={`${styles.card} ${styles.noBorder}`}
        title={
          <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
            <div style={{ paddingLeft: '5%' }}>产品合格率</div>
            <TitleDecoration gradientId="titleLineGradient3" color="cyan" />
          </div>
        }
        variant="borderless"
      >
        <ReactECharts
          option={createProductQualityOption(
            productQuality.dates,
            productQuality.rates
          )}
          style={{ height: '100px' }}
        />
      </Card>

      {/* 仓库存料 */}
      <Card
        style={{ marginTop: '4px' }}
        className={`${styles.card} ${styles.noBorder}`}
        title={
          <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
            <div style={{ paddingLeft: '5%' }}>仓库存料</div>
            <TitleDecoration gradientId="titleLineGradient4" color="cyan" />
          </div>
        }
        variant="borderless"
      >
        <ReactECharts
          option={createInventoryOption(inventory.years, inventory.levels)}
          style={{ height: '100px' }}
        />
      </Card>

      {/* 产线异常信息 */}
      <Card
        style={{ marginTop: '4px' }}
        className={`${styles.card} ${styles.noBorder}`}
        title={
          <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
            <div style={{ paddingLeft: '5%' }}>产线异常信息</div>
            <TitleDecoration gradientId="titleLineGradient7" color="cyan" />
          </div>
        }
        variant="borderless"
      >
        <div className={styles.exceptionTableContainer}>
          <table className={styles.exceptionTable}>
            <thead>
              <tr>
                <th>年份</th>
                <th>产值</th>
                <th>人均产值</th>
                <th>员工人数</th>
              </tr>
            </thead>
          </table>
          <div className={styles.scrollWrapper}>
            <table className={styles.exceptionTable}>
              <tbody>
                {repeatedExceptions.map((item: ProductionLineException, index: number) => (
                  <tr key={index}>
                    <td>{item.year}</td>
                    <td>{item.outputValue}</td>
                    <td>{item.perCapitaOutput}</td>
                    <td>{item.employeeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* 设备报警 */}
      <Card
        style={{ marginTop: '4px' }}
        className={`${styles.card} ${styles.noBorder}`}
        title={
          <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
            <div style={{ paddingLeft: '5%' }}>设备报警</div>
            <TitleDecoration gradientId="titleLineGradient8" color="red" />
          </div>
        }
        variant="borderless"
      >
        <div className={styles.exceptionTableContainer}>
          <table className={styles.alarmTable}>
            <thead>
              <tr>
                <th>时间</th>
                <th>设备</th>
                <th>等级</th>
                <th>报警内容</th>
              </tr>
            </thead>
          </table>
          <div className={styles.alarmScrollWrapper}>
            <table className={styles.alarmTable}>
              <tbody>
                {repeatedAlarms.map((item: AlarmRecord, index: number) => (
                  <tr key={index}>
                    <td>{item.time}</td>
                    <td>{item.device}</td>
                    <td>
                      <span className={alarmLevelStyles[item.level]}>
                        {alarmLevelText[item.level]}
                      </span>
                    </td>
                    <td>{item.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default LeftPanel
