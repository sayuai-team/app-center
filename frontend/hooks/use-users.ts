"use client"

import { useState, useEffect, useRef } from 'react'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

interface User {
  id: string
  username: string
  email: string
  role: 'super_admin' | 'admin' | 'user'
  isActive: boolean
  created_by?: string
  created_at: string
  updated_at: string
  last_login?: string
}

interface CreateUserRequest {
  username: string
  email: string
  password: string
  role: 'admin' | 'user'
}

interface UpdateUserRequest {
  username?: string
  email?: string
  password?: string
  role?: 'admin' | 'user'
  isActive?: boolean
}

interface UserStats {
  total: number
  superAdmins: number
  admins: number
  users: number
  active: number
  inactive: number
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  // 获取用户列表
  const fetchUsers = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiRequest('/api/v1/users', {
        method: 'GET'
      })
      
      if (mountedRef.current) {
        setUsers(response.data || [])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      console.error('💥 Fetch users failed:', errorMessage)
      
      if (mountedRef.current) {
        setError(errorMessage)
      }
      throw err
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  // 获取当前用户创建的用户
  const fetchMyUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiRequest('/api/v1/users/my-users', {
        method: 'GET'
      })
      
      if (mountedRef.current) {
        setUsers(response.data || [])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      console.error('💥 Fetch my users failed:', errorMessage)
      
      if (mountedRef.current) {
        setError(errorMessage)
      }
      throw err
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  // 创建新用户
  const createUser = async (userData: CreateUserRequest) => {
    try {
      const result = await apiRequest('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
      
      const newUser = result.data || result
      
      // 刷新用户列表
      await fetchUsers(true)
      
      return newUser
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  // 更新用户信息
  const updateUser = async (id: string, data: UpdateUserRequest) => {
    try {
      setLoading(true)
      
      await apiRequest(`/api/v1/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })

      // 刷新用户列表
      await fetchUsers(true)
      toast.success('用户更新成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新用户时发生未知错误'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 切换用户状态
  const toggleUserStatus = async (id: string) => {
    try {
      setLoading(true)
      
      await apiRequest(`/api/v1/users/${id}/toggle-status`, {
        method: 'POST',
      })

      // 刷新用户列表
      await fetchUsers(true)
      toast.success('用户状态更新成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新用户状态时发生未知错误'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 删除用户
  const deleteUser = async (id: string) => {
    try {
      setLoading(true)
      
      await apiRequest(`/api/v1/users/${id}`, {
        method: 'DELETE',
      })

      // 刷新用户列表
      await fetchUsers(true)
      toast.success('用户删除成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除用户时发生未知错误'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 获取用户统计信息
  const fetchUserStats = async (): Promise<UserStats> => {
    try {
      const response = await apiRequest('/api/v1/users/stats', {
        method: 'GET'
      })
      
      return response.data || {
        total: 0,
        superAdmins: 0,
        admins: 0,
        users: 0,
        active: 0,
        inactive: 0
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch user stats')
    }
  }

  // 根据ID获取用户
  const getUserById = async (id: string): Promise<User | null> => {
    try {
      const response = await apiRequest(`/api/v1/users/${id}`, {
        method: 'GET'
      })
      
      return response.data || null
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch user')
    }
  }

  // 强制刷新
  const refetch = () => fetchUsers(true)

  // 清理函数
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    users,
    loading,
    isLoading: loading,
    error,
    fetchUsers,
    fetchMyUsers,
    refetch,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    fetchUserStats,
    getUserById,
  }
} 