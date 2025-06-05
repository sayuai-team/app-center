"use client"

import { useState, useEffect } from "react"
import { AppCenterLayout } from "@/components/app-center-layout"
import { AppSidebar } from "@/components/app-sidebar"
import { AppDetails } from "@/components/app-details"
import { SiteHeader } from "@/components/site-header"
import { useApps } from "@/hooks/use-apps"
import { App } from "@app-center/shared"
import { useRouter, usePathname } from "next/navigation"
import { sortedAppCenterActivityItems } from "@/lib/activity-bar-items"
import { useAuth } from "@/hooks/use-auth"

export default function DashboardPage() {
  const { apps, isLoading, error, refetch } = useApps()
  const { userInfo, isLoading: authLoading, isAuthenticated } = useAuth()
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  // 准备用户数据供ActivityBar使用
  const userData = userInfo ? {
    name: userInfo.username,
    email: userInfo.email,
    avatar: "/avatars/default.svg"
  } : null

  // 根据当前路径设置活动的 ActivityBar 项目
  useEffect(() => {
    const currentIndex = sortedAppCenterActivityItems.findIndex(item =>
      pathname === item.path || pathname.startsWith(item.path + '/')
    )
    if (currentIndex !== -1) {
      setCurrentActivityIndex(currentIndex)
    }
  }, [pathname])

  // 检查登录状态
  useEffect(() => {
    console.log('🏠 Dashboard页面加载，检查登录状态...')
    const authToken = localStorage.getItem('authToken')
    const userInfo = localStorage.getItem('userInfo')
    
    console.log('🔑 Token存在:', !!authToken)
    console.log('👤 用户信息存在:', !!userInfo)
    
    if (!authToken) {
      console.log('❌ 未找到认证token，跳转到登录页...')
      router.push('/login')
      return
    }
    
    console.log('✅ 认证检查通过，留在dashboard页面')
  }, [router])

  // 当应用列表更新时，确保选中的应用仍然有效
  useEffect(() => {
    if (apps.length > 0) {
      // 如果没有选中的应用，选择第一个
      if (!selectedApp) {
        setSelectedApp(apps[0])
      } else {
        // 如果有选中的应用，更新为最新的数据
        const updatedApp = apps.find(app => app.id === selectedApp.id)
        if (updatedApp) {
          setSelectedApp(updatedApp)
        } else {
          // 如果选中的应用不在列表中，选择第一个
          setSelectedApp(apps[0])
        }
      }
    } else if (!isLoading && apps.length === 0) {
      // 如果没有应用且不在加载中，跳转到空状态页面
      router.push('/empty')
    }
  }, [apps, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-destructive">Error: {error}</div>
      </div>
    )
  }

  // 如果没有应用，这里不会执行到，因为会在 useEffect 中跳转
  if (apps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    )
  }

  // 确保有选中的应用才渲染主界面
  if (!selectedApp) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <AppCenterLayout
      options={{
        currentSelectedIndex: currentActivityIndex,
        items: sortedAppCenterActivityItems,
        activityBarWidth: 64,
        primarySidebar: {
          preferredSize: 280,
          minSize: 200,
          maxSize: 350
        }
      }}
      user={userData}
      primaryContent={
        <AppSidebar 
          apps={apps} 
          selectedApp={selectedApp} 
          onSelectApp={setSelectedApp}
          onAppUpdate={refetch}
        />
      }
      mainContent={
        <div className="flex flex-1 flex-col">
          <SiteHeader />
          <div className="@container/main flex flex-1 flex-col gap-2 p-4">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <AppDetails app={selectedApp} onAppUpdate={refetch} />
            </div>
          </div>
        </div>
      }
      onViewChange={(index, item) => {
        setCurrentActivityIndex(index)
        // 导航将由 ActivityBar 组件内部处理
      }}
    />
  )
} 