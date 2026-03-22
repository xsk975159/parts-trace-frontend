import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import mockData from './mock'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 如果是模拟数据
    if (res.mock) {
      return res
    }
    
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      
      // 401: 未授权
      if (res.code === 401) {
        localStorage.removeItem('token')
        router.push('/login')
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res
  },
  error => {
    console.error('响应错误:', error)
    
    // 使用模拟数据
    if (error.config && error.config.url) {
      let reqData = error.config.params || {}
      if (error.config.data) {
        try {
          reqData = JSON.parse(error.config.data)
        } catch (e) {
          reqData = error.config.data
        }
      }
      const mockResponse = mockData.getMockData(error.config.url, error.config.method, reqData)
      if (mockResponse) {
        return Promise.resolve(mockResponse)
      }
    }
    
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default service
