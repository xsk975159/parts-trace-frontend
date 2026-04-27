import request from '@/utils/request'

// 用户登录
export function login(data) {
  return request({
    url: '/login',
    method: 'post',
    data
  })
}

// 用户注册
export function register(data) {
  return request({
    url: '/register',
    method: 'post',
    data
  })
}

// 获取当前用户信息
export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

// 获取用户列表
export function getUserList(params) {
  return request({
    url: '/user/list',
    method: 'get',
    params
  })
}

// 创建用户
export function createUser(data) {
  return request({
    url: '/user/create',
    method: 'post',
    data
  })
}

// 更新用户
export function updateUser(data) {
  return request({
    url: '/user/update',
    method: 'put',
    data
  })
}

// 删除用户
export function deleteUser(id) {
  return request({
    url: `/user/delete/${id}`,
    method: 'delete'
  })
}

// 启用/禁用用户
export function updateUserStatus(userId, status) {
  return request({
    url: `/admin/user/${userId}/status`,
    method: 'put',
    params: { status }
  })
}

// 获取角色列表
export function getRoleList() {
  return request({
    url: '/role/list',
    method: 'get'
  })
}

// 创建角色
export function createRole(data) {
  return request({
    url: '/role/create',
    method: 'post',
    data
  })
}

// 更新角色
export function updateRole(data) {
  return request({
    url: '/role/update',
    method: 'put',
    data
  })
}

// 删除角色
export function deleteRole(id) {
  return request({
    url: `/role/delete/${id}`,
    method: 'delete'
  })
}

// 为用户分配角色
export function assignRoleToUser(userId, roleId) {
  return request({
    url: '/role/assign',
    method: 'post',
    params: { userId, roleId }
  })
}

// 获取权限列表
export function getPermissionList() {
  return request({
    url: '/permission/list',
    method: 'get'
  })
}

// 获取权限树
export function getPermissionTree() {
  return request({
    url: '/permission/tree',
    method: 'get'
  })
}

// 创建权限
export function createPermission(data) {
  return request({
    url: '/permission/create',
    method: 'post',
    data
  })
}

// 更新权限
export function updatePermission(data) {
  return request({
    url: '/permission/update',
    method: 'put',
    data
  })
}

// 删除权限
export function deletePermission(id) {
  return request({
    url: `/permission/delete/${id}`,
    method: 'delete'
  })
}

// 给角色分配权限
export function assignPermissionsToRole(roleId, permissionIds) {
  return request({
    url: '/permission/assign',
    method: 'post',
    params: { roleId },
    data: permissionIds
  })
}
