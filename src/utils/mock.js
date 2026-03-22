// 模拟数据管理
class MockData {
  constructor() {
    this.initData()
  }

  initData() {
    // 用户数据
    this.users = [
      { id: 1, username: 'admin', password: 'admin123', realName: '系统管理员', email: 'admin@example.com', phone: '13800138000', userType: 'normal', status: 1, avatar: null, createTime: '2024-01-01 10:00:00' },
      { id: 2, username: 'manufacturer1', password: '123456', realName: '生产商A', email: 'manu1@example.com', phone: '13800138001', userType: 'supply_chain', status: 1, avatar: null, createTime: '2024-01-02 10:00:00' },
      { id: 3, username: 'logistics1', password: '123456', realName: '物流商B', email: 'log1@example.com', phone: '13800138002', userType: 'supply_chain', status: 1, avatar: null, createTime: '2024-01-03 10:00:00' },
      { id: 4, username: 'regulator1', password: '123456', realName: '监管机构', email: 'reg1@example.com', phone: '13800138003', userType: 'regulator', status: 1, avatar: null, createTime: '2024-01-04 10:00:00' }
    ]

    // 角色数据
    this.roles = [
      { id: 1, roleCode: 'admin', roleName: '系统管理员', description: '拥有所有权限', status: 1, sort: 1 },
      { id: 2, roleCode: 'manufacturer', roleName: '生产商', description: '负责零部件生产', status: 1, sort: 2 },
      { id: 3, roleCode: 'logistics', roleName: '物流商', description: '负责零部件运输', status: 1, sort: 3 },
      { id: 4, roleCode: 'regulator', roleName: '监管机构', description: '负责监管审核', status: 1, sort: 4 }
    ]

    // 权限数据
    this.permissions = [
      { id: 1, permissionCode: 'dashboard', permissionName: '工作台', permissionType: 'menu', parentId: 0, path: '/dashboard', icon: 'DataLine', sort: 1, status: 1 },
      { id: 2, permissionCode: 'user', permissionName: '用户管理', permissionType: 'menu', parentId: 0, path: '/user', icon: 'User', sort: 2, status: 1 },
      { id: 3, permissionCode: 'parts', permissionName: '零部件管理', permissionType: 'menu', parentId: 0, path: '/parts', icon: 'Box', sort: 3, status: 1 },
      { id: 4, permissionCode: 'trace', permissionName: '零部件溯源', permissionType: 'menu', parentId: 0, path: '/trace', icon: 'Connection', sort: 4, status: 1 },
      { id: 5, permissionCode: 'anomaly', permissionName: '异常检测', permissionType: 'menu', parentId: 0, path: '/anomaly', icon: 'Warning', sort: 5, status: 1 },
      { id: 6, permissionCode: 'query', permissionName: '追溯查询', permissionType: 'menu', parentId: 0, path: '/query', icon: 'Search', sort: 6, status: 1 }
    ]

    // 零部件分类
    this.categories = [
      { id: 1, categoryCode: 'CAT001', categoryName: '电子元件', parentId: 0, level: 1, sort: 1, status: 1 },
      { id: 2, categoryCode: 'CAT001001', categoryName: '芯片', parentId: 1, level: 2, sort: 1, status: 1 },
      { id: 3, categoryCode: 'CAT001002', categoryName: '电容', parentId: 1, level: 2, sort: 2, status: 1 },
      { id: 4, categoryCode: 'CAT002', categoryName: '机械零件', parentId: 0, level: 1, sort: 2, status: 1 },
      { id: 5, categoryCode: 'CAT002001', categoryName: '轴承', parentId: 4, level: 2, sort: 1, status: 1 },
      { id: 6, categoryCode: 'CAT002002', categoryName: '齿轮', parentId: 4, level: 2, sort: 2, status: 1 }
    ]

    // 零部件数据
    this.parts = [
      { id: 1, partsCode: 'P20240001', partsName: 'ARM芯片A1', batchNumber: 'B20240101', categoryId: 2, specification: 'ARM Cortex-A72', unit: '个', quantity: 1000, weight: 0.05, material: '硅', manufacturer: '生产商A', manufacturerId: 2, productionDate: '2024-01-15', expiryDate: '2029-01-15', qualityStandard: 'ISO9001', status: 1, creatorId: 2, createTime: '2024-01-15 09:00:00' },
      { id: 2, partsCode: 'P20240002', partsName: '陶瓷电容C1', batchNumber: 'B20240102', categoryId: 3, specification: '100μF/50V', unit: '个', quantity: 5000, weight: 0.01, material: '陶瓷', manufacturer: '生产商A', manufacturerId: 2, productionDate: '2024-01-20', expiryDate: '2034-01-20', qualityStandard: 'ISO9001', status: 1, creatorId: 2, createTime: '2024-01-20 10:00:00' },
      { id: 3, partsCode: 'P20240003', partsName: '精密轴承B1', batchNumber: 'B20240103', categoryId: 5, specification: '6205-2RS', unit: '个', quantity: 500, weight: 0.15, material: '不锈钢', manufacturer: '生产商A', manufacturerId: 2, productionDate: '2024-02-01', expiryDate: '2034-02-01', qualityStandard: 'ISO9001', status: 1, creatorId: 2, createTime: '2024-02-01 11:00:00' }
    ]

    // 溯源事件
    this.events = [
      { id: 1, partsId: 1, partsCode: 'P20240001', eventType: 'production', eventName: '生产完成', eventTime: '2024-01-15 09:00:00', operatorId: 2, operatorName: '生产商A', location: '深圳工厂', description: 'ARM芯片A1生产完成', blockHash: '0x1a2b3c4d5e6f...', txHash: '0xabcdef123456...', status: 1 },
      { id: 2, partsId: 1, partsCode: 'P20240001', eventType: 'quality', eventName: '质检通过', eventTime: '2024-01-15 14:00:00', operatorId: 2, operatorName: '质检员张三', location: '深圳工厂', description: '质检合格，各项指标正常', blockHash: '0x2b3c4d5e6f7a...', txHash: '0xbcdef1234567...', status: 1 },
      { id: 3, partsId: 1, partsCode: 'P20240001', eventType: 'logistics', eventName: '发货', eventTime: '2024-01-16 08:00:00', operatorId: 3, operatorName: '物流商B', location: '深圳仓库', description: '已发往北京', blockHash: '0x3c4d5e6f7a8b...', txHash: '0xcdef12345678...', status: 1 },
      { id: 4, partsId: 1, partsCode: 'P20240001', eventType: 'logistics', eventName: '到货', eventTime: '2024-01-18 10:00:00', operatorId: 3, operatorName: '物流商B', location: '北京仓库', description: '已送达目的地', blockHash: '0x4d5e6f7a8b9c...', txHash: '0xdef123456789...', status: 1 }
    ]

    // 凭证数据
    this.certificates = [
      { id: 1, certificateType: 'production', certificateName: '生产证明', partsId: 1, partsCode: 'P20240001', eventId: 1, issuer: '生产商A', issuerId: 2, issueTime: '2024-01-15 09:30:00', content: '证明ARM芯片A1已按标准生产完成', certificateHash: '0xabc123...', blockHash: '0x1a2b3c...', verified: true, status: 1 },
      { id: 2, certificateType: 'quality', certificateName: '质检报告', partsId: 1, partsCode: 'P20240001', eventId: 2, issuer: '质检部门', issuerId: 2, issueTime: '2024-01-15 14:30:00', content: '质检合格，符合ISO9001标准', certificateHash: '0xdef456...', blockHash: '0x2b3c4d...', verified: true, status: 1 },
      { id: 3, certificateType: 'logistics', certificateName: '流转证明', partsId: 1, partsCode: 'P20240001', eventId: 3, issuer: '物流商B', issuerId: 3, issueTime: '2024-01-16 08:30:00', content: '已从深圳发往北京', certificateHash: '0xghi789...', blockHash: '0x3c4d5e...', verified: true, status: 1 }
    ]

    // 异常规则
    this.rules = [
      { id: 1, ruleName: '质检超时规则', ruleType: 'time', ruleCode: 'RULE001', description: '生产完成后24小时内必须完成质检', condition: '{"eventType":"production","nextEvent":"quality","maxHours":24}', action: '{"alertLevel":"warning","notifyUsers":[2,4]}', status: 1, createTime: '2024-01-01 10:00:00' },
      { id: 2, ruleName: '物流超时规则', ruleType: 'time', ruleCode: 'RULE002', description: '发货后72小时内必须到货', condition: '{"eventType":"logistics_send","nextEvent":"logistics_receive","maxHours":72}', action: '{"alertLevel":"error","notifyUsers":[3,4]}', status: 1, createTime: '2024-01-01 10:00:00' },
      { id: 3, ruleName: '质检不合格规则', ruleType: 'quality', ruleCode: 'RULE003', description: '质检不合格自动预警', condition: '{"eventType":"quality","result":"failed"}', action: '{"alertLevel":"error","notifyUsers":[2,4],"autoStop":true}', status: 1, createTime: '2024-01-01 10:00:00' }
    ]

    // 异常预警
    this.alerts = [
      { id: 1, alertType: 'warning', alertLevel: 'warning', title: '质检即将超时', partsId: 2, partsCode: 'P20240002', ruleId: 1, ruleName: '质检超时规则', description: '零部件P20240002生产已20小时，尚未完成质检', alertTime: '2024-01-21 06:00:00', status: 0, handleTime: null, handler: null, handleResult: null },
      { id: 2, alertType: 'error', alertLevel: 'error', title: '物流超时', partsId: 3, partsCode: 'P20240003', ruleId: 2, ruleName: '物流超时规则', description: '零部件P20240003发货已超过72小时未到货', alertTime: '2024-02-05 08:00:00', status: 1, handleTime: '2024-02-05 10:00:00', handler: '物流商B', handleResult: '已联系确认，预计今日送达' }
    ]

    // 统计数据
    this.stats = {
      totalParts: 3,
      totalEvents: 12,
      totalCertificates: 8,
      totalAlerts: 2,
      unhandledAlerts: 1,
      todayEvents: 5,
      monthEvents: 12,
      qualityPassRate: 98.5
    }
  }

