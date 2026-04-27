import request from '@/utils/request'

// 获取零部件分类列表
export function getCategoryList(params) {
  return request({
    url: '/parts/category/list',
    method: 'get',
    params
  })
}

// 获取分类树
export function getCategoryTree() {
  return request({
    url: '/parts/category/tree',
    method: 'get'
  })
}

// 创建分类
export function createCategory(data) {
  return request({
    url: '/parts/category/create',
    method: 'post',
    data
  })
}

// 更新分类
export function updateCategory(data) {
  return request({
    url: '/parts/category/update',
    method: 'put',
    data
  })
}

// 删除分类
export function deleteCategory(id) {
  return request({
    url: `/parts/category/delete/${id}`,
    method: 'delete'
  })
}

// 获取零部件列表
export function getPartsList(params) {
  return request({
    url: '/parts/list',
    method: 'get',
    params
  })
}

// 获取零部件详情
export function getPartsDetail(id) {
  return request({
    url: `/parts/detail/${id}`,
    method: 'get'
  })
}

// 创建零部件
export function createParts(data) {
  return request({
    url: '/parts/create',
    method: 'post',
    data
  })
}

// 更新零部件
export function updateParts(data) {
  return request({
    url: '/parts/update',
    method: 'put',
    data
  })
}

// 删除零部件
export function deleteParts(id) {
  return request({
    url: `/parts/delete/${id}`,
    method: 'delete'
  })
}

// 按批次查询单件
export function getPartsUnitsByBatch(batchNumber) {
  return request({
    url: '/parts/units/by-batch',
    method: 'get',
    params: { batchNumber }
  })
}
