export interface User {
  id: string
  username: string
  email: string
  password?: string // 敏感信息，查询时通常不返回
  role: 'super_admin' | 'admin' | 'user'
  isActive: boolean
  created_by?: string // 创建者ID (super_admin创建admin时使用)
  created_at: string
  updated_at: string
  last_login?: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  role: 'admin' | 'user'
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  password?: string
  role?: 'admin' | 'user'
  isActive?: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: Omit<User, 'password'>
  token?: string
} 