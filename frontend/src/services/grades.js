import api from './api'

export const gradeService = {
  // 获取成绩列表 (支持分页和多种过滤条件)
  getGrades(params = {}) {
    // params 可包含: page, limit, course_id, class_id, semester, academic_year, student_id
    return api.get('/grades', { params })
  },

  // 录入单个成绩
  createGrade(data) {
    return api.post('/grades', data)
  },

  // 批量导入成绩
  batchImportGrades(data) {
    // data 应包含: course_id, semester, academic_year, grades (数组)
    return api.post('/grades/batch-import', data)
  },

  // 更新成绩
  updateGrade(id, data) {
    return api.put(`/grades/${id}`, data)
  },

  // 删除成绩
  deleteGrade(id) {
    return api.delete(`/grades/${id}`)
  },

  // 获取课程成绩统计
  getCourseGradeStatistics(courseId, semester, academicYear) {
    return api.get(`/grades/course/${courseId}/statistics/${semester}/${academicYear}`)
  },

  // 获取班级成绩总览
  getClassGradeOverview(classId, semester, academicYear) {
    return api.get(`/grades/class/${classId}/overview/${semester}/${academicYear}`)
  },

  // 获取成绩分析报告
  getGradeAnalysisReport(courseId, semester, academicYear) {
    return api.get(`/grades/course/${courseId}/analysis/${semester}/${academicYear}`)
  }
}