import { Router } from 'express'
import { alarmRuleManager, AlarmRule } from '../services/alarmRules'
import { logger } from '../utils/logger'

const router = Router()

// 获取所有告警规则
router.get('/', (req, res) => {
  try {
    const rules = alarmRuleManager.getAllRules()
    res.json({
      success: true,
      data: rules,
    })
  } catch (error) {
    logger.error('Failed to get alarm rules', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get alarm rules',
    })
  }
})

// 添加告警规则
router.post('/', (req, res) => {
  try {
    const rule: AlarmRule = req.body
    alarmRuleManager.addRule(rule)
    res.json({
      success: true,
      message: 'Alarm rule added successfully',
      data: rule,
    })
  } catch (error) {
    logger.error('Failed to add alarm rule', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add alarm rule',
    })
  }
})

// 更新告警规则
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    alarmRuleManager.updateRule(id, updates)
    res.json({
      success: true,
      message: 'Alarm rule updated successfully',
    })
  } catch (error) {
    logger.error('Failed to update alarm rule', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update alarm rule',
    })
  }
})

// 删除告警规则
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    alarmRuleManager.deleteRule(id)
    res.json({
      success: true,
      message: 'Alarm rule deleted successfully',
    })
  } catch (error) {
    logger.error('Failed to delete alarm rule', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete alarm rule',
    })
  }
})

export default router