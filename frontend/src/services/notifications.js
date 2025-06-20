import api from './api'

export const notificationService = {
  // 获取通知列表 (支持分页和多种过滤条件)
  getNotifications(params = {}) {
    // params 可包含: page, limit, target_type, target_id, notification_type, priority, is_published
    return api.get('/notifications', { params })
  },

  // 获取通知详情
  getNotificationById(id) {
    return api.get(`/notifications/${id}`)
  },

  // 创建通知
  createNotification(data) {
    return api.post('/notifications', data)
  },

  // 发布通知 (设置发布和过期时间)
  publishNotification(id, data) {
    // data 应包含: publish_time, expire_time
    return api.put(`/notifications/${id}/publish`, data)
  },

  // 获取用户相关通知 (支持分页)
  getUserNotifications(userId, params = {}) {
    // params 可包含: page, limit
    return api.get(`/notifications/user/${userId}`, { params })
  },

  // 更新通知 (如果后端支持)
  updateNotification(id, data) {
    return api.put(`/notifications/${id}`, data)
  },

  // 删除通知 (如果后端支持)
  deleteNotification(id) {
    return api.delete(`/notifications/${id}`)
  },

  // 标记通知为已读 (如果后端支持)
  markAsRead(id) {
    return api.put(`/notifications/${id}/read`)
  }
}