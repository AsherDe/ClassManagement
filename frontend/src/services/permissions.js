import api from './api'

// 权限管理相关API
export const permissionsAPI = {
  // 获取所有权限列表 (支持分类和关键词过滤)
  getAllPermissions: (params = {}) => {
    // params 可包含: category, keyword
    return api.get('/permissions', { params })
  },

  // 获取权限分类列表
  getPermissionCategories: () => {
    return api.get('/permissions/categories')
  },

  // 创建权限
  createPermission: (data) => {
    return api.post('/permissions', data)
  },

  // 更新权限
  updatePermission: (id, data) => {
    return api.put(`/permissions/${id}`, data)
  },

  // 删除权限
  deletePermission: (id) => {
    return api.delete(`/permissions/${id}`)
  },

  // 获取所有用户及其权限概览
  getUsersWithPermissions: (params = {}) => {
    return api.get('/permissions/users', { params })
  },

  // 获取指定用户的权限列表
  getUserPermissions: (userId, params = {}) => {
    return api.get(`/permissions/users/${userId}`, { params })
  },

  // 为用户分配单个权限
  assignPermissionToUser: (userId, permissionId, data = {}) => {
    return api.post(`/permissions/users/${userId}/permissions/${permissionId}`, data)
  },

  // 批量为用户分配权限
  batchAssignPermissions: (userId, data) => {
    // data 应包含: permissions (权限ID数组)
    return api.post(`/permissions/users/${userId}/permissions`, data)
  },

  // 撤销用户权限
  revokePermissionFromUser: (userId, permissionId) => {
    return api.delete(`/permissions/users/${userId}/permissions/${permissionId}`)
  },

  // 更新用户权限状态
  updateUserPermissionStatus: (id, data) => {
    return api.put(`/permissions/user-permissions/${id}`, data)
  }
}

// 权限验证工具函数
export const permissionUtils = {
  // 检查用户是否有指定权限
  hasPermission: (userPermissions, permissionKey) => {
    if (!Array.isArray(userPermissions)) return false
    return userPermissions.some(permission => 
      permission.permission_key === permissionKey && permission.is_active
    )
  },

  // 检查用户是否有指定权限中的任一个
  hasAnyPermission: (userPermissions, permissionKeys) => {
    if (!Array.isArray(userPermissions) || !Array.isArray(permissionKeys)) return false
    return permissionKeys.some(key => this.hasPermission(userPermissions, key))
  },

  // 检查用户是否有指定权限中的全部
  hasAllPermissions: (userPermissions, permissionKeys) => {
    if (!Array.isArray(userPermissions) || !Array.isArray(permissionKeys)) return false
    return permissionKeys.every(key => this.hasPermission(userPermissions, key))
  },

  // 按分类组织权限
  groupPermissionsByCategory: (permissions) => {
    if (!Array.isArray(permissions)) return {}
    return permissions.reduce((groups, permission) => {
      const category = permission.category || '其他'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(permission)
      return groups
    }, {})
  },

  // 过滤有效权限
  getActivePermissions: (permissions) => {
    if (!Array.isArray(permissions)) return []
    const now = new Date()
    return permissions.filter(permission => {
      // 检查是否激活
      if (!permission.is_active) return false
      
      // 检查是否过期
      if (permission.expires_at) {
        const expiresAt = new Date(permission.expires_at)
        if (expiresAt <= now) return false
      }
      
      return true
    })
  }
}

// 权限常量定义
export const PERMISSIONS = {
  // 学生管理
  VIEW_STUDENTS: 'view_students',
  EDIT_STUDENTS: 'edit_students',
  
  // 成绩管理
  VIEW_GRADES: 'view_grades',
  INPUT_GRADES: 'input_grades',
  
  // 班级管理
  MANAGE_CLASS: 'manage_class',
  
  // 班费管理
  APPROVE_FUNDS: 'approve_funds',
  
  // 通知管理
  PUBLISH_NOTIFICATION: 'publish_notification',
  
  // 系统管理
  MANAGE_USERS: 'manage_users',
  SYSTEM_SETTINGS: 'system_settings',
  
  // 数据统计
  VIEW_STATISTICS: 'view_statistics'
}

// 权限分组定义
export const PERMISSION_GROUPS = {
  STUDENT_MANAGEMENT: [PERMISSIONS.VIEW_STUDENTS, PERMISSIONS.EDIT_STUDENTS],
  GRADE_MANAGEMENT: [PERMISSIONS.VIEW_GRADES, PERMISSIONS.INPUT_GRADES],
  CLASS_MANAGEMENT: [PERMISSIONS.MANAGE_CLASS],
  FUND_MANAGEMENT: [PERMISSIONS.APPROVE_FUNDS],
  NOTIFICATION_MANAGEMENT: [PERMISSIONS.PUBLISH_NOTIFICATION],
  SYSTEM_MANAGEMENT: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.SYSTEM_SETTINGS],
  STATISTICS: [PERMISSIONS.VIEW_STATISTICS]
}

export default {
  permissionsAPI,
  permissionUtils,
  PERMISSIONS,
  PERMISSION_GROUPS
}