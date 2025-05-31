"use client"

import { useState, useEffect, useRef } from 'react'
import { apiRequest, API_ENDPOINTS } from '@/lib/api'
import { Version } from '@app-center/shared'
import { toast } from 'sonner'

// 缓存对象，按appId存储缓存数据
const cache = new Map<string, {
  data: Version[]
  timestamp: number
}>()

// 正在进行的请求Map，用于防重复请求
const ongoingRequests = new Map<string, Promise<Version[]>>()

// 缓存有效期：5秒
const CACHE_DURATION = 5000

export function useVersions(appId: string) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const mountedRef = useRef(true)

  // 获取应用的所有版本
  const fetchVersions = async (forceRefresh = false) => {
    if (!appId) return
    
    // 检查缓存
    if (!forceRefresh) {
      const cached = cache.get(appId)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setVersions(cached.data)
        setLoading(false)
        return cached.data
      }
    }

    // 检查是否已有相同的请求在进行
    if (!forceRefresh && ongoingRequests.has(appId)) {
      try {
        const result = await ongoingRequests.get(appId)!
        if (mountedRef.current) {
          setVersions(result)
          setLoading(false)
        }
        return result
      } catch (err) {
        // 如果共享的请求失败了，继续执行下面的逻辑
      }
    }

    try {
      setLoading(true)
      setError(null)
      
      const requestPromise = apiRequest<{ status: string; data: Version[] }>(
        API_ENDPOINTS.VERSIONS.LIST(appId)
      ).then(data => {
        const result = data.data || data
        
        // 更新缓存
        cache.set(appId, {
          data: result,
          timestamp: Date.now()
        })
        
        return result
      })
      
      // 存储请求Promise用于去重
      ongoingRequests.set(appId, requestPromise)
      
      const result = await requestPromise
      
      if (mountedRef.current) {
        setVersions(result)
      }
      
      return result
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
      throw err
    } finally {
      // 清理请求记录
      ongoingRequests.delete(appId)
      
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  // 创建新版本
  const createVersion = async (versionData: Omit<Version, 'id'>) => {
    try {
      const result = await apiRequest<{ status: string; data: Version }>(
        API_ENDPOINTS.VERSIONS.CREATE(appId), 
        {
          method: 'POST',
          body: JSON.stringify(versionData),
        }
      )
      
      const newVersion = result.data || result
      
      if (mountedRef.current) {
        setVersions(prev => [newVersion, ...prev])
        
        // 更新缓存
        const updatedVersions = [newVersion, ...versions]
        cache.set(appId, {
          data: updatedVersions,
          timestamp: Date.now()
        })
      }
      
      return newVersion
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create version')
    }
  }

  // 更新版本
  const updateVersion = async (versionId: string, data: any) => {
    try {
      setIsLoading(true)
      
      await apiRequest(API_ENDPOINTS.VERSIONS.UPDATE(appId, versionId), {
        method: 'POST',
        body: JSON.stringify(data),
      })

      // 刷新版本列表
      await fetchVersions(true)
      toast.success('版本更新成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新版本时发生未知错误'
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // 删除版本
  const deleteVersion = async (versionId: string) => {
    try {
      setIsLoading(true)
      
      await apiRequest(API_ENDPOINTS.VERSIONS.DELETE(appId, versionId), {
        method: 'POST',
      })

      // 刷新版本列表
      await fetchVersions(true)
      toast.success('版本删除成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除版本时发生未知错误'
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // 强制刷新函数
  const forceRefresh = () => fetchVersions(true)

  // 当 appId 改变时重新获取数据
  useEffect(() => {
    mountedRef.current = true
    fetchVersions()
    
    return () => {
      mountedRef.current = false
    }
  }, [appId])

  return {
    versions,
    loading,
    isLoading,
    error,
    fetchVersions,
    refetch: fetchVersions,
    forceRefresh,
    createVersion,
    updateVersion,
    deleteVersion,
  }
} 