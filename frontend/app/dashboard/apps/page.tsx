"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AppSidebar } from "@/components/app-sidebar"
import { AppDetails } from "@/components/app-details"
import { SiteHeader } from "@/components/site-header"
import { useApps } from "@/hooks/use-apps"
import { App } from "@app-center/shared"
import { useRouter } from "next/navigation"

export default function AppsPage() {
  const { apps, isLoading, error, refetch } = useApps()
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const router = useRouter()

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
  }, [apps, isLoading, router, selectedApp])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-destructive">Error: {error}</div>
        </div>
      </DashboardLayout>
    )
  }

  // 如果没有应用，这里不会执行到，因为会在 useEffect 中跳转
  if (apps.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Redirecting...</div>
        </div>
      </DashboardLayout>
    )
  }

  // 确保有选中的应用才渲染主界面
  if (!selectedApp) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      sidebarContent={
        <AppSidebar 
          apps={apps} 
          selectedApp={selectedApp} 
          onSelectApp={setSelectedApp}
          onAppUpdate={refetch}
        />
      }
    >
      <div className="flex flex-1 flex-col min-w-0">
        <SiteHeader />
        <div className="@container/main flex flex-1 flex-col gap-2 p-4 overflow-auto">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 min-w-fit">
            <AppDetails app={selectedApp} onAppUpdate={refetch} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 