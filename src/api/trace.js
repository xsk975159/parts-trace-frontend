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

// 跨链存证总览（4 链拓扑 + 主链汇聚摘要）
export function getCrossChainOverview(did) {
  return request({
    url: '/trace/cross-chain',
    method: 'get',
    params: did ? { did } : {}
  })
}

// 导出溯源报告
export function exportTraceReport(did, format = 'json') {
  return request({
    url: '/trace/report',
    method: 'get',
    params: { did, format },
    responseType: format === 'csv' ? 'blob' : 'json'
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

// 工作台需要完整批次记录时逐页读取，避免把默认第一页当作完整数据。
export async function getAllEventRecords(params = {}) {
  return collectPages(getEventList, params)
}
export async function getAllCredentialRecords(params = {}) {
  return collectPages(getCertificateList, params)
}
async function collectPages(fetchPage, params) {
  const list = []
  for (let page = 1; ; page++) {
    const response = await fetchPage({ ...params, page, pageSize: 500 })
    const items = response.data?.list || []
    list.push(...items)
    if (!items.length || list.length >= Number(response.data?.total || 0)) return { code: 200, data: { list, total: list.length } }
  }
}
