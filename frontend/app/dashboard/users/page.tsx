"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UserSidebar } from "@/components/user-sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Plus, UserPlus, Shield, ShieldCheck, Eye, EyeOff, Edit, Trash2 } from "lucide-react"
import { apiRequest } from "@/lib/api"

interface User {
  id: string
  username: string
  email: string
  role: 'super_admin' | 'admin' | 'user'
  isActive: boolean
  created_by?: string
  created_at: string
  updated_at: string
  last_login?: string
}

interface CreateUserForm {
  username: string
  email: string
  password: string
  role: 'admin' | 'user'
}

export default function UsersPage() {
  const { userInfo, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    email: '',
    password: '',
    role: 'admin'
  })

  // 检查权限
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !userInfo)) {
      router.push('/login')
      return
    }

    if (userInfo && userInfo.role !== 'super_admin') {
      toast.error('无权限访问用户管理页面')
      router.push('/dashboard')
      return
    }
  }, [authLoading, isAuthenticated, userInfo, router])

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest('/api/v1/users', {
        method: 'GET'
      })
      setUsers(response || [])
    } catch (error) {
      console.error('获取用户列表失败:', error)
      toast.error('获取用户列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userInfo && userInfo.role === 'super_admin') {
      fetchUsers()
    }
  }, [userInfo])

  // 创建用户
  const handleCreateUser = async () => {
    if (!createForm.username || !createForm.email || !createForm.password) {
      toast.error('请填写所有必填字段')
      return
    }

    if (createForm.password.length < 6) {
      toast.error('密码长度至少为6位')
      return
    }

    try {
      await apiRequest('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify(createForm)
      })

      toast.success('用户创建成功')
      setIsCreateDialogOpen(false)
      setCreateForm({ username: '', email: '', password: '', role: 'admin' })
      fetchUsers()
    } catch (error) {
      console.error('创建用户失败:', error)
      toast.error('创建用户失败')
    }
  }

  // 切换用户状态
  const handleToggleUserStatus = async (userId: string) => {
    try {
      await apiRequest(`/api/v1/users/${userId}/toggle-status`, {
        method: 'POST'
      })

      toast.success('用户状态更新成功')
      fetchUsers()
    } catch (error) {
      console.error('更新用户状态失败:', error)
      toast.error('更新用户状态失败')
    }
  }

  // 删除用户
  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`确定要删除用户 "${username}" 吗？此操作不可撤销。`)) {
      return
    }

    try {
      await apiRequest(`/api/v1/users/${userId}`, {
        method: 'DELETE'
      })

      toast.success('用户删除成功')
      fetchUsers()
    } catch (error) {
      console.error('删除用户失败:', error)
      toast.error('删除用户失败')
    }
  }

  // 获取角色显示
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="destructive" className="gap-1"><ShieldCheck className="h-3 w-3" />超级管理员</Badge>
      case 'admin':
        return <Badge variant="default" className="gap-1"><Shield className="h-3 w-3" />管理员</Badge>
      case 'user':
        return <Badge variant="secondary">普通用户</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  if (authLoading || !userInfo) {
    return (
      <DashboardLayout hideSidebar>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (userInfo.role !== 'super_admin') {
    return (
      <DashboardLayout hideSidebar>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-destructive">无权限访问此页面</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      sidebarContent={
        <UserSidebar 
          onCreateUser={() => setIsCreateDialogOpen(true)}
        />
      }
    >
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">用户管理</h1>
            <p className="text-muted-foreground">管理系统用户和权限</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                创建用户
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新用户</DialogTitle>
                <DialogDescription>
                  创建一个新的管理员用户
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    value={createForm.username}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="输入用户名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="输入邮箱地址"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="输入密码（至少6位）"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">角色</Label>
                  <Select value={createForm.role} onValueChange={(value: 'admin' | 'user') => setCreateForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateUser}>
                    创建用户
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>用户列表</CardTitle>
            <CardDescription>
              系统中的所有用户
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-lg">加载中...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>最后登录</TableHead>
                    <TableHead className="w-[50px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleDisplay(user.role)}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "启用" : "禁用"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        {user.last_login ? formatDate(user.last_login) : '从未登录'}
                      </TableCell>
                      <TableCell>
                        {user.role !== 'super_admin' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id)}>
                                {user.isActive ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    禁用用户
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    启用用户
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除用户
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 