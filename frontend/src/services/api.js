import axios from 'axios'

// 使用相对路径，依赖 Vite 代理配置
const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳用于调试
    config.metadata = { startTime: new Date() }
    
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理响应和错误
api.interceptors.response.use(
  (response) => {
    // 计算请求耗时
    if (response.config.metadata) {
      const endTime = new Date()
      const duration = endTime.getTime() - response.config.metadata.startTime.getTime()
      console.log(`API ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
    }
    
    // 返回响应数据
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    
    // 网络错误
    if (!error.response) {
      const networkError = new Error('网络连接失败，请检查网络设置')
      networkError.type = 'NETWORK_ERROR'
      return Promise.reject(networkError)
    }

    const { status, data } = error.response
    
    // 根据HTTP状态码处理不同错误
    switch (status) {
      case 401:
        // 未授权，清除token并跳转到登录页
        localStorage.removeItem('authToken')
        const authError = new Error(data?.message || '登录已过期，请重新登录')
        authError.type = 'AUTH_ERROR'
        authError.status = 401
        
        // 如果当前页面不是登录页，跳转到登录页
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        
        return Promise.reject(authError)
        
      case 403:
        const permissionError = new Error(data?.message || '权限不足')
        permissionError.type = 'PERMISSION_ERROR'
        permissionError.status = 403
        return Promise.reject(permissionError)
        
      case 404:
        const notFoundError = new Error(data?.message || '请求的资源不存在')
        notFoundError.type = 'NOT_FOUND_ERROR'
        notFoundError.status = 404
        return Promise.reject(notFoundError)
        
      case 422:
        // 验证错误，返回详细的错误信息
        const validationError = new Error(data?.message || '数据验证失败')
        validationError.type = 'VALIDATION_ERROR'
        validationError.status = 422
        validationError.errors = data?.errors || []
        return Promise.reject(validationError)
        
      case 429:
        const rateLimitError = new Error(data?.message || '请求过于频繁，请稍后再试')
        rateLimitError.type = 'RATE_LIMIT_ERROR'
        rateLimitError.status = 429
        return Promise.reject(rateLimitError)
        
      case 500:
        const serverError = new Error(data?.message || '服务器内部错误')
        serverError.type = 'SERVER_ERROR'
        serverError.status = 500
        return Promise.reject(serverError)
        
      default:
        const genericError = new Error(data?.message || error.message || '请求失败')
        genericError.type = 'GENERIC_ERROR'
        genericError.status = status
        return Promise.reject(genericError)
    }
  }
)

// 导出API实例和工具函数
export default api

// 设置认证token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token)
    api.defaults.headers.Authorization = `Bearer ${token}`
  } else {
    localStorage.removeItem('authToken')
    delete api.defaults.headers.Authorization
  }
}

// 获取认证token
export const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

// 清除认证token
export const clearAuthToken = () => {
  localStorage.removeItem('authToken')
  delete api.defaults.headers.Authorization
}

// 系统信息相关 API
export const systemApi = {
  // 系统概览
  getSystemOverview: () => api.get('/'),
  
  // 健康检查
  healthCheck: () => api.get('/health'),
  
  // 获取数据库信息
  getDatabaseInfo: () => api.get('/db-info')
}

// 保持向后兼容
export const healthCheck = systemApi.healthCheck
export const getDatabaseInfo = systemApi.getDatabaseInfo