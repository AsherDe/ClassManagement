/**
 * 权限验证指令
 * 简化版本，通过全局属性访问权限信息
 */

// 获取用户权限的辅助函数
function getUserPermissions() {
  // 从localStorage获取用户权限（临时方案）
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const permissions = JSON.parse(localStorage.getItem('userPermissions') || '[]')
  
  return {
    userType: userInfo.user_type,
    permissions: permissions.filter(p => p.is_active)
  }
}

/**
 * 权限验证指令
 * 用法：v-permission="'view_students'" 或 v-permission="['view_students', 'edit_students']"
 */
const permission = {
  mounted(el, binding) {
    const { value } = binding
    const { permissions } = getUserPermissions()

    if (value) {
      let hasPermission = false

      if (Array.isArray(value)) {
        // 数组形式：检查是否有任一权限
        hasPermission = permissions.some(perm => 
          value.includes(perm.permission_key)
        )
      } else {
        // 字符串形式：检查单个权限
        hasPermission = permissions.some(perm => 
          perm.permission_key === value
        )
      }

      if (!hasPermission) {
        // 移除元素
        el.parentNode && el.parentNode.removeChild(el)
      }
    }
  },

  updated(el, binding) {
    // 当权限发生变化时重新检查
    const { value } = binding
    const { permissions } = getUserPermissions()

    if (value) {
      let hasPermission = false

      if (Array.isArray(value)) {
        hasPermission = permissions.some(perm => 
          value.includes(perm.permission_key)
        )
      } else {
        hasPermission = permissions.some(perm => 
          perm.permission_key === value
        )
      }

      if (!hasPermission) {
        el.style.display = 'none'
      } else {
        el.style.display = ''
      }
    }
  }
}

/**
 * 权限验证指令（所有权限）
 * 用法：v-permission-all="['view_students', 'edit_students']"
 */
const permissionAll = {
  mounted(el, binding) {
    const { value } = binding
    const { permissions } = getUserPermissions()

    if (Array.isArray(value)) {
      const userPermissionKeys = permissions.map(perm => perm.permission_key)
      const hasAllPermissions = value.every(key => userPermissionKeys.includes(key))
      
      if (!hasAllPermissions) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    }
  },

  updated(el, binding) {
    const { value } = binding
    const { permissions } = getUserPermissions()

    if (Array.isArray(value)) {
      const userPermissionKeys = permissions.map(perm => perm.permission_key)
      const hasAllPermissions = value.every(key => userPermissionKeys.includes(key))
      
      if (!hasAllPermissions) {
        el.style.display = 'none'
      } else {
        el.style.display = ''
      }
    }
  }
}

/**
 * 用户类型验证指令
 * 用法：v-user-type="'admin'" 或 v-user-type="['admin', 'teacher']"
 */
const userType = {
  mounted(el, binding) {
    const { value } = binding
    const { userType: currentUserType } = getUserPermissions()

    if (value && currentUserType) {
      let hasAccess = false

      if (Array.isArray(value)) {
        hasAccess = value.includes(currentUserType)
      } else {
        hasAccess = value === currentUserType
      }

      if (!hasAccess) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    }
  },

  updated(el, binding) {
    const { value } = binding
    const { userType: currentUserType } = getUserPermissions()

    if (value && currentUserType) {
      let hasAccess = false

      if (Array.isArray(value)) {
        hasAccess = value.includes(currentUserType)
      } else {
        hasAccess = value === currentUserType
      }

      if (!hasAccess) {
        el.style.display = 'none'
      } else {
        el.style.display = ''
      }
    }
  }
}

export default {
  permission,
  permissionAll,
  userType
}