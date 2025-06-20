import api from './api'

export const statisticsService = {
  // 获取系统概览统计
  getOverview() {
    return api.get('/statistics/overview')
  },

  // 获取班级统计信息
  getClassStatistics(classId) {
    return api.get(`/statistics/class/${classId}`)
  },

  // 获取学生个人统计
  getStudentStatistics(studentId) {
    return api.get(`/statistics/student/${studentId}`)
  },

  // 获取成绩分布统计 (支持多种过滤条件)
  getGradeDistribution(params = {}) {
    // params 可包含: class_id, course_id, semester, academic_year
    return api.get('/statistics/grade-distribution', { params })
  }
}