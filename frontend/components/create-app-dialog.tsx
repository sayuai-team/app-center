"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useApps } from "@/hooks/use-apps"
import { toast } from "sonner"
import { App } from "@app-center/shared"
import { Loader2, Trash2, Edit, Plus } from "lucide-react"

interface CreateAppForm {
  name: string
  system: "iOS" | "Android"
  downloadKey: string
  description: string
}

interface CreateAppDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
  mode?: "create" | "edit"
  app?: App // 编辑模式时传入的应用数据
}

export function CreateAppDialog({ children, onSuccess, mode = "create", app }: CreateAppDialogProps) {
  const { createApp, updateApp, deleteApp } = useApps()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'create' | 'success'>('create')
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newApp, setNewApp] = useState<App | null>(null)
  
  // 获取当前服务的域名和端口
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}`
    }
    return 'http://localhost:3000' // 开发环境默认值
  }
  
  // 生成随机路径
  const generateRandomPath = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const [formData, setFormData] = useState<CreateAppForm>({
    name: "",
    system: "iOS",
    downloadKey: generateRandomPath(),
    description: ""
  })

  // 当模式或应用数据变化时更新表单
  useEffect(() => {
    if (mode === "edit" && app) {
      // 编辑模式：预填充应用数据
      setFormData({
        name: app.name || "",
        system: app.system as "iOS" | "Android" || "iOS",
        downloadKey: app.downloadKey || "",
        description: app.description || ""
      })
    } else if (mode === "create") {
      // 创建模式：重置为默认值
      setFormData({
        name: "",
        system: "iOS",
        downloadKey: generateRandomPath(),
        description: ""
      })
    }
  }, [mode, app])

  const handleInputChange = (field: keyof CreateAppForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSystemChange = (value: "iOS" | "Android") => {
    setFormData(prev => ({
      ...prev,
      system: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === "create") {
        // 创建模式
        toast.info('正在创建应用...')
        
        // 生成默认图标 URL
        const defaultIcon = formData.system === "iOS" 
          ? "https://via.placeholder.com/60x60/3b82f6/ffffff?text=iOS"
          : "https://via.placeholder.com/60x60/10b981/ffffff?text=AND"

        await createApp({
          name: formData.name,
          icon: defaultIcon,
          system: formData.system,
          bundleId: `com.example.${formData.name.toLowerCase().replace(/\s+/g, '')}`,
          version: "1.0.0",
          buildNumber: "1",
          uploadDate: new Date().toISOString().split('T')[0],
          description: formData.description,
          downloadKey: formData.downloadKey
        })

        // 重置表单
        setFormData({
          name: "",
          system: "iOS",
          downloadKey: generateRandomPath(),
          description: ""
        })

        toast.success('应用创建成功！')
      } else if (mode === "edit" && app) {
        // 编辑模式
        toast.info('正在更新应用信息...')
        
        await updateApp(app.id, {
          name: formData.name,
          system: formData.system,
          downloadKey: formData.downloadKey,
          description: formData.description
        })

        toast.success('应用信息更新成功！')
      }

      // 关闭弹窗
      setOpen(false)
      
      // 调用成功回调
      onSuccess?.()
    } catch (error) {
      console.error(`${mode === "create" ? "创建" : "更新"}应用失败:`, error)
      toast.error(`${mode === "create" ? "创建" : "更新"}应用失败，请重试`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (mode !== "edit" || !app) return

    // 先显示警告提示
    toast.warning('此操作不可撤销，请谨慎操作！')
    
    const confirmed = confirm(
      `确定要删除应用 "${app.name}" 吗？\n\n此操作将永久删除应用的所有数据，包括版本历史和上传的文件。此操作不可撤销！`
    )
    
    if (!confirmed) return

    setIsDeleting(true)
    try {
      toast.info('正在删除应用...')
      await deleteApp(app.id)
      
      // 关闭弹窗
      setOpen(false)
      
      // 显示成功消息
      toast.success('应用删除成功！')
      
      // 调用成功回调
      onSuccess?.()
    } catch (error) {
      console.error('删除应用失败:', error)
      toast.error('删除应用失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }

  const isFormValid = formData.name.trim() && formData.downloadKey.trim()

  // Debug: log form state
  console.log('Form data:', formData)
  console.log('Is form valid:', isFormValid)

  const handleCreateSuccess = (app: App) => {
    setNewApp(app)
    setStep('success')
    onSuccess?.() // 调用外部传入的成功回调
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {mode === "create" ? (
              <>
                <Plus className="h-5 w-5" />
                创建应用
              </>
            ) : (
              <>
                <Edit className="h-5 w-5" />
                编辑应用信息
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "创建一个新的应用条目到您的应用中心。"
              : "修改应用的基本信息和配置。"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 应用名称 */}
          <div className="space-y-2">
            <Label htmlFor="app-name">
              应用名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="app-name"
              placeholder="请输入应用名称"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onFocus={(e) => {
                // 编辑模式下阻止自动全选文本
                if (mode === "edit") {
                  setTimeout(() => {
                    e.target.setSelectionRange(e.target.value.length, e.target.value.length)
                  }, 0)
                }
              }}
              onMouseUp={(e) => {
                // 编辑模式下阻止鼠标选中文本的默认行为
                if (mode === "edit") {
                  e.preventDefault()
                  e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)
                }
              }}
              onClick={(e) => {
                // 编辑模式下点击时将光标移到末尾
                if (mode === "edit") {
                  setTimeout(() => {
                    e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)
                  }, 0)
                }
              }}
              required
            />
          </div>

          {/* 应用类型 */}
          <div className="space-y-3">
            <Label>
              应用类型 <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.system}
              onValueChange={handleSystemChange}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="iOS" id="ios" />
                <Label htmlFor="ios">iOS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Android" id="android" />
                <Label htmlFor="android">Android</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 下载链接 */}
          <div className="space-y-2">
            <Label htmlFor="download-key">
              下载链接 <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center border rounded-md">
              <span className="px-3 py-2 bg-muted text-muted-foreground text-sm border-r">
                {getBaseUrl()}/
              </span>
              <Input
                id="download-key"
                placeholder="path"
                value={formData.downloadKey}
                onChange={(e) => handleInputChange('downloadKey', e.target.value)}
                className="flex-1 border-0 focus-visible:ring-0"
                required
              />
            </div>
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">
              描述
            </Label>
            <Textarea
              id="description"
              placeholder="请输入应用描述"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* 提交按钮 */}
          <div className={`flex ${mode === "edit" ? "justify-between" : "justify-end"} gap-3 pt-4 ${mode === "edit" ? "border-t" : ""}`}>
            {mode === "edit" && (
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {isDeleting ? "删除中..." : "删除应用"}
              </Button>
            )}
            
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !isFormValid}
                className="flex items-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading 
                  ? (mode === "create" ? "创建中..." : "保存中...") 
                  : (mode === "create" ? "创建应用" : "保存更改")
                }
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 