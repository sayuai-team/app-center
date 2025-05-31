"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UserInfo {
  id: string
  username: string
  email: string
  role: string
}

export function useAuth() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 确保在客户端执行
    if (typeof window === 'undefined') return;

    const checkAuth = () => {
      const storedUserInfo = localStorage.getItem('userInfo')
      const storedToken = localStorage.getItem('authToken')
      
      console.log('🔍 useAuth - 检查认证状态:')
      console.log('📄 userInfo:', storedUserInfo)
      console.log('🔑 authToken:', storedToken ? '存在' : '不存在')
      
      if (storedUserInfo && storedToken) {
        try {
          const parsedUserInfo = JSON.parse(storedUserInfo)
          console.log('✅ useAuth - 解析用户信息成功:', parsedUserInfo)
          setUserInfo(parsedUserInfo)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('❌ useAuth - 解析用户信息失败:', error)
          localStorage.removeItem('userInfo')
          localStorage.removeItem('authToken')
          setUserInfo(null)
          setIsAuthenticated(false)
        }
      } else {
        console.log('⚠️ useAuth - 未找到认证信息')
        setUserInfo(null)
        setIsAuthenticated(false)
      }
      
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const logout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('authToken')
    setUserInfo(null)
    setIsAuthenticated(false)
    router.push('/login')
  }

  return {
    userInfo,
    isLoading,
    isAuthenticated,
    logout
  }
} 