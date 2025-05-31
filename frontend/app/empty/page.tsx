"use client"

import { CreateAppDialog } from "@/components/create-app-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function EmptyPage() {
  const router = useRouter()

  // 检查登录状态
  useEffect(() => {
    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      router.push('/login')
      return
    }
  }, [router])

  const handleAppCreated = () => {
    // 创建应用后跳转回 dashboard
    router.push('/dashboard')
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-lg mb-4">No apps found</div>
        <CreateAppDialog onSuccess={handleAppCreated}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create your first app
          </Button>
        </CreateAppDialog>
      </div>
    </div>
  )
} 