"use client"

import { useState, useEffect } from "react"
import QRCode from 'qrcode'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { App, Version } from "@app-center/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Calendar, Package, Smartphone, Monitor, MoreHorizontal, CheckCircle, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, QrCode, Copy, ExternalLink, Edit, Trash2 } from "lucide-react"
import { useVersions } from "@/hooks/use-versions"
import { UploadVersionDialog } from "@/components/upload-version-dialog"
import { EditVersionDialog } from "@/components/edit-version-dialog"
import { toast } from "sonner"
import { copyWithFeedback } from "@/lib/clipboard"
import { CreateAppDialog } from "@/components/create-app-dialog"

interface AppDetailsProps {
  app: App
  onAppUpdate?: () => void
}

export function AppDetails({ app, onAppUpdate }: AppDetailsProps) {
  const { versions, isLoading, deleteVersion, updateVersion } = useVersions(app.id)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  })

  // 生成二维码
  useEffect(() => {
    const generateQRCode = async () => {
      const downloadPageUrl = `${window.location.origin}/${app.downloadKey}`
      try {
        const qrDataUrl = await QRCode.toDataURL(downloadPageUrl, {
          width: 160,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        })
        setQrCodeDataUrl(qrDataUrl)
      } catch (error) {
        console.error('生成二维码失败:', error)
        setQrCodeDataUrl('')
      }
    }

    generateQRCode()
  }, [app.downloadKey])

  // 格式化上传时间
  const formatUploadDate = (dateString: string) => {
    try {
      let date: Date;
      
      // 检查是否是只有日期的格式 (YYYY-MM-DD)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // 对于只有日期的格式，添加默认时间避免时区问题
        date = new Date(dateString + 'T12:00:00');
      } else {
        // 完整的ISO时间格式
        date = new Date(dateString);
      }
      
      // 检查日期是否有效
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

  // 分页逻辑
  // 过滤掉无效的版本记录
  const validVersions = versions.filter(version => 
    version && 
    version.id && 
    version.version && 
    version.buildNumber && 
    version.uploadDate
  )
  
  const totalItems = validVersions.length
  const totalPages = Math.ceil(totalItems / pagination.pageSize)
  const startIndex = pagination.pageIndex * pagination.pageSize
  const endIndex = startIndex + pagination.pageSize
  const currentPageData = validVersions.slice(startIndex, endIndex)

  const canPreviousPage = pagination.pageIndex > 0
  const canNextPage = pagination.pageIndex < totalPages - 1

  const goToFirstPage = () => setPagination(prev => ({ ...prev, pageIndex: 0 }))
  const goToPreviousPage = () => setPagination(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))
  const goToNextPage = () => setPagination(prev => ({ ...prev, pageIndex: Math.min(totalPages - 1, prev.pageIndex + 1) }))
  const goToLastPage = () => setPagination(prev => ({ ...prev, pageIndex: totalPages - 1 }))
  const setPageSize = (size: number) => setPagination(prev => ({ ...prev, pageSize: size, pageIndex: 0 }))

  const handleUploadSuccess = () => {
    // 刷新版本列表或其他成功后的操作
    toast.success('版本上传成功！')
    onAppUpdate?.()
  }

  const handleCopyUrl = async () => {
    const downloadPageUrl = `${window.location.origin}/${app.downloadKey}`
    await copyWithFeedback(
      downloadPageUrl,
      () => toast.success('下载页面链接已复制到剪贴板'),
      (error) => toast.error(error)
    )
  }

  const handleDownload = (version: Version) => {
    if (version.downloadUrl) {
      window.open(version.downloadUrl, '_blank')
    }
  }

  const handleDeleteVersion = async (versionId: string) => {
    if (confirm('确定要删除这个版本吗？此操作不可撤销！')) {
      try {
        await deleteVersion(versionId)
        toast.success('版本删除成功')
        
        // 尝试刷新应用信息，但不因为刷新失败而影响删除的成功状态
        try {
          onAppUpdate?.()
        } catch (refreshError) {
          console.warn('删除版本后刷新应用信息失败:', refreshError)
          // 静默处理刷新失败，不显示错误给用户
        }
      } catch (error) {
        console.error('删除版本失败:', error)
        toast.error(error instanceof Error ? error.message : '删除失败')
      }
    }
  }

  const handleEditVersion = (version: Version) => {
    setSelectedVersion(version)
    setIsEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    // 刷新版本列表
    onAppUpdate?.()
  }

  return (
    <div className="px-4 lg:px-6 min-w-0 w-full">
      {/* 页面标题区域 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-8">
        <div className="flex items-start space-x-4 min-w-0">
          {/* 二维码区域 */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center p-2 bg-white rounded border">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="下载二维码" 
                  className="w-20 h-20 lg:w-24 lg:h-24 rounded"
                />
              ) : (
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-100 rounded flex items-center justify-center">
                  <QrCode className="h-8 w-8 lg:h-10 lg:w-10 text-gray-400" />
                </div>
              )}
            </div>
          </div>
          {/* 标题和链接区域 */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">{app.name}</h2>
            <p className="text-muted-foreground mt-2 text-sm lg:text-base">
              App Key: {app.appKey}
            </p>
            {/* 下载链接区域 */}
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 text-xs lg:text-sm font-mono bg-muted px-2 lg:px-3 py-2 rounded truncate min-w-0">
                  {`${window.location.origin}/${app.downloadKey}`}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={handleCopyUrl}
                  title="复制链接"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={() => window.open(`/${app.downloadKey}`, '_blank')}
                  title="在新窗口打开"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <CreateAppDialog mode="edit" app={app} onSuccess={onAppUpdate}>
            <Button variant="outline" size="sm">
              编辑应用
            </Button>
          </CreateAppDialog>
          <Button onClick={() => setIsUploadDialogOpen(true)} size="sm">
            上传新版本
          </Button>
          <UploadVersionDialog
            open={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
            appName={app.name}
            appId={app.id}
            onSuccess={handleUploadSuccess}
          />
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs mb-8 sm:grid-cols-2 md:grid-cols-4">
        <Card className="@container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">应用名称</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              <div className="text-2xl font-bold">{app.appName || app.name}</div>
              <Badge variant="outline" className="text-xs text-muted-foreground px-2 py-0.5">
                {app.system}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="@container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">当前版本</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">v{app.version}</div>
            <p className="text-xs text-muted-foreground mt-1">
              构建号 {app.buildNumber}
            </p>
          </CardContent>
        </Card>
        <Card className="@container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Bundle ID</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm font-bold break-all">{app.bundleId}</div>
          </CardContent>
        </Card>
        <Card className="@container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">上传时间</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold">{formatUploadDate(app.uploadDate)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              最后更新
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 版本历史表格 */}
      <div className="space-y-6">
        <div>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="pl-6">版本号</TableHead>
                  <TableHead>构建号</TableHead>
                  <TableHead>平台</TableHead>
                  <TableHead>更新内容</TableHead>
                  <TableHead>上传时间</TableHead>
                  <TableHead>文件大小</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right pr-6">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : currentPageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      暂无版本记录
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPageData.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-medium pl-6">v{version.version || 'N/A'}</TableCell>
                      <TableCell>{version.buildNumber || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`inline-flex items-center gap-1 ${
                            version.platform === 'iOS' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' 
                              : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                          }`}
                        >
                          {version.platform === 'iOS' ? (
                            <Smartphone className="w-3 h-3" />
                          ) : (
                            <Monitor className="w-3 h-3" />
                          )}
                          {version.platform || '未知'}
                        </Badge>
                      </TableCell>
                      <TableCell>{version.updateContent || '无更新说明'}</TableCell>
                      <TableCell>{formatUploadDate(version.uploadDate)}</TableCell>
                      <TableCell>{version.size || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={version.status === 'active' ? 'default' : 'outline'} 
                          className={`text-muted-foreground px-1.5 ${
                            version.status === 'active' 
                              ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700' 
                              : ''
                          }`}
                        >
                          {version.status === 'active' ? (
                            <CheckCircle className="w-3 h-3 mr-1 text-green-600 dark:text-green-400" />
                          ) : (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {version.status === 'active' ? '已发布' : version.status || '未知'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              size="icon"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">打开菜单</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem onClick={() => handleDownload(version)}>
                              <Download className="mr-2 h-4 w-4" />
                              下载
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => {
                              await copyWithFeedback(
                                version.downloadUrl || '',
                                () => toast.success('下载链接已复制'),
                                (error) => toast.error(error)
                              )
                            }}>
                              <Copy className="mr-2 h-4 w-4" />
                              复制链接
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditVersion(version)}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              variant="destructive"
                              onClick={() => handleDeleteVersion(version.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除版本
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* 分页控件 */}
          <div className="flex items-center justify-between px-2 py-6">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              显示 {startIndex + 1} 到 {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条记录
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  每页显示
                </Label>
                <Select
                  value={`${pagination.pageSize}`}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue placeholder={pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 30, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                第 {pagination.pageIndex + 1} 页，共 {totalPages} 页
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={goToFirstPage}
                  disabled={!canPreviousPage}
                >
                  <span className="sr-only">跳转到第一页</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={goToPreviousPage}
                  disabled={!canPreviousPage}
                >
                  <span className="sr-only">上一页</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={!canNextPage}
                >
                  <span className="sr-only">下一页</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={goToLastPage}
                  disabled={!canNextPage}
                >
                  <span className="sr-only">跳转到最后一页</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditVersionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        version={selectedVersion}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
} 