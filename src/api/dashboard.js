import request from '@/utils/request'

/** 仪表板 / 数据统计 KPI（与 /anomaly/stats 同源数据域，便于页面选用） */
export function getDashboardStats() {
  return request({
    url: '/dashboard/stats',
    method: 'get'
  })
}
