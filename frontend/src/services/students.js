import api from './api'

export const studentService = {
  // 获取学生列表 (支持分页、班级过滤、状态过滤、搜索)
  getStudents(params = {}) {
    // params 可包含: page, limit, class_id, status, search
    return api.get('/students', { params })
  },

  // 获取学生详情
  getStudentById(id) {
    return api.get(`/students/${id}`)
  },

  // 获取学生成绩单
  getStudentTranscript(id) {
    return api.get(`/students/${id}/transcript`)
  },

  // 获取学生考勤记录 (支持日期范围和考勤类型过滤)
  getStudentAttendance(id, params = {}) {
    // params 可包含: start_date, end_date, attendance_type
    return api.get(`/students/${id}/attendance`, { params })
  },

  // 更新学生信息
  updateStudent(id, data) {
    return api.put(`/students/${id}`, data)
  },

  // 获取班级学生排名
  getClassRanking(classId) {
    return api.get(`/students/class/${classId}/ranking`)
  },

  // 批量导入学生
  importStudents(students) {
    return api.post('/students/import', { students })
  },

  // 创建学生 (如果后端支持)
  createStudent(data) {
    return api.post('/students', data)
  },

  // 删除学生 (如果后端支持)
  deleteStudent(id) {
    return api.delete(`/students/${id}`)
  }
}