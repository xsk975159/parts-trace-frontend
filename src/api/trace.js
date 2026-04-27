import request from '@/utils/request'

// 获取事件列表
export function getEventList(params) {
  return request({
    url: '/trace/event/list',
    method: 'get',
    params
  })
}

// 创建事件
export function createEvent(data) {
  return request({
    url: '/trace/event/create',
    method: 'post',
    data
  })
}

// 获取凭证列表
export function getCertificateList(params) {
  return request({
    url: '/trace/certificate/list',
    method: 'get',
    params
  })
}

// 获取凭证详情
export function getCertificateDetail(id) {
  return request({
    url: `/trace/certificate/detail/${id}`,
    method: 'get'
  })
}

// 验证凭证
export function verifyCertificate(id) {
  return request({
    url: `/trace/certificate/verify/${id}`,
    method: 'post'
  })
}

// 查询溯源链
export function queryTraceChain(partsCode) {
  return request({
    url: `/trace/query/${partsCode}`,
    method: 'get'
  })
}

// DID链条查询
export function queryTraceChainByDid(did) {
  return request({
    url: `/trace/chain/${encodeURIComponent(did)}`,
    method: 'get'
  })
}

// 链条校验
export function verifyTraceChainByDid(did) {
  return request({
    url: `/trace/chain/${encodeURIComponent(did)}/verify`,
    method: 'get'
  })
}

// 导出溯源报告
export function exportTraceReport(did, format = 'json') {
  return request({
    url: '/trace/report',
    method: 'get',
    params: { did, format }
  })
}

// 工作台待办任务
export function getWorkbenchTasks(params) {
  return request({
    url: '/trace/workbench/tasks',
    method: 'get',
    params
  })
}

export function getWorkbenchBatches() {
  return request({
    url: '/trace/workbench/batches',
    method: 'get'
  })
}

export function getWorkbenchBatchOverview(batchNumber) {
  return request({
    url: '/trace/workbench/batch-overview',
    method: 'get',
    params: { batchNumber }
  })
}

export function submitWorkbenchBatchAction(data) {
  return request({
    url: '/trace/workbench/batch-action',
    method: 'post',
    data
  })
}

export function getWorkbenchBatchUnits(batchNumber) {
  return request({
    url: '/trace/workbench/batch-units',
    method: 'get',
    params: { batchNumber }
  })
}
