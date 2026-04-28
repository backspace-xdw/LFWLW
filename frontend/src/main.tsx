import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import dayjs from 'dayjs'
import App from './App'
import './styles/index.css'

dayjs.locale('zh-cn')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#4A90E2',
          borderRadius: 6,
          // 字体清晰度增强：整体放大 ~10%
          fontFamily:
            '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "Source Han Sans CN", "Noto Sans CJK SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: 15,        // 默认 14
          fontSizeSM: 13,      // 默认 12
          fontSizeLG: 17,      // 默认 16
          fontSizeXL: 22,      // 默认 20
          fontSizeHeading1: 36,
          fontSizeHeading2: 28,
          fontSizeHeading3: 22,
          fontSizeHeading4: 18,
          fontSizeHeading5: 16,
          lineHeight: 1.6,
          lineHeightLG: 1.6,
          lineHeightSM: 1.5,
        },
        components: {
          Table: { fontSize: 15, headerFontSize: 15 },
          Menu: { fontSize: 15 },
          Button: { fontSize: 15 },
          Tag: { fontSize: 13 },
          Statistic: { titleFontSize: 15, contentFontSize: 26 },
          Form: { labelFontSize: 15 },
          Tabs: { titleFontSize: 16 },
          Modal: { titleFontSize: 18 },
          Card: { fontSize: 15 },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)