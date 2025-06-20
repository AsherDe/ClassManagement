import api from './api'

export const authService = {
  // 用户登录
  login(credentials) {
    return api.post('/auth/login', credentials)
  },

  // 用户登出
  logout() {
    return api.post('/auth/logout')
  },

  // 获取用户档案信息 (需要在header中传入user-id)
  getProfile(userId) {
    return api.get('/auth/profile', {
      headers: {
        'user-id': userId
      }
    })
  },

  // 获取当前用户信息 (别名方法，保持向后兼容)
  getCurrentUser() {
    // 从localStorage获取userId或从token中解析
    const userId = this.getCurrentUserId()
    if (userId) {
      return this.getProfile(userId)
    }
    return Promise.reject(new Error('用户未登录'))
  },

  // 从localStorage或token中获取当前用户ID
  getCurrentUserId() {
    // 可以从localStorage获取，或者从JWT token中解析
    return localStorage.getItem('userId')
  },

  // 设置当前用户ID
  setCurrentUserId(userId) {
    if (userId) {
      localStorage.setItem('userId', userId)
    } else {
      localStorage.removeItem('userId')
    }
  },

  // 修改密码 (如果后端支持)
  changePassword(data) {
    return api.put('/auth/change-password', data)
  },

  // 重置密码 (如果后端支持)
  resetPassword(data) {
    return api.post('/auth/reset-password', data)
  }
}