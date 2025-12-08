import axios, { type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 重新定义请求方法，正确处理类型
interface CustomInstance {
  get<T = any>(url: string, config?: any): Promise<T>
  post<T = any>(url: string, data?: any, config?: any): Promise<T>
  put<T = any>(url: string, data?: any, config?: any): Promise<T>
  delete<T = any>(url: string, config?: any): Promise<T>
}

// 类型断言，让TypeScript知道我们的拦截器会返回response.data
const typedRequest = request as any as CustomInstance

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加 token
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 直接返回响应数据，让具体的API函数处理数据结构
    return response.data as any
  },
  (error) => {
    console.error('响应错误:', error)
    
    if (error.response?.status === 401) {
      // token 过期或无效，跳转到登录页
      const authStore = useAuthStore()
      authStore.logout()
      window.location.href = '/login'
    } else if (error.response?.data?.message) {
      // 显示server返回的错误信息
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('网络错误，请稍后重试')
    }
    
    return Promise.reject(error)
  }
)

export default typedRequest