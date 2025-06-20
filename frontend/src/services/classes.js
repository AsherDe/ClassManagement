import api from './api'

export const classService = {
  // 获取班级列表 (支持分页和多种过滤条件)
  getClasses(params = {}) {
    // params 可包含: page, limit, department, grade_level, status, search
    return api.get('/classes', { params })
  },

  // 获取班级详情
  getClassById(id) {
    return api.get(`/classes/${id}`)
  },

  // 创建班级
  createClass(data) {
    return api.post('/classes', data)
  },

  // 更新班级信息
  updateClass(id, data) {
    return api.put(`/classes/${id}`, data)
  },

  // 获取班级学生列表 (支持分页和状态过滤)
  getClassStudents(id, params = {}) {
    // params 可包含: page, limit, status
    return api.get(`/classes/${id}/students`, { params })
  },

  // 删除班级 (如果后端支持)
  deleteClass(id) {
    return api.delete(`/classes/${id}`)
  }
}