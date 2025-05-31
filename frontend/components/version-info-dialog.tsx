"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Package, Smartphone, Monitor, CheckCircle, Edit3, FileText, Image } from "lucide-react"

interface AppInfo {
  name: string
  bundleId: string
  versionName: string
  versionCode: string
  platform: string
  icon?: string
}

interface VersionInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appInfo: AppInfo | null
  onConfirm: (versionData: {
    version: string
    buildNumber: string
    updateContent: string
  }) => void
  onCancel: () => void
  isLoading?: boolean
}

export function VersionInfoDialog({
  open,
  onOpenChange,
  appInfo,
  onConfirm,
  onCancel,
  isLoading = false
}: VersionInfoDialogProps) {
  const [versionData, setVersionData] = useState({
    version: '',
    buildNumber: '',
    updateContent: ''
  })

  const [isEditing, setIsEditing] = useState(false)

  // 当appInfo变化时更新表单数据
  useEffect(() => {
    if (appInfo) {
      setVersionData({
        version: appInfo.versionName || '',
        buildNumber: appInfo.versionCode || '',
        updateContent: ''
      })
    }
  }, [appInfo])

  const handleConfirm = () => {
    onConfirm(versionData)
  }

  const handleCancel = () => {
    onCancel()
    setIsEditing(false)
  }

  if (!appInfo) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            版本信息确认
          </DialogTitle>
          <DialogDescription className="text-base">
            我们已从您上传的文件中自动解析出以下信息，请确认或修改后继续。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 应用信息卡片 */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  {appInfo.platform === 'ios' ? (
                    <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Monitor className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
                应用信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 应用图标和基本信息 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {appInfo.icon ? (
                    <div className="relative">
                      <img 
                        src={appInfo.icon} 
                        alt="应用图标" 
                        className="h-16 w-16 rounded-xl border-2 border-border shadow-sm"
                      />
                      <div className="absolute -bottom-1 -right-1">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {appInfo.platform === 'ios' ? 'iOS' : 'Android'}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted">
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">应用名称</Label>
                    <div className="mt-1">
                      <span className="text-lg font-semibold">{appInfo.name || '未知应用'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Bundle ID</Label>
                    <div className="mt-1">
                      <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                        {appInfo.bundleId || '未知'}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* 版本信息 */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  版本信息
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 text-sm"
                >
                  <Edit3 className="h-4 w-4" />
                  {isEditing ? '完成编辑' : '编辑'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version" className="text-sm font-medium">
                    版本号 <span className="text-destructive">*</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="version"
                      value={versionData.version}
                      onChange={(e) => setVersionData(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="例如: 1.2.1"
                      className="font-mono"
                    />
                  ) : (
                    <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-mono">
                      {versionData.version || '未设置'}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buildNumber" className="text-sm font-medium">
                    构建号 <span className="text-destructive">*</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="buildNumber"
                      value={versionData.buildNumber}
                      onChange={(e) => setVersionData(prev => ({ ...prev, buildNumber: e.target.value }))}
                      placeholder="例如: 124"
                      className="font-mono"
                    />
                  ) : (
                    <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-mono">
                      {versionData.buildNumber || '未设置'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 更新说明 */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                更新说明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="updateContent" className="text-sm font-medium">
                  版本更新内容
                </Label>
                <Textarea
                  id="updateContent"
                  value={versionData.updateContent}
                  onChange={(e) => setVersionData(prev => ({ ...prev, updateContent: e.target.value }))}
                  placeholder="请描述此版本的更新内容、新功能或修复的问题..."
                  className="min-h-[100px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  可选填写，用于向用户说明此版本的更新内容
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            取消
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || !versionData.version || !versionData.buildNumber}
            className="min-w-[120px]"
          >
            {isLoading ? '创建中...' : '确认创建版本'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 