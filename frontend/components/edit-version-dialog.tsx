"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Package, Edit3, CheckCircle, Clock } from 'lucide-react'
import { Version } from '@app-center/shared'
import { config } from '@/lib/config'
import { buildApiUrl, apiRequest, API_ENDPOINTS } from '@/lib/api'

interface EditVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  version: Version | null
  onSuccess: () => void
}

export function EditVersionDialog({
  open,
  onOpenChange,
  version,
  onSuccess
}: EditVersionDialogProps) {
  const [formData, setFormData] = useState({
    updateContent: '',
    status: 'active'
  })
  const [isLoading, setIsLoading] = useState(false)

  // 当version变化时更新表单数据
  useEffect(() => {
    if (version) {
      setFormData({
        updateContent: version.updateContent || '',
        status: version.status || 'active'
      })
    }
  }, [version])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!version) return

    setIsLoading(true)
    try {
      await apiRequest(API_ENDPOINTS.VERSIONS.UPDATE(version.appId, version.id), {
        method: 'POST',
        body: JSON.stringify({
          updateContent: formData.updateContent,
          status: formData.status
        }),
      })

      toast.success('版本更新成功！')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('更新版本失败:', error)
      toast.error(error instanceof Error ? error.message : '更新失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    // 重置表单数据
    if (version) {
      setFormData({
        updateContent: version.updateContent || '',
        status: version.status || 'active'
      })
    }
  }

  if (!version) {
    return null
  }

  // 格式化上传时间
  const formatUploadDate = (dateString: string) => {
    try {
      let date: Date;
      
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateString + 'T12:00:00');
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return dateString;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Edit3 className="h-5 w-5 text-primary" />
            </div>
            编辑版本
          </DialogTitle>
          <DialogDescription className="text-base">
            编辑版本 v{version.version} 的更新内容和状态信息
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 版本信息 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Label className="text-base font-medium">版本信息</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">版本号</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 py-2 text-sm font-mono">
                  v{version.version}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">构建号</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 py-2 text-sm font-mono">
                  {version.buildNumber}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">文件大小</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  {version.size || '未知'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">上传时间</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  {formatUploadDate(version.uploadDate)}
                </div>
              </div>
            </div>
          </div>

          {/* 可编辑的字段 */}
          <div className="space-y-4">
            {/* 状态选择 */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                版本状态 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择版本状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>已发布</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="draft">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>草稿</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="archived">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-600" />
                      <span>已归档</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                选择版本的发布状态
              </p>
            </div>

            {/* 更新内容 */}
            <div className="space-y-2">
              <Label htmlFor="updateContent" className="text-sm font-medium">
                更新内容
              </Label>
              <Textarea
                id="updateContent"
                value={formData.updateContent}
                onChange={(e) => setFormData(prev => ({ ...prev, updateContent: e.target.value }))}
                placeholder="请描述此版本的更新内容、新功能或修复的问题..."
                className="min-h-[120px] resize-none"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                描述此版本的更新内容，用户将在下载页面看到这些信息
              </p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel} 
              disabled={isLoading}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? '保存中...' : '保存更改'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 