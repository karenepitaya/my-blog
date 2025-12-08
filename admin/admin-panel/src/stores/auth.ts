import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest, LoginResponse, GetMeResponse } from '@/types'
import request from '@/api/request'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string>('')
  const user = ref<User | null>(null)
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 初始化：从 localStorage 读取 token
  const initAuth = () => {
    const savedToken = localStorage.getItem('admin_token')
    const savedUser = localStorage.getItem('admin_user')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
    }
  }

  // 登录
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      // 转换参数格式：username -> identifier
      const loginData = {
        identifier: credentials.username,
        password: credentials.password
      }
      
      const response = await request.post<LoginResponse>('/users/login', loginData)
      
      // response 包含server返回的实际数据（已经被拦截器处理过）
      if (response.token && response.user) {
        token.value = response.token
        user.value = response.user
        
        // 保存到 localStorage
        localStorage.setItem('admin_token', response.token)
        localStorage.setItem('admin_user', JSON.stringify(response.user))
        
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  // 登出
  const logout = () => {
    token.value = ''
    user.value = null
    
    // 清除 localStorage
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  // 检查token有效性
  const checkToken = async (): Promise<boolean> => {
    try {
      const response = await request.get<GetMeResponse>('/users/me')
      // response 包含server返回的实际数据（已经被拦截器处理过）
      return !!response.user
    } catch {
      // token 无效，清除认证信息
      logout()
      return false
    }
  }

  return {
    // 状态
    token,
    user,
    // 计算属性
    isLoggedIn,
    isAdmin,
    // 方法
    initAuth,
    login,
    logout,
    checkToken,
  }
})