  getMockData(url, method = 'get', data = {}) {
    method = method.toLowerCase()
    
    // 用户登录
    if (url.includes('/user/login') && method === 'post') {
      const user = this.users.find(u => u.username === data.username && u.password === data.password)
      if (user) {
        return {
          code: 200,
          message: '登录成功',
          data: {
            token: 'mock-token-' + user.id,
            userInfo: { ...user, password: undefined }
          },
          mock: true
        }
      }
      return { code: 401, message: '用户名或密码错误', mock: true }
    }

    // 获取用户信息
    if (url.includes('/user/info') && method === 'get') {
      return {
        code: 200,
        data: {
          userInfo: { ...this.users[0], password: undefined },
          permissions: this.permissions.map(p => p.permissionCode)
        },
        mock: true
      }
    }

    // 用户列表
    if (url.includes('/user/list') && method === 'get') {
      return {
        code: 200,
        data: {
          list: this.users.map(u => ({ ...u, password: undefined })),
          total: this.users.length
        },
        mock: true
      }
    }

    // 角色列表
    if (url.includes('/role/list') && method === 'get') {
      return { code: 200, data: { list: this.roles, total: this.roles.length }, mock: true }
    }

    // 权限树
    if (url.includes('/permission/tree') && method === 'get') {
      return { code: 200, data: this.permissions, mock: true }
    }

    // 分类树
    if (url.includes('/parts/category/tree') && method === 'get') {
      return { code: 200, data: this.buildTree(this.categories), mock: true }
    }

    // 分类列表
    if (url.includes('/parts/category/list') && method === 'get') {
      return { code: 200, data: { list: this.categories, total: this.categories.length }, mock: true }
    }

    // 零部件列表
    if (url.includes('/parts/list') && method === 'get') {
      return { code: 200, data: { list: this.parts, total: this.parts.length }, mock: true }
    }

    // 零部件详情
    if (url.includes('/parts/detail/') && method === 'get') {
      const id = parseInt(url.split('/').pop())
      const part = this.parts.find(p => p.id === id)
      return { code: 200, data: part, mock: true }
    }

    // 事件列表
    if (url.includes('/trace/event/list') && method === 'get') {
      return { code: 200, data: { list: this.events, total: this.events.length }, mock: true }
    }

    // 凭证列表
    if (url.includes('/trace/certificate/list') && method === 'get') {
      return { code: 200, data: { list: this.certificates, total: this.certificates.length }, mock: true }
    }

    // 凭证详情
    if (url.includes('/trace/certificate/detail/') && method === 'get') {
      const id = parseInt(url.split('/').pop())
      const cert = this.certificates.find(c => c.id === id)
      return { code: 200, data: cert, mock: true }
    }

    // 溯源查询
    if (url.includes('/trace/query/') && method === 'get') {
      const partsCode = url.split('/').pop()
      const partEvents = this.events.filter(e => e.partsCode === partsCode)
      const partCerts = this.certificates.filter(c => c.partsCode === partsCode)
      const part = this.parts.find(p => p.partsCode === partsCode)
      
      return {
        code: 200,
        data: {
          parts: part,
          events: partEvents,
          certificates: partCerts,
          chain: this.buildTraceChain(partEvents)
        },
        mock: true
      }
    }

    // 规则列表
    if (url.includes('/anomaly/rule/list') && method === 'get') {
      return { code: 200, data: { list: this.rules, total: this.rules.length }, mock: true }
    }

    // 预警列表
    if (url.includes('/anomaly/alert/list') && method === 'get') {
      return { code: 200, data: { list: this.alerts, total: this.alerts.length }, mock: true }
    }

    // 统计数据
    if (url.includes('/anomaly/stats') && method === 'get') {
      return { code: 200, data: this.stats, mock: true }
    }

    // 仪表盘统计
    if (url.includes('/dashboard/stats') && method === 'get') {
      return { code: 200, data: this.stats, mock: true }
    }

    return null
  }

  buildTree(items, parentId = 0) {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: this.buildTree(items, item.id)
      }))
  }

  buildTraceChain(events) {
    return events.map((event, index) => ({
      ...event,
      step: index + 1,
      isLast: index === events.length - 1
    }))
  }
}

export default new MockData()
