import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { message } from 'antd'
import { useAuthStore } from '@/store/auth'

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: (window as any).APP_CONFIG?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const { token } = useAuthStore.getState()
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response
    if (data.code === 0) {
      return data.data
    } else {
      message.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response as any
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录')
          useAuthStore.getState().logout()
          window.location.href = '/login'
          break
        case 403:
          message.error('您没有权限执行此操作')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器错误，请稍后重试')
          break
        default:
          message.error(data?.message || '请求失败')
      }
    } else if (error.request) {
      message.error('网络错误，请检查您的网络连接')
    } else {
      message.error('请求配置错误')
    }
    return Promise.reject(error)
  }
)

// 将axios实例挂载到window对象，供zustand使用
if (typeof window !== 'undefined') {
  (window as any).axios = request
}

export { request }
export default request