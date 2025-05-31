export interface User {
  id: string
  username: string
  email: string
  password?: string // 敏感信息，查询时通常不返回
  role: 'super_admin' | 'admin' | 'user'
  isActive: boolean
  created_at: string
  updated_at: string
  last_login?: string
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