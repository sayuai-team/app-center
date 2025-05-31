export interface App {
  id: string
  name: string // 用户可编辑的应用名称
  appName?: string // 从IPA/APK包中解析的应用名称，不可编辑
  appKey: string // 16位随机字符串，用于自动化打包上传
  downloadKey: string // 8位随机字符串，用户可自定义，用于下载链接
  icon: string
  system: string
  bundleId: string
  version: string
  buildNumber: string
  uploadDate: string
  downloadUrl?: string
  description?: string
}

export interface Version {
  id: string
  appId: string
  version: string
  buildNumber: string
  updateContent: string
  uploadDate: string
  size: string
  status: string
  fileName: string
  filePath: string
  downloadUrl?: string
  platform?: string
} 