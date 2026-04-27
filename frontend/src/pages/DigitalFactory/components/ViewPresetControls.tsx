/**
 * 视角控制组件
 * 提供视角预设切换按钮
 */
import React from 'react'
import { ViewPresetControlsProps, ViewPresetKey } from '../types'
import { viewPresets } from '../config/scene3dConfig'
import styles from '../index.module.scss'

export const ViewPresetControls: React.FC<ViewPresetControlsProps> = ({
  activePreset,
  onPresetChange,
}) => {
  return (
    <div className={styles.viewPresetPanel}>
      <div className={styles.viewPresetTitle}>视角切换</div>
      <div className={styles.viewPresetButtons}>
        {(Object.entries(viewPresets) as [ViewPresetKey, typeof viewPresets.overview][]).map(
          ([key, preset]) => (
            <button
              key={key}
              className={`${styles.viewPresetBtn} ${
                activePreset === key ? styles.active : ''
              }`}
              onClick={() => onPresetChange(key)}
            >
              {preset.name}
            </button>
          )
        )}
      </div>
      <div className={styles.viewPresetTip}>
        右键拖拽旋转 | 左键拖拽平移 | 滚轮缩放
      </div>
    </div>
  )
}

export default ViewPresetControls
