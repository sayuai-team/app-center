"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Smartphone, 
  Monitor, 
  CheckCircle, 
  Upload,
  File,
  Loader2,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { API_ENDPOINTS, apiRequest, apiRequestUpload } from "@/lib/api"

interface AppInfo {
  name: string
  bundleId: string
  versionName: string
  versionCode: string
  platform: string
  icon?: string
}

interface UploadVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appName: string
  appId: string
  onSuccess: () => void
}

type UploadState = 'idle' | 'selected' | 'uploading' | 'parsing' | 'completed' | 'error'

export function UploadVersionDialog({
  open,
  onOpenChange,
  appName,
  appId,
  onSuccess
}: UploadVersionDialogProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedAppInfo, setParsedAppInfo] = useState<AppInfo | null>(null)
  const [fileId, setFileId] = useState<string | null>(null)
  const [versionData, setVersionData] = useState({
    version: '',
    buildNumber: '',
    updateContent: ''
  })
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetDialog = () => {
    setUploadState('idle')
    setSelectedFile(null)
    setParsedAppInfo(null)
    setFileId(null)
    setVersionData({
      version: '',
      buildNumber: '',
      updateContent: ''
    })
    setUploadProgress(0)
    setIsSubmitting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    const allowedTypes = ['.ipa', '.apk']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!allowedTypes.includes(fileExtension)) {
      toast.error('请选择有效的IPA或APK文件')
      return
    }

    // 验证文件大小 (500MB限制)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.warning(`文件大小超过限制，最大支持 ${maxSize / (1024 * 1024)}MB`)
      return
    }

    setSelectedFile(file)
    setUploadState('selected')
    
    // 显示开始上传的信息
    toast.info(`开始上传 ${file.name}...`)
    
    // 自动开始上传
    await handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    setUploadState('uploading')
    setUploadProgress(0)

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const formData = new FormData()
      formData.append('file', file)

      setUploadState('parsing')
      setUploadProgress(100)
      clearInterval(progressInterval)

      // 使用新的文件上传API
      const result = await apiRequestUpload(API_ENDPOINTS.FILES.UPLOAD, formData, {
        requireAuth: false, // 文件上传不需要认证
      })
      
      // 详细调试信息
      console.log('=== 文件上传API响应详情 ===');
      console.log('完整响应:', result);
      console.log('响应类型:', typeof result);
      console.log('是否为对象:', result && typeof result === 'object');
      console.log('fileId 存在:', 'fileId' in result);
      console.log('appInfo 存在:', 'appInfo' in result);
      console.log('data 存在:', 'data' in result);
      
      if (result.data) {
        console.log('result.data:', result.data);
        console.log('result.data.fileId:', result.data.fileId);
        console.log('result.data.appInfo:', result.data.appInfo);
      }
      
      // 检查多种可能的响应格式
      const fileId = result.fileId || result.data?.fileId;
      const appInfo = result.appInfo || result.data?.appInfo;
      
      if (fileId && appInfo) {
        setFileId(fileId)
        setParsedAppInfo(appInfo)
        setVersionData({
          version: appInfo.versionName || '',
          buildNumber: appInfo.versionCode || '',
          updateContent: ''
        })
        setUploadState('completed')
        toast.success('文件上传成功，已自动解析应用信息')
      } else {
        console.error('上传响应格式错误:', { result, fileId, appInfo });
        throw new Error('无法解析应用信息: ' + JSON.stringify({ fileId: !!fileId, appInfo: !!appInfo }))
      }
    } catch (error) {
      setUploadState('error')
      toast.error(error instanceof Error ? error.message : '上传失败')
    }
  }

  const handleConfirm = async () => {
    if (!versionData.version || !versionData.buildNumber) {
      toast.error('请填写版本号和构建号')
      return
    }

    if (!fileId) {
      toast.error('没有有效的文件ID')
      return
    }

    // 防止重复提交
    if (isSubmitting) {
      return
    }

    try {
      setIsSubmitting(true)
      
      // 使用fileId创建版本
      await apiRequest(API_ENDPOINTS.APPS.VERSIONS(appId), {
        method: 'POST',
        body: JSON.stringify({
          fileId: fileId,
          version: versionData.version,
          buildNumber: versionData.buildNumber,
          updateContent: versionData.updateContent,
          confirm: true
        }),
      })

      toast.success('版本创建成功！')
      onSuccess()
      onOpenChange(false)
      resetDialog()
    } catch (error) {
      setIsSubmitting(false) // 恢复状态，允许重试
      toast.error(error instanceof Error ? error.message : '创建版本失败')
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    resetDialog()
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return extension === '.ipa' ? (
      <Smartphone className="h-8 w-8 text-blue-600" />
    ) : (
      <Monitor className="h-8 w-8 text-green-600" />
    )
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getPlatformFromFile = (fileName: string) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return extension === '.ipa' ? 'ios' : 'android'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            上传新版本
          </DialogTitle>
          <DialogDescription>
            为 <span className="font-medium">{appName}</span> 上传新的应用版本
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 应用文件选择区域 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {selectedFile ? (
                getPlatformFromFile(selectedFile.name) === 'ios' ? (
                  <Monitor className="h-4 w-4 text-blue-600" />
                ) : (
                  <Smartphone className="h-4 w-4 text-green-600" />
                )
              ) : (
                <Monitor className="h-4 w-4 text-blue-600" />
              )}
              <Label className="text-sm font-medium">应用文件</Label>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {selectedFile ? (
                <>
                  {uploadState === 'completed' ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    getFileIcon(selectedFile.name)
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadState === 'uploading' && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {uploadState === 'parsing' && (
                      <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                    )}
                    {uploadState === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetDialog()
                        fileInputRef.current?.click()
                      }}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-3 w-3" />
                      重新上传
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    选择文件
                  </Button>
                </>
              )}
            </div>

            {/* 隐藏的文件输入 */}
            <Input
              ref={fileInputRef}
              type="file"
              accept=".ipa,.apk"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 上传进度 */}
            {selectedFile && (uploadState === 'uploading' || uploadState === 'parsing') && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {uploadState === 'uploading' ? '上传中...' : '解析应用信息...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {!selectedFile && (
              <p className="text-xs text-muted-foreground">
                支持 .ipa 和 .apk 文件格式
              </p>
            )}
          </div>

          {/* 应用信息区域 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {selectedFile ? (
                getPlatformFromFile(selectedFile.name) === 'ios' ? (
                  <Smartphone className="h-4 w-4 text-blue-600" />
                ) : (
                  <Monitor className="h-4 w-4 text-green-600" />
                )
              ) : (
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              )}
              <Label className="text-sm font-medium">应用信息</Label>
            </div>
            
            <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0">
                {uploadState === 'completed' && parsedAppInfo?.icon ? (
                  <div className="relative">
                    <img 
                      src={parsedAppInfo.icon} 
                      alt="应用图标" 
                      className="h-12 w-12 rounded-lg border shadow-sm"
                      onError={(e) => {
                        // 图标加载失败时显示默认图标
                        const target = e.target as HTMLImageElement;
                        const platform = parsedAppInfo.platform || 'unknown';
                        if (platform === 'ios') {
                          target.src = "https://via.placeholder.com/60x60/3b82f6/ffffff?text=iOS";
                        } else {
                          target.src = "https://via.placeholder.com/60x60/10b981/ffffff?text=AND";
                        }
                        target.onerror = null; // 防止无限循环
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1">
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {parsedAppInfo.platform === 'ios' ? 'iOS' : 'Android'}
                      </Badge>
                    </div>
                  </div>
                ) : uploadState === 'completed' ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                    {parsedAppInfo?.platform === 'ios' ? (
                      <Smartphone className="h-5 w-5 text-blue-600" />
                    ) : parsedAppInfo?.platform === 'android' ? (
                      <Monitor className="h-5 w-5 text-green-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ) : (
                  <Skeleton className="h-12 w-12 rounded-lg" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                {uploadState === 'completed' && parsedAppInfo ? (
                  <>
                    <div className="font-medium text-base">
                      {parsedAppInfo.name}
                    </div>
                    <div className="text-sm font-mono text-muted-foreground">
                      {parsedAppInfo.bundleId}
                    </div>
                  </>
                ) : (
                  <>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 版本信息 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version" className="text-sm">
                  版本号 <span className="text-destructive">*</span>
                </Label>
                {uploadState === 'completed' ? (
                  <Input
                    id="version"
                    value={versionData.version}
                    onChange={(e) => setVersionData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="例如: 1.2.1"
                    className="font-mono text-sm"
                  />
                ) : (
                  <Skeleton className="h-9 w-full" />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="buildNumber" className="text-sm">
                  构建号 <span className="text-destructive">*</span>
                </Label>
                {uploadState === 'completed' ? (
                  <Input
                    id="buildNumber"
                    value={versionData.buildNumber}
                    onChange={(e) => setVersionData(prev => ({ ...prev, buildNumber: e.target.value }))}
                    placeholder="例如: 124"
                    className="font-mono text-sm"
                  />
                ) : (
                  <Skeleton className="h-9 w-full" />
                )}
              </div>
            </div>
          </div>

          {/* 更新说明 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">版本更新内容</Label>
            {uploadState === 'completed' ? (
              <Textarea
                value={versionData.updateContent}
                onChange={(e) => setVersionData(prev => ({ ...prev, updateContent: e.target.value }))}
                placeholder="请描述此版本的更新内容、新功能或修复的问题..."
                className="min-h-[80px] resize-none text-sm"
              />
            ) : (
              <Skeleton className="h-20 w-full" />
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          {uploadState === 'selected' && (
            <Button onClick={() => handleUpload(selectedFile!)}>
              开始上传
            </Button>
          )}
          {uploadState === 'completed' && (
            <Button 
              onClick={handleConfirm}
              disabled={!versionData.version || !versionData.buildNumber || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? '创建中...' : '确认创建版本'}
            </Button>
          )}
          {uploadState === 'error' && (
            <Button
              onClick={() => {
                resetDialog()
                fileInputRef.current?.click()
              }}
            >
              重新选择文件
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 