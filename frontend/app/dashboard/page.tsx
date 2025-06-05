"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  // 默认重定向到应用管理页面
  useEffect(() => {
    router.replace('/dashboard/apps')
  }, [router])

  return null
} 