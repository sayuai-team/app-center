"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Download, QrCode, Share2 } from "lucide-react"
import { useEffect, useState } from "react"
import QRCode from "qrcode"

export default function CertificatePage() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [currentUrl, setCurrentUrl] = useState<string>("")
  const [currentOrigin, setCurrentOrigin] = useState<string>("")

  useEffect(() => {
    // 获取当前页面的完整URL
    const url = window.location.href
    const origin = window.location.origin
    setCurrentUrl(url)
    setCurrentOrigin(origin)
    
    // 生成二维码
    QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).then(url => {
      setQrCodeUrl(url)
    }).catch(err => {
      console.error('生成二维码失败:', err)
    })
  }, [])

  const handleDownloadCert = () => {
    // 动态获取当前域名的证书文件
    const hostname = window.location.hostname;
    window.location.href = `/${hostname}.pem`
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      alert('链接已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
      alert('复制失败，请手动复制链接')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto p-4 space-y-6">
        <div className="text-center space-y-4 pt-8">
          <Shield className="h-16 w-16 mx-auto text-blue-600" />
          <h1 className="text-2xl font-bold text-foreground">
            安装HTTPS证书
          </h1>
          <p className="text-sm text-muted-foreground">
            为了安装企业应用，需要先信任我们的HTTPS证书
          </p>
        </div>

        {/* 二维码卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              扫码访问
            </CardTitle>
            <CardDescription>
              使用手机扫描二维码直接访问此页面
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="页面二维码" 
                  className="border rounded-lg"
                />
              ) : (
                <div className="w-[200px] h-[200px] border rounded-lg flex items-center justify-center bg-gray-50">
                  <span className="text-gray-500">生成二维码中...</span>
                </div>
              )}
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                访问地址: {currentUrl}
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyUrl}
                className="text-xs"
              >
                <Share2 className="h-3 w-3 mr-1" />
                复制链接
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">安装步骤</CardTitle>
            <CardDescription>
              请按照以下步骤安装并信任证书
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <div className="font-medium">下载证书</div>
                  <div className="text-muted-foreground">点击下方按钮下载证书文件</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <div className="font-medium">安装证书</div>
                  <div className="text-muted-foreground">前往&ldquo;设置 → 通用 → VPN与设备管理&rdquo;安装证书</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <div className="font-medium">信任证书</div>
                  <div className="text-muted-foreground">前往&ldquo;设置 → 通用 → 关于本机 → 证书信任设置&rdquo;启用完全信任</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <div className="font-medium">安装应用</div>
                  <div className="text-muted-foreground">返回应用下载页面，重新尝试安装</div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleDownloadCert}
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              下载证书文件
            </Button>
            
            <div className="text-center">
              <Button 
                variant="outline"
                onClick={() => window.open('/fubon-uat', '_self')}
                className="text-sm"
              >
                返回应用下载页面
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="font-medium text-orange-600">⚠️ 安全提示</div>
              <div>此证书仅用于测试环境，请勿在生产环境中使用。</div>
              <div>安装后可以正常访问 {currentOrigin} 并安装企业应用。</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 