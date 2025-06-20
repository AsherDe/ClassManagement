import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useSystemStore = defineStore('system', () => {
  const systemInfo = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // API基础配置
  const api = axios.create({
    baseURL: '/api',
    timeout: 10000
  })

  // 请求拦截器
  api.interceptors.request.use(
    config => {
      loading.value = true
      return config
    },
    error => {
      loading.value = false
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  api.interceptors.response.use(
    response => {
      loading.value = false
      return response
    },
    error => {
      loading.value = false
      console.error('API请求错误:', error)
      return Promise.reject(error)
    }
  )

  // 获取系统信息
  const fetchSystemInfo = async () => {
    try {
      loading.value = true
      error.value = null
      
      const response = await api.get('/')
      systemInfo.value = response.data
      
      return response.data
    } catch (err) {
      error.value = err.message || '获取系统信息失败'
      console.error('获取系统信息失败:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // 获取数据库信息
  const getSystemInfo = async () => {
    try {
      loading.value = true
      error.value = null
      
      const response = await api.get('/db-info')
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取数据库信息失败')
      }
    } catch (err) {
      error.value = err.message || '获取数据库信息失败'
      console.error('获取数据库信息失败:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // 检查系统健康状态
  const checkHealth = async () => {
    try {
      const response = await api.get('/health')
      return response.data
    } catch (err) {
      console.error('健康检查失败:', err)
      return {
        success: false,
        status: 'unhealthy',
        error: err.message
      }
    }
  }

  // 测试数据库连接
  const testDatabaseConnection = async () => {
    try {
      const health = await checkHealth()
      return health.database === 'connected'
    } catch (err) {
      return false
    }
  }

  return {
    systemInfo,
    loading,
    error,
    api,
    fetchSystemInfo,
    getSystemInfo,
    checkHealth,
    testDatabaseConnection
  }
})