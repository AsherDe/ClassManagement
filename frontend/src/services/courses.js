import api from './api'

export const courseService = {
  // 获取课程列表 (支持分页和多种过滤条件)
  getCourses(params = {}) {
    // params 可包含: page, limit, department, course_type, status, search
    return api.get('/courses', { params })
  },

  // 获取课程详情
  getCourseById(id) {
    return api.get(`/courses/${id}`)
  },

  // 获取课程成绩 (支持学期、学年、班级过滤)
  getCourseGrades(id, params = {}) {
    // params 可包含: semester, academic_year, class_id
    return api.get(`/courses/${id}/grades`, { params })
  },

  // 创建课程 (如果后端支持)
  createCourse(data) {
    return api.post('/courses', data)
  },

  // 更新课程信息 (如果后端支持)
  updateCourse(id, data) {
    return api.put(`/courses/${id}`, data)
  },

  // 删除课程 (如果后端支持)
  deleteCourse(id) {
    return api.delete(`/courses/${id}`)
  }
}