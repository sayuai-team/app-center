"use client"

import React, { useState, useEffect } from "react"
import { AppCenterLayout } from "@/components/app-center-layout"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, usePathname } from "next/navigation"
import { sortedAppCenterActivityItems } from "@/lib/activity-bar-items"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
  sidebarContent?: React.ReactNode
  hideActivityBar?: boolean
  hideSidebar?: boolean
}

export function DashboardLayout({
  children,
  className,
  sidebarContent,
  hideActivityBar = false,
  hideSidebar = false
}: DashboardLayoutProps) {
  const { userInfo, isLoading: authLoading, isAuthenticated } = useAuth()
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
    const currentIndex = sortedAppCenterActivityItems.findIndex(item => {
      // 精确匹配路径
      if (pathname === item.path) {
        return true
      }
      // 子路径匹配
      if (pathname.startsWith(item.path + '/')) {
        return true
      }
      return false
    })
    
    if (currentIndex !== -1) {
      setCurrentActivityIndex(currentIndex)
    }
  }, [pathname])

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !userInfo)) {
      router.push('/login')
      return
    }
  }, [authLoading, isAuthenticated, userInfo, router])

  if (authLoading || !userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (hideActivityBar) {
    // 如果隐藏ActivityBar，直接渲染内容
    return (
      <div className={className}>
        {children}
      </div>
    )
  }

  // 使用完整的AppCenterLayout
  return (
    <AppCenterLayout
      options={{
        currentSelectedIndex: currentActivityIndex,
        items: sortedAppCenterActivityItems,
        activityBarWidth: 64,
        primarySidebar: {
          preferredSize: 280,
          minSize: 200,
          maxSize: 320
        }
      }}
      user={userData}
      primaryContent={hideSidebar ? undefined : sidebarContent}
      mainContent={children}
      onViewChange={(index, item) => {
        setCurrentActivityIndex(index)
        router.push(item.path)
      }}
      className={className}
    />
  )
} 