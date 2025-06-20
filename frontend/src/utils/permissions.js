/**
 * 权限系统工具函数
 */

// 模拟用户登录并设置权限数据（用于测试）
export const mockLogin = () => {
  const mockUser = {
    id: 1000,
    username: 'admin',
    email: 'admin@example.com',
    user_type: 'admin',
    status: 'active',
    avatar_url: null,
    created_at: '2024-01-01 09:00:00'
  }

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

  // 保存到localStorage
  localStorage.setItem('userInfo', JSON.stringify(mockUser))
  localStorage.setItem('userPermissions', JSON.stringify(mockPermissions))
  localStorage.setItem('authToken', 'mock-admin-token')

  return { user: mockUser, permissions: mockPermissions }
}

// 模拟教师登录
export const mockTeacherLogin = () => {
  const mockUser = {
    id: 1001,
    username: 'teacher1',
    email: 'teacher1@example.com',
    user_type: 'teacher',
    status: 'active',
    avatar_url: null,
    created_at: '2024-01-02 09:00:00'
  }

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

  localStorage.setItem('userInfo', JSON.stringify(mockUser))
  localStorage.setItem('userPermissions', JSON.stringify(mockPermissions))
  localStorage.setItem('authToken', 'mock-teacher-token')

  return { user: mockUser, permissions: mockPermissions }
}

// 模拟学生登录
export const mockStudentLogin = () => {
  const mockUser = {
    id: 1005,
    username: 'student1',
    email: 'student1@example.com',
    user_type: 'student',
    status: 'active',
    avatar_url: null,
    created_at: '2024-01-03 09:00:00'
  }

  const mockPermissions = [
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

  localStorage.setItem('userInfo', JSON.stringify(mockUser))
  localStorage.setItem('userPermissions', JSON.stringify(mockPermissions))
  localStorage.setItem('authToken', 'mock-student-token')

  return { user: mockUser, permissions: mockPermissions }
}

// 登出
export const mockLogout = () => {
  localStorage.removeItem('userInfo')
  localStorage.removeItem('userPermissions')
  localStorage.removeItem('authToken')
}

// 检查是否已登录
export const isLoggedIn = () => {
  return !!localStorage.getItem('authToken')
}

// 获取当前用户信息
export const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo')
  const permissions = localStorage.getItem('userPermissions')
  
  return {
    user: userInfo ? JSON.parse(userInfo) : null,
    permissions: permissions ? JSON.parse(permissions) : []
  }
}

// 权限检查辅助函数
export const checkPermission = (permissionKey) => {
  const { permissions } = getCurrentUser()
  return permissions.some(p => p.permission_key === permissionKey && p.is_active)
}

export const checkAnyPermission = (permissionKeys) => {
  const { permissions } = getCurrentUser()
  return permissionKeys.some(key => 
    permissions.some(p => p.permission_key === key && p.is_active)
  )
}

export const checkAllPermissions = (permissionKeys) => {
  const { permissions } = getCurrentUser()
  return permissionKeys.every(key => 
    permissions.some(p => p.permission_key === key && p.is_active)
  )
}

export const checkUserType = (userTypes) => {
  const { user } = getCurrentUser()
  if (!user) return false
  
  const allowedTypes = Array.isArray(userTypes) ? userTypes : [userTypes]
  return allowedTypes.includes(user.user_type)
}

export default {
  mockLogin,
  mockTeacherLogin,
  mockStudentLogin,
  mockLogout,
  isLoggedIn,
  getCurrentUser,
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkUserType
}