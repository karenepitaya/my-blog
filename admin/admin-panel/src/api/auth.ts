import request from '@/api/request'
import type { User } from '@/types'

// 登录 - 使用服务器实际的API格式
export const login = async (credentials: { identifier: string, password: string }) => {
  const response = await request.post('/users/login', credentials)
  return response // 返回格式: {message, token, user}
}

// 获取当前用户信息
export const getCurrentUser = async (): Promise<User> => {
  const response = await request.get('/users/me')
  return response.data.user
}

// 登出 (服务器端没有专门的登出API，通过清除token实现)
export const logout = async (): Promise<void> => {
  // 前端实现，无需调用服务器
  return Promise.resolve()
}