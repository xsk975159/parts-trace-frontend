import request from '@/utils/request'

// 获取事件列表
export function getEventList(params) {
  return request({
    url: '/api/trace/event/list',
    method: 'get',
    params
  })
}

// 创建事件
export function createEvent(data) {
  return request({
    url: '/api/trace/event/create',
    method: 'post',
    data
  })
}

// 获取凭证列表
export function getCertificateList(params) {
  return request({
    url: '/api/trace/certificate/list',
    method: 'get',
    params
  })
}

// 获取凭证详情
export function getCertificateDetail(id) {
  return request({
    url: `/api/trace/certificate/detail/${id}`,
    method: 'get'
  })
}

// 验证凭证
export function verifyCertificate(id) {
  return request({
    url: `/api/trace/certificate/verify/${id}`,
    method: 'post'
  })
}

// 查询溯源链
export function queryTraceChain(partsCode) {
  return request({
    url: `/api/trace/query/${partsCode}`,
    method: 'get'
  })
}
