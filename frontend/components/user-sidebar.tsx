"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, UserPlus, Shield, ShieldCheck, Eye, EyeOff } from "lucide-react"
import { apiRequest } from "@/lib/api"

interface UserStats {
  total: number
  superAdmins: number
  admins: number
  users: number
  active: number
  inactive: number
}

interface UserSidebarProps {
  onCreateUser?: () => void
}

export function UserSidebar({ onCreateUser }: UserSidebarProps) {
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    superAdmins: 0,
    admins: 0,
    users: 0,
    active: 0,
    inactive: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // 获取用户统计
  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest('/api/v1/users/stats', {
        method: 'GET'
      })
      setStats(response.data || stats)
    } catch (error) {
      console.error('获取用户统计失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* 快速操作 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold tracking-tight">快速操作</h3>
            <Button 
              onClick={onCreateUser}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <UserPlus className="h-4 w-4" />
              创建用户
            </Button>
          </div>

          {/* 用户统计 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                用户统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">加载中...</div>
              ) : (
                <>
                  {/* 总数 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">总用户数</span>
                    <Badge variant="outline">{stats.total}</Badge>
                  </div>

                  {/* 按角色分类 */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-medium">按角色</div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3 w-3 text-destructive" />
                          <span className="text-xs">超级管理员</span>
                        </div>
                        <Badge variant="destructive" className="text-xs">{stats.superAdmins}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Shield className="h-3 w-3 text-primary" />
                          <span className="text-xs">管理员</span>
                        </div>
                        <Badge variant="default" className="text-xs">{stats.admins}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">普通用户</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{stats.users}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* 按状态分类 */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-medium">按状态</div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-3 w-3 text-green-600" />
                          <span className="text-xs">启用</span>
                        </div>
                        <Badge variant="default" className="text-xs bg-green-600">{stats.active}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">禁用</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{stats.inactive}</Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 权限说明 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">权限说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground space-y-1">
                <div><strong>超级管理员:</strong> 可管理所有用户和应用</div>
                <div><strong>管理员:</strong> 可创建和管理自己的应用</div>
                <div><strong>普通用户:</strong> 基础权限</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
} 