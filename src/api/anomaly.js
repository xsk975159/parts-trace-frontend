import request from '@/utils/request'

// 获取规则列表
export function getRuleList(params) {
  return request({
    url: '/api/anomaly/rule/list',
    method: 'get',
    params
  })
}

// 创建规则
export function createRule(data) {
  return request({
    url: '/api/anomaly/rule/create',
    method: 'post',
    data
  })
}

// 更新规则
export function updateRule(data) {
  return request({
    url: '/api/anomaly/rule/update',
    method: 'put',
    data
  })
}

// 删除规则
export function deleteRule(id) {
  return request({
    url: `/api/anomaly/rule/delete/${id}`,
    method: 'delete'
  })
}

// 获取预警列表
export function getAlertList(params) {
  return request({
    url: '/api/anomaly/alert/list',
    method: 'get',
    params
  })
}

// 处理预警
export function handleAlert(data) {
  return request({
    url: '/api/anomaly/alert/handle',
    method: 'post',
    data
  })
}

// 获取统计数据
export function getAnomalyStats() {
  return request({
    url: '/api/anomaly/stats',
    method: 'get'
  })
}
