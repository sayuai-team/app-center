"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import QRCode from 'qrcode'
import { App } from "@app-center/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Smartphone, Monitor, Download, Package, Calendar, FileText, Shield, Hash, ChevronDown, ChevronUp } from "lucide-react"

export default function DownloadPage() {
  const params = useParams()
  const downloadKey = params.downloadKey as string
  const [app, setApp] = useState<App | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isHttps, setIsHttps] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<any>(null)
  const [versionHistory, setVersionHistory] = useState<any[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop')

  // 检测设备类型
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      
      // 检测iOS设备
      if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
        return 'ios'
      }
      
      // 检测Android设备
      if (/android/i.test(userAgent)) {
        return 'android'
      }
      
      // 其他情况视为桌面设备
      return 'desktop'
    }
    
    setDeviceType(detectDevice())
  }, [])

  // 根据设备类型过滤版本历史
  const getFilteredVersions = (versions: any[]) => {
    if (deviceType === 'desktop') {
      // 桌面设备显示所有版本
      return versions
    }
    
    // 移动设备只显示对应平台的版本
    const targetPlatform = deviceType === 'ios' ? 'iOS' : 'Android'
    return versions.filter(version => version.platform === targetPlatform)
  }

  // 获取应用信息
  useEffect(() => {
    const fetchApp = async () => {
      try {
        const response = await fetch(`/api/app/${downloadKey}`)
        if (!response.ok) {
          throw new Error('应用不存在或已下架')
        }
        const appData = await response.json()
        setApp(appData)
        // selectedVersion 将在版本历史加载后设置
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取应用信息失败')
      } finally {
        setLoading(false)
      }
    }

    if (downloadKey) {
      fetchApp()
    }
  }, [downloadKey])

  // 获取版本历史
  useEffect(() => {
    const fetchVersionHistory = async () => {
      if (!app?.id) return
      
      setVersionsLoading(true)
      try {
        const response = await fetch(`/api/app/${downloadKey}/versions`)
        if (response.ok) {
          const versions = await response.json()
          // 获取最近10个版本，按上传时间倒序
          const recentVersions = versions
            .sort((a: any, b: any) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
            .slice(0, 10)
          setVersionHistory(recentVersions)
          
          // 根据设备类型过滤版本，然后选择默认版本
          const filteredVersions = getFilteredVersions(recentVersions)
          
          // 默认选中最近的版本（第一个）
          if (filteredVersions.length > 0 && !selectedVersion) {
            const latestVersion = filteredVersions[0]
            setSelectedVersion(latestVersion)
            // 更新应用信息显示最新版本
            setApp(prev => prev ? {
              ...prev,
              version: latestVersion.version,
              buildNumber: latestVersion.buildNumber,
              uploadDate: latestVersion.uploadDate,
              downloadUrl: latestVersion.downloadUrl
            } : latestVersion)
          }
        }
      } catch (err) {
        console.error('获取版本历史失败:', err)
      } finally {
        setVersionsLoading(false)
      }
    }

    fetchVersionHistory()
  }, [app?.id, downloadKey, deviceType])

  // 检查HTTPS状态
  useEffect(() => {
    setIsHttps(window.location.protocol === 'https:')
  }, [])

  // 设置页面标题
  useEffect(() => {
    if (app) {
      document.title = `${app.appName || app.name} - 下载`
    }
    
    // 清理函数，组件卸载时恢复默认标题
    return () => {
      document.title = 'App Center'
    }
  }, [app])

  // 生成二维码
  useEffect(() => {
    const generateQRCode = async () => {
      if (app?.downloadUrl) {
        try {
          // 生成完整的URL，包含当前页面的host和port
          const fullUrl = window.location.origin + window.location.pathname
          const qrDataUrl = await QRCode.toDataURL(fullUrl, {
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
        }
      }
    }

    generateQRCode()
  }, [app?.downloadUrl])

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    } catch {
      return dateString
    }
  }

  // 处理下载
  const handleDownload = () => {
    const downloadUrl = selectedVersion?.downloadUrl || app?.downloadUrl
    if (!downloadUrl) return

    const system = selectedVersion?.platform || app?.system
    if (system === 'iOS') {
      // iOS应用需要HTTPS才能安装
      if (!isHttps) {
        alert('iOS应用安装需要HTTPS连接，请使用HTTPS访问此页面')
        return
      }
      
      // iOS应用需要通过plist文件安装
      const plistUrl = selectedVersion 
        ? `/api/app/${downloadKey}/plist?version=${selectedVersion.id}`
        : `/api/app/${downloadKey}/plist`
      const installUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(
        window.location.origin + plistUrl
      )}`
      
      // 添加调试信息
      console.log('Plist URL:', window.location.origin + plistUrl)
      console.log('Install URL:', installUrl)
      
      // 尝试安装
      window.location.href = installUrl
    } else {
      // Android应用直接下载
      window.location.href = downloadUrl
    }
  }

  // 处理直接下载IPA文件（用于调试）
  const handleDirectDownload = () => {
    const downloadUrl = selectedVersion?.downloadUrl || app?.downloadUrl
    if (downloadUrl) {
      window.location.href = downloadUrl
    }
  }

  // 处理备用安装方法
  const handleAlternativeInstall = () => {
    const downloadUrl = selectedVersion?.downloadUrl || app?.downloadUrl
    if (!downloadUrl) return

    const system = selectedVersion?.platform || app?.system
    if (system === 'iOS') {
      const plistUrl = selectedVersion 
        ? `/api/app/${downloadKey}/plist?version=${selectedVersion.id}`
        : `/api/app/${downloadKey}/plist`
      const installUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(
        window.location.origin + plistUrl
      )}`
      
      // 尝试在新窗口中打开
      const newWindow = window.open(installUrl, '_blank')
      if (!newWindow) {
        // 如果弹窗被阻止，回退到直接跳转
        window.location.href = installUrl
      }
    }
  }

  // 处理版本选择
  const handleVersionSelect = (version: any) => {
    setSelectedVersion(version)
    // 更新应用信息显示，保持原始应用信息，但更新版本相关字段
    setApp(prev => prev ? {
      ...prev,
      version: version.version,
      buildNumber: version.buildNumber,
      uploadDate: version.uploadDate,
      downloadUrl: version.downloadUrl
    } : version)
    
    // 滚动到页面顶部
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-40 w-40 mx-auto" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-foreground">应用不存在</h1>
          <p className="text-muted-foreground">{error || '未找到相关应用'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto p-4 space-y-6">
        {/* 应用头部信息 */}
        <div className="flex items-center gap-4 pt-2 pb-2">
          <Avatar className={`h-20 w-20 flex-shrink-0 border shadow-sm ${(selectedVersion?.platform || app.system) === 'iOS' ? 'rounded-[18px]' : 'rounded-xl'}`}>
            <AvatarImage src={app.icon} alt={app.appName || app.name} className={(selectedVersion?.platform || app.system) === 'iOS' ? 'rounded-[18px]' : 'rounded-xl'} />
            <AvatarFallback className={`text-xl bg-muted/50 ${(selectedVersion?.platform || app.system) === 'iOS' ? 'rounded-[18px]' : 'rounded-xl'}`}>
              {(selectedVersion?.platform || app.system) === "iOS" ? (
                <Smartphone className="h-10 w-10 text-muted-foreground" />
              ) : (
                <Monitor className="h-10 w-10 text-muted-foreground" />
              )}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {app.appName || app.name}
              </h1>
              
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {(selectedVersion?.platform || app.system) === "iOS" ? (
                  <Smartphone className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  适用于 {(selectedVersion?.platform || app.system)} 设备
                </span>
              </div>

              <div className="pt-0.5">
                <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1">
                  v{app.version} (build {app.buildNumber})
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <Button 
            onClick={handleDownload}
            variant="outline"
            className="w-full h-10 text-base font-medium border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            size="lg"
            disabled={!selectedVersion?.downloadUrl && !app?.downloadUrl}
          >
            <Download className="h-5 w-5 mr-2" />
            下载安装
          </Button>
          
          {(selectedVersion?.platform || app?.system) === 'iOS' && !isHttps && (
            <div className="text-center text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="font-medium mb-1">⚠️ 需要HTTPS连接</div>
              <div>iOS应用安装需要HTTPS连接才能正常工作</div>
              <div className="mt-2">
                <Button 
                  variant="link" 
                  className="text-orange-600 p-0 h-auto"
                  onClick={() => window.open('/cert', '_blank')}
                >
                  点击这里安装HTTPS证书
                </Button>
              </div>
            </div>
          )}
          
          {(selectedVersion?.platform || app?.system) === 'iOS' && isHttps && (
            <div className="text-center text-sm text-blue-600 bg-blue-50 rounded-lg border border-blue-200">
              <Button
                variant="ghost"
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full h-10 text-blue-600 hover:bg-blue-100 flex items-center justify-between"
              >
                <span className="font-medium">🏢 企业应用安装说明</span>
                {showInstructions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              {showInstructions && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="text-xs space-y-2 text-left">
                    {/* 二维码区域 */}
                    <div className="text-center mb-4">
                      <div className="font-medium mb-2">扫码下载</div>
                      <div className="inline-flex p-4 bg-background rounded-lg border">
                        {qrCodeDataUrl ? (
                          <img 
                            src={qrCodeDataUrl} 
                            alt="下载二维码" 
                            className="w-32 h-32"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-muted rounded flex items-center justify-center">
                            <div className="text-center space-y-2">
                              <Package className="h-6 w-6 text-muted-foreground mx-auto" />
                              <div className="text-xs text-muted-foreground">生成中...</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div><strong>安装步骤：</strong></div>
                    <div>1. 点击&ldquo;下载安装&rdquo;按钮开始下载</div>
                    <div>2. 在弹出的对话框中选择&ldquo;安装&rdquo;</div>
                    <div>3. 等待应用下载和安装完成</div>
                    <div>4. 前往&ldquo;设置 → 通用 → VPN与设备管理&rdquo;</div>
                    <div>5. 找到&ldquo;Shenzhen Forms Syntron Information Co., Ltd.&rdquo;</div>
                    <div>6. 点击&ldquo;信任&rdquo;企业开发者证书</div>
                    <div>7. 确认信任后即可正常使用应用</div>
                    
                    <div className="mt-3"><strong>备用安装方法：</strong></div>
                    <div className="space-y-2">
                      <Button 
                        onClick={handleDirectDownload}
                        variant="outline"
                        className="w-full h-10 text-sm"
                        disabled={!selectedVersion?.downloadUrl && !app?.downloadUrl}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        直接下载IPA文件
                      </Button>
                      
                      <Button 
                        onClick={handleAlternativeInstall}
                        variant="outline"
                        className="w-full h-10 text-sm"
                        disabled={!selectedVersion?.downloadUrl && !app?.downloadUrl}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        备用安装链接
                      </Button>
                    </div>
                    
                    <div className="mt-3"><strong>故障排除：</strong></div>
                    <div>• 确保iOS版本 ≥ 14.0</div>
                    <div>• 确保设备有足够存储空间</div>
                    <div>• 检查网络连接是否稳定</div>
                    <div>• 如安装失败，请重启设备后重试</div>
                    <div>• 企业证书有效期至：2025年7月22日</div>
                    
                    <div className="mt-3"><strong>iOS设置检查：</strong></div>
                    <div>• 设置 → 屏幕使用时间 → 内容和隐私访问限制 → 关闭或允许安装应用</div>
                    <div>• 设置 → 通用 → 关于本机 → 证书信任设置 → 启用完全信任</div>
                    <div>• 确保未开启&ldquo;限制安装应用&rdquo;</div>
                    <div>• 确保未开启&ldquo;仅允许App Store应用&rdquo;</div>
                    
                    <div className="mt-3"><strong>网络要求：</strong></div>
                    <div>• 必须使用WiFi网络（不能使用蜂窝数据）</div>
                    <div>• 网络不能有企业防火墙阻止</div>
                    <div>• 确保能正常访问Apple服务器</div>
                    
                    <div className="mt-3"><strong>调试信息：</strong></div>
                    {selectedVersion && (
                      <div className="text-xs bg-blue-50 p-2 rounded border border-blue-200 mb-2">
                        <div className="font-medium text-blue-800">当前选中版本：v{selectedVersion.version} (build {selectedVersion.buildNumber})</div>
                        <div className="text-blue-600">注意：plist安装将使用此版本的文件</div>
                      </div>
                    )}
                    <div className="text-xs bg-gray-100 p-2 rounded break-all">
                      <div>plist: {window.location.origin}/api/app/{downloadKey}/plist{selectedVersion ? `?version=${selectedVersion.id}` : ''}</div>
                      <div>install: itms-services://?action=download-manifest&url={encodeURIComponent(window.location.origin + `/api/app/${downloadKey}/plist${selectedVersion ? `?version=${selectedVersion.id}` : ''}`)}</div>
                      {selectedVersion && (
                        <div className="mt-1 text-blue-600">IPA文件: {selectedVersion.downloadUrl}</div>
                      )}
                    </div>

                    <div className="mt-3"><strong>分步测试：</strong></div>
                    <div className="space-y-2">
                      <button 
                        onClick={() => window.open(`/api/app/${downloadKey}/plist${selectedVersion ? `?version=${selectedVersion.id}` : ''}`, '_blank')}
                        className="w-full text-left text-xs bg-yellow-100 p-2 rounded border"
                      >
                        1. 测试plist文件 (点击查看XML)
                      </button>
                      <button 
                        onClick={() => window.open(selectedVersion?.downloadUrl || app?.downloadUrl || '', '_blank')}
                        className="w-full text-left text-xs bg-yellow-100 p-2 rounded border"
                      >
                        2. 测试IPA下载 (点击下载文件)
                      </button>
                      <button 
                        onClick={() => {
                          const plistUrl = selectedVersion 
                            ? `/api/app/${downloadKey}/plist?version=${selectedVersion.id}`
                            : `/api/app/${downloadKey}/plist`
                          const installUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(window.location.origin + plistUrl)}`
                          navigator.clipboard.writeText(installUrl).then(() => alert('安装链接已复制到剪贴板'))
                        }}
                        className="w-full text-left text-xs bg-yellow-100 p-2 rounded border"
                      >
                        3. 复制安装链接 (手动粘贴到Safari)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 更新内容 */}
        <div className="bg-muted/30 rounded-lg p-2 border">
          <h3 className="text-sm font-medium text-foreground mb-2">更新内容</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {selectedVersion?.updateContent || '暂无更新内容说明'}
          </p>
        </div>

        {/* 应用详情卡片 */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-3">
              关于 {app.appName || app.name}
            </h2>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">文件大小</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedVersion?.size || '未知'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">版本</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {app.version} (build {app.buildNumber})
              </span>
            </div>
            
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">发布时间</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDate(app.uploadDate)}
              </span>
            </div>
            
            {app.bundleId && (
              <div className="flex items-start justify-between gap-4 py-1.5">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm font-medium">Bundle ID</span>
                </div>
                <span className="text-sm text-muted-foreground text-right break-all">
                  {app.bundleId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 版本历史 */}
        {versionHistory.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">版本历史</h2>
              {deviceType !== 'desktop' && (
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1">
                    {deviceType === 'ios' ? (
                      <>
                        <Smartphone className="h-3 w-3" />
                        仅显示 iOS 版本
                      </>
                    ) : (
                      <>
                        <Monitor className="h-3 w-3" />
                        仅显示 Android 版本
                      </>
                    )}
                  </span>
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              {versionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : getFilteredVersions(versionHistory).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📱</div>
                  <p className="text-sm text-muted-foreground">
                    {deviceType === 'ios' 
                      ? '暂无 iOS 版本' 
                      : deviceType === 'android' 
                        ? '暂无 Android 版本'
                        : '暂无版本历史'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getFilteredVersions(versionHistory).map((version) => (
                    <div
                      key={version.id}
                      onClick={() => handleVersionSelect(version)}
                      className={`group relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                        selectedVersion?.id === version.id 
                          ? 'bg-accent border-border shadow-sm' 
                          : 'hover:bg-accent/50 border-border hover:border-border'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`h-9 w-9 rounded-md border transition-all duration-200 ${
                          selectedVersion?.id === version.id 
                            ? 'border-primary/20 bg-primary/10' 
                            : 'border-border bg-background group-hover:border-border group-hover:bg-accent/30'
                        } flex items-center justify-center`}>
                          {version.system === "iOS" ? (
                            <Smartphone className={`h-4 w-4 transition-colors duration-200 ${
                              selectedVersion?.id === version.id 
                                ? 'text-primary' 
                                : 'text-muted-foreground group-hover:text-foreground'
                            }`} />
                          ) : (
                            <Monitor className={`h-4 w-4 transition-colors duration-200 ${
                              selectedVersion?.id === version.id 
                                ? 'text-primary' 
                                : 'text-muted-foreground group-hover:text-foreground'
                            }`} />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`font-medium text-sm transition-colors duration-200 ${
                            selectedVersion?.id === version.id 
                              ? 'text-foreground' 
                              : 'text-foreground group-hover:text-foreground'
                          }`}>
                            v{version.version}
                          </span>
                          <Badge variant="secondary" className={`text-xs h-5 px-1.5 font-normal transition-all duration-200 ${
                            selectedVersion?.id === version.id 
                              ? 'bg-primary/10 text-primary border-primary/20' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {version.buildNumber}
                          </Badge>
                          {/* 平台标签 */}
                          <Badge 
                            variant="outline" 
                            className={`text-xs h-5 px-1.5 font-normal transition-all duration-200 inline-flex items-center gap-1 ${
                              version.platform === 'iOS'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                                : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                            }`}
                          >
                            {version.platform === 'iOS' ? (
                              <Smartphone className="w-2.5 h-2.5" />
                            ) : (
                              <Monitor className="w-2.5 h-2.5" />
                            )}
                            {version.platform || '未知'}
                          </Badge>
                        </div>
                        <p className={`text-xs mb-0.5 transition-colors duration-200 ${
                          selectedVersion?.id === version.id 
                            ? 'text-muted-foreground' 
                            : 'text-muted-foreground group-hover:text-foreground/80'
                        }`}>
                          {formatDate(version.uploadDate)}
                        </p>
                        <p className={`text-xs transition-colors duration-200 ${
                          selectedVersion?.id === version.id 
                            ? 'text-muted-foreground/80' 
                            : 'text-muted-foreground/60 group-hover:text-muted-foreground'
                        }`} style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden'
                        }}>
                          {version.updateContent || '暂无更新内容说明'}
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <ChevronDown className={`h-4 w-4 transition-all duration-200 ${
                          selectedVersion?.id === version.id 
                            ? 'text-primary' 
                            : 'text-muted-foreground group-hover:text-foreground'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 底部间距 */}
        <div className="pb-8" />
      </div>
    </div>
  )
}