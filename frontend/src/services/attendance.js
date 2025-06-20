import api from './api'

export const attendanceService = {
  // 获取考勤记录列表 (支持分页和多种过滤条件)
  getAttendanceList(params = {}) {
    // params 可包含: page, limit, student_id, class_id, attendance_type, status, start_date, end_date
    return api.get('/attendance', { params })
  },

  // 创建考勤记录
  createAttendance(data) {
    return api.post('/attendance', data)
  },

  // 批量创建考勤记录
  batchCreateAttendance(records) {
    return api.post('/attendance/batch', { records })
  },

  // 获取考勤统计
  getAttendanceStatistics(params = {}) {
    // params 可包含: class_id, student_id, start_date, end_date
    return api.get('/attendance/statistics', { params })
  },

  // 更新考勤记录 (如果后端支持)
  updateAttendance(id, data) {
    return api.put(`/attendance/${id}`, data)
  },

  // 删除考勤记录 (如果后端支持)
  deleteAttendance(id) {
    return api.delete(`/attendance/${id}`)
  }
}