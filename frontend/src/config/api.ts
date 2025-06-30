// API配置文件
// 确保所有API请求使用相对路径

export const API_CONFIG = {
  // 基础URL - 必须为空字符串以使用相对路径
  BASE_URL: '',
  
  // API端点
  endpoints: {
    auth: {
      login: '/api/v1/auth/login',
      logout: '/api/v1/auth/logout',
      refresh: '/api/v1/auth/refresh',
      me: '/api/v1/auth/me'
    }
  }
};

// 在开发环境中打印配置信息
if (import.meta.env.DEV) {
  console.log('API配置:', API_CONFIG);
  console.log('当前主机:', window.location.host);
}