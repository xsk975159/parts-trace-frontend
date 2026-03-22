import request from '@/utils/request'

// 用户登录
export function login(data) {
  return request({
    url: '/api/user/login',
    method: 'post',
    data
  })
}

// 获取用户信息
export function getUserInfo() {
  return request({
    url: '/api/user/info',
    method: 'get'
  })
}

// 获取用户列表
export function getUserList(params) {
  return request({
    url: '/api/user/list',
    method: 'get',
    params
  })
}

// 创建用户
export function createUser(data) {
  return request({
    url: '/api/user/create',
    method: 'post',
    data
  })
}

// 更新用户
export function updateUser(data) {
  return request({
    url: '/api/user/update',
    method: 'put',
    data
  })
}

// 删除用户
export function deleteUser(id) {
  return request({
    url: `/api/user/delete/${id}`,
    method: 'delete'
  })
}

// 获取角色列表
export function getRoleList(params) {
  return request({
    url: '/api/role/list',
    method: 'get',
    params
  })
}

// 创建角色
export function createRole(data) {
  return request({
    url: '/api/role/create',
    method: 'post',
    data
  })
}

// 更新角色
export function updateRole(data) {
  return request({
    url: '/api/role/update',
    method: 'put',
    data
  })
}

// 删除角色
export function deleteRole(id) {
  return request({
    url: `/api/role/delete/${id}`,
    method: 'delete'
  })
}

// 获取权限列表
export function getPermissionList() {
  return request({
    url: '/api/permission/list',
    method: 'get'
  })
}

// 获取权限树
export function getPermissionTree() {
  return request({
    url: '/api/permission/tree',
    method: 'get'
  })
}
