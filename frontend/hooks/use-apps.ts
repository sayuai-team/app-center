"use client"

import { useState, useEffect, useRef } from 'react'
import { config } from '@/lib/config'
import { buildApiUrl, apiRequest, API_ENDPOINTS } from '@/lib/api'
import { App } from '@app-center/shared'
import { toast } from 'sonner'

// 简单的缓存机制
let appsCache: App[] | null = null
let fetchPromise: Promise<App[]> | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5000 // 5秒缓存

export function useApps() {
  const [apps, setApps] = useState<App[]>(appsCache || [])
  const [loading, setLoading] = useState(!appsCache)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  // 清理函数
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // 获取所有应用
  const fetchApps = async (retryCount = 0, forceRefresh = false) => {
    const maxRetries = 1
    const now = Date.now()
    
    // 如果有缓存且未过期，且不是强制刷新，直接返回缓存
    if (!forceRefresh && appsCache && (now - lastFetchTime) < CACHE_DURATION) {
      if (mountedRef.current) {
        setApps(appsCache)
        setLoading(false)
        setError(null)
      }
      return appsCache
    }

    // 如果已经有正在进行的请求，等待它完成
    if (fetchPromise && !forceRefresh) {
      try {
        const result = await fetchPromise
        if (mountedRef.current) {
          setApps(result)
          setLoading(false)
          setError(null)
        }
        return result
      } catch (err) {
        // 请求失败，继续执行下面的逻辑
      }
    }
    
    try {
      if (mountedRef.current) {
        setLoading(true)
        setError(null)
      }
      
      console.log('🔍 Fetching apps with auth...', retryCount > 0 ? `(retry ${retryCount})` : '')
      
      // 使用新的apiRequest函数，自动包含认证头
      fetchPromise = apiRequest<{ status: string; data: App[] }>(API_ENDPOINTS.APPS.LIST)
        .then(data => {
          const apps = data.data || data
          console.log('✅ Apps loaded:', apps.length, 'apps')
          
          // 更新缓存
          appsCache = apps
          lastFetchTime = Date.now()
          
          return apps
        })

      const result = await fetchPromise
      
      if (mountedRef.current) {
        setApps(result)
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      console.error('💥 Fetch apps failed:', errorMessage)
      
      // 清除失败的promise
      fetchPromise = null
      
      // 如果是网络错误且还有重试次数，则重试
      if ((errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) && retryCount < maxRetries) {
        console.log(`🔄 Retrying fetch apps in ${(retryCount + 1) * 3000}ms...`)
        setTimeout(() => {
          fetchApps(retryCount + 1, forceRefresh)
        }, (retryCount + 1) * 3000)
        return
      }
      
      if (mountedRef.current) {
        setError(errorMessage)
      }
      throw err
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
      // 清除promise引用
      fetchPromise = null
    }
  }

  // 创建新应用
  const createApp = async (appData: Omit<App, 'id' | 'appKey' | 'downloadKey'> & { downloadKey?: string }) => {
    try {
      const result = await apiRequest<{ status: string; data: App }>(API_ENDPOINTS.APPS.CREATE, {
        method: 'POST',
        body: JSON.stringify(appData),
      })
      
      const newApp = result.data || result
      
      // 刷新缓存
      await fetchApps(0, true)
      
      return newApp
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create app')
    }
  }

  // 更新应用
  const updateApp = async (id: string, data: Partial<App>) => {
    try {
      setLoading(true)
      
      await apiRequest(API_ENDPOINTS.APPS.UPDATE(id), {
        method: 'POST',
        body: JSON.stringify(data),
      })

      // 刷新缓存
      await fetchApps(0, true)
      toast.success('应用更新成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新应用时发生未知错误'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 删除应用
  const deleteApp = async (id: string) => {
    try {
      setLoading(true)
      
      await apiRequest(API_ENDPOINTS.APPS.DELETE(id), {
        method: 'POST',
      })

      // 刷新缓存
      await fetchApps(0, true)
      toast.success('应用删除成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除应用时发生未知错误'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 强制刷新
  const refetch = () => fetchApps(0, true)

  // 初始化时获取数据
  useEffect(() => {
    fetchApps()
  }, [])

  return {
    apps,
    loading,
    isLoading: loading,
    error,
    fetchApps: () => fetchApps(0, true),
    refetch,
    createApp,
    updateApp,
    deleteApp,
  }
} 