"use client"

import { App } from "@app-center/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sidebar, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { CreateAppDialog } from "@/components/create-app-dialog"
import { NavUser } from "@/components/nav-user"
import { Smartphone, Monitor, Plus } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface AppSidebarProps {
  apps: App[]
  selectedApp: App
  onSelectApp: (app: App) => void
  onAppUpdate?: () => void
  variant?: "sidebar" | "floating" | "inset"
}

export function AppSidebar({ apps, selectedApp, onSelectApp, onAppUpdate, variant = "sidebar" }: AppSidebarProps) {
  const { userInfo, isLoading, isAuthenticated } = useAuth()

  // 准备用户数据供NavUser组件使用
  const userData = userInfo ? {
    name: userInfo.username,
    email: userInfo.email,
    avatar: "/avatars/default.svg"
  } : {
    name: "Guest",
    email: "guest@example.com", 
    avatar: "/avatars/default.svg"
  }

  console.log('👤 AppSidebar - 当前用户数据:', userData)
  console.log('🔐 AppSidebar - 认证状态:', { isLoading, isAuthenticated })

  return (
    <Sidebar variant={variant}>
      <SidebarContent className="gap-0">
        <div className="px-3 py-4">
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-sm font-semibold tracking-tight">
              应用列表
            </h2>
            <CreateAppDialog onSuccess={onAppUpdate}>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                title="创建新应用"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </CreateAppDialog>
          </div>
          <SidebarMenu className="gap-2">
            {apps.map((app) => (
              <SidebarMenuItem key={app.id}>
                <SidebarMenuButton
                  onClick={() => onSelectApp(app)}
                  isActive={selectedApp.id === app.id}
                  className={`h-auto p-3 justify-start relative group transition-colors duration-150 border ${
                    selectedApp.id === app.id 
                      ? 'bg-muted border-border' 
                      : 'hover:bg-muted/30 border-transparent hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className={`h-10 w-10 flex-shrink-0 border border-border/50 ${
                      app.system === 'iOS' ? 'rounded-lg' : 'rounded-md'
                    }`}>
                      <AvatarImage 
                        src={app.icon} 
                        alt={app.name} 
                        className={app.system === 'iOS' ? 'rounded-lg' : 'rounded-md'} 
                      />
                      <AvatarFallback className={`${
                        app.system === 'iOS' ? 'rounded-lg' : 'rounded-md'
                      } bg-muted`}>
                        {app.system === "iOS" ? (
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="mb-1">
                        <span className={`text-sm truncate block transition-colors duration-150 ${
                          selectedApp.id === app.id 
                            ? 'font-medium text-foreground' 
                            : 'font-normal text-foreground'
                        }`}>
                          {app.name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Badge 
                          variant="secondary"
                          className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground"
                        >
                          {app.system}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter>
        {!isLoading && <NavUser user={userData} />}
      </SidebarFooter>
    </Sidebar>
  )
} 