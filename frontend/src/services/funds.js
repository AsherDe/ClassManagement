import api from './api'

export const fundService = {
  // 获取班费记录列表 (支持分页和多种过滤条件)
  getFunds(params = {}) {
    // params 可包含: page, limit, class_id, transaction_type, status, start_date, end_date
    return api.get('/funds', { params })
  },

  // 获取班费汇总信息 (支持日期范围过滤)
  getFundSummary(classId, params = {}) {
    // params 可包含: start_date, end_date
    return api.get(`/funds/summary/${classId}`, { params })
  },

  // 创建班费记录
  createFund(data) {
    return api.post('/funds', data)
  },

  // 审批班费记录 (更新状态和审批人)
  approveFund(id, data) {
    // data 应包含: status, approver_id
    return api.put(`/funds/${id}/approve`, data)
  },

  // 获取班费记录详情 (如果后端支持)
  getFundById(id) {
    return api.get(`/funds/${id}`)
  },

  // 更新班费记录 (如果后端支持)
  updateFund(id, data) {
    return api.put(`/funds/${id}`, data)
  },

  // 删除班费记录 (如果后端支持)
  deleteFund(id) {
    return api.delete(`/funds/${id}`)
  }
}