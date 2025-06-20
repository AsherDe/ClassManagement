import api from './api'

export const activityService = {
  // 获取活动列表 (支持分页和多种过滤条件)
  getActivities(params = {}) {
    // params 可包含: page, limit, class_id, activity_type, status
    return api.get('/activities', { params })
  },

  // 获取活动详情
  getActivityById(id) {
    return api.get(`/activities/${id}`)
  },

  // 创建活动
  createActivity(data) {
    return api.post('/activities', data)
  },

  // 更新活动
  updateActivity(id, data) {
    return api.put(`/activities/${id}`, data)
  },

  // 获取活动考勤记录
  getActivityAttendance(id) {
    return api.get(`/activities/${id}/attendance`)
  },

  // 删除活动 (如果后端支持)
  deleteActivity(id) {
    return api.delete(`/activities/${id}`)
  }
}