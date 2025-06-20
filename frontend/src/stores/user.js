import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { permissionUtils, permissionsAPI } from '@/services/permissions'
import { getAuthToken, clearAuthToken } from '@/services'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const permissions = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const isLoggedIn = computed(() => !!userInfo.value)
  const isAdmin = computed(() => userInfo.value?.user_type === 'admin')
  const isTeacher = computed(() => userInfo.value?.user_type === 'teacher')
  const isStudent = computed(() => userInfo.value?.user_type === 'student')
  
  // 活跃权限（排除过期和禁用的）
  const activePermissions = computed(() => {
    return permissionUtils.getActivePermissions(permissions.value)
  })

  // 按分类分组的权限
  const permissionsByCategory = computed(() => {
    return permissionUtils.groupPermissionsByCategory(activePermissions.value)
  })

  // 设置用户信息
  const setUserInfo = (info) => {
    userInfo.value = info
    // 同步到localStorage供权限指令使用
    if (info) {
      localStorage.setItem('userInfo', JSON.stringify(info))
    } else {
      localStorage.removeItem('userInfo')
    }
  }

  // 设置用户权限
  const setPermissions = (perms) => {
    permissions.value = perms || []
    // 同步到localStorage供权限指令使用
    localStorage.setItem('userPermissions', JSON.stringify(perms || []))
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      loading.value = true
      error.value = null

      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      // 这里应该调用获取用户信息的API
      // const response = await authAPI.getUserInfo()
      // setUserInfo(response.data)
      
      // 暂时使用模拟数据
      const mockUserInfo = {
        id: 1000,
        username: 'admin',
        email: 'admin@example.com',
        user_type: 'admin',
        status: 'active',
        avatar_url: null,
        created_at: '2024-01-01 09:00:00'
      }
      
      setUserInfo(mockUserInfo)
      await fetchUserPermissions()
      
      return mockUserInfo
    } catch (err) {
      error.value = err.message || '获取用户信息失败'
      console.error('获取用户信息失败:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // 获取用户权限
  const fetchUserPermissions = async () => {
    try {
      if (!userInfo.value?.id) {
        console.warn('用户ID不存在，无法获取权限')
        return []
      }

      // const response = await permissionsAPI.getUserPermissions(userInfo.value.id)
      // setPermissions(response.data.permissions)
      
      // 暂时使用模拟数据
      const mockPermissions = [
        {
          id: 1,
          permission_id: 1,
          permission_name: '查看学生信息',
          permission_key: 'view_students',
          category: '学生管理',
          is_active: true,
          granted_at: '2024-01-01 10:00:00',
          expires_at: null
        },
        {
          id: 2,
          permission_id: 2,
          permission_name: '编辑学生信息',
          permission_key: 'edit_students',
          category: '学生管理',
          is_active: true,
          granted_at: '2024-01-01 10:00:00',
          expires_at: null
        },
        {
          id: 3,
          permission_id: 3,
          permission_name: '录入成绩',
          permission_key: 'input_grades',
          category: '成绩管理',
          is_active: true,
          granted_at: '2024-01-01 10:00:00',
          expires_at: null
        },
        {
          id: 4,
          permission_id: 4,
          permission_name: '查看成绩',
          permission_key: 'view_grades',
          category: '成绩管理',
          is_active: true,
          granted_at: '2024-01-01 10:00:00',
          expires_at: null
        },
        {
          id: 5,
          permission_id: 5,
          permission_name: '管理班级',
          permission_key: 'manage_class',
          category: '班级管理',
          is_active: true,
          granted_at: '2024-01-01 10:00:00',
          expires_at: null
        },
        {
          id: 6,
          permission_id: 6,
          permission_name: '审批班费',
          permission_key: 'approve_funds',
          category: '班费管理',
          is_active: true,
          granted_at: '2024-01-01 10:00:00',
          expires_at: null
        },
        {
          id: 7,
          permission_id: 7,
          permission_name: '发布通知',
          permission_key: 'publish_notification',
          category: '通知管理',
          is_active: true,
          granted_at: '2024-01-01 10:00:00',
          expires_at: null
        },
        {
          id: 8,
          permission_id: 8,
          permission_name: '管理用户',
          permission_key: 'manage_users',
          category: '系统管理',
          is_active: true,
          granted_at: '2024-01-01 10:00:00',
          expires_at: null
        },
        {
          id: 9,
          permission_id: 9,
          permission_name: '系统设置',
          permission_key: 'system_settings',
          category: '系统管理',
          is_active: true,
          granted_at: '2024-01-01 10:00:00',
          expires_at: null
        },
        {
          id: 10,
          permission_id: 10,
          permission_name: '数据统计',
          permission_key: 'view_statistics',
          category: '数据统计',
          is_active: true,
          granted_at: '2024-01-01 10:00:00',
          expires_at: null
        }
      ]
      
      setPermissions(mockPermissions)
      return mockPermissions
    } catch (err) {
      console.error('获取用户权限失败:', err)
      return []
    }
  }

  // 检查是否有指定权限
  const hasPermission = (permissionKey) => {
    return permissionUtils.hasPermission(activePermissions.value, permissionKey)
  }

  // 检查是否有任一权限
  const hasAnyPermission = (permissionKeys) => {
    return permissionUtils.hasAnyPermission(activePermissions.value, permissionKeys)
  }

  // 检查是否有全部权限
  const hasAllPermissions = (permissionKeys) => {
    return permissionUtils.hasAllPermissions(activePermissions.value, permissionKeys)
  }

  // 登录
  const login = async (credentials) => {
    try {
      loading.value = true
      error.value = null

      // 这里应该调用登录API
      // const response = await authAPI.login(credentials)
      // setToken(response.data.token)
      
      // 登录成功后获取用户信息和权限
      await fetchUserInfo()
      
      return true
    } catch (err) {
      error.value = err.message || '登录失败'
      console.error('登录失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      // 清除本地数据
      userInfo.value = null
      permissions.value = []
      error.value = null
      
      // 清除localStorage中的用户信息和权限
      localStorage.removeItem('userInfo')
      localStorage.removeItem('userPermissions')
      
      // 清除认证令牌
      clearAuthToken()
      
      // 这里可以调用登出API
      // await authAPI.logout()
      
      return true
    } catch (err) {
      console.error('登出失败:', err)
      return false
    }
  }

  // 刷新权限
  const refreshPermissions = async () => {
    if (userInfo.value?.id) {
      await fetchUserPermissions()
    }
  }

  // 更新用户信息
  const updateUserInfo = async (updates) => {
    try {
      loading.value = true
      error.value = null

      // 这里应该调用更新用户信息的API
      // const response = await userAPI.updateProfile(updates)
      // setUserInfo(response.data)
      
      // 暂时直接更新本地数据
      if (userInfo.value) {
        Object.assign(userInfo.value, updates)
      }
      
      return true
    } catch (err) {
      error.value = err.message || '更新用户信息失败'
      console.error('更新用户信息失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // 初始化用户状态（应用启动时调用）
  const initializeUser = async () => {
    const token = getAuthToken()
    if (token) {
      await fetchUserInfo()
    }
  }

  return {
    // 状态
    userInfo,
    permissions,
    loading,
    error,
    
    // 计算属性
    isLoggedIn,
    isAdmin,
    isTeacher,
    isStudent,
    activePermissions,
    permissionsByCategory,
    
    // 方法
    setUserInfo,
    setPermissions,
    fetchUserInfo,
    fetchUserPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    login,
    logout,
    refreshPermissions,
    updateUserInfo,
    initializeUser
  }
})