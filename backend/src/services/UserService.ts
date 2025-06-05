import bcrypt from 'bcryptjs'
import { getDatabase } from '../utils/database'
import { generateId } from '../utils/idGenerator'
import { User, CreateUserRequest, UpdateUserRequest } from '@app-center/shared/types'

export class UserService {
  
  // 获取所有用户（超级管理员权限）
  static async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const db = await getDatabase()
    const users = await db.all(`
      SELECT id, username, email, role, isActive, created_by, created_at, updated_at, last_login
      FROM users 
      ORDER BY created_at DESC
    `)
    return users as Omit<User, 'password'>[]
  }

  // 获取当前用户创建的管理员（超级管理员权限）
  static async getUsersByCreator(creatorId: string): Promise<Omit<User, 'password'>[]> {
    const db = await getDatabase()
    const users = await db.all(`
      SELECT id, username, email, role, isActive, created_by, created_at, updated_at, last_login
      FROM users 
      WHERE created_by = ?
      ORDER BY created_at DESC
    `, [creatorId])
    return users as Omit<User, 'password'>[]
  }

  // 根据ID获取用户
  static async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const db = await getDatabase()
    const user = await db.get(`
      SELECT id, username, email, role, isActive, created_by, created_at, updated_at, last_login
      FROM users 
      WHERE id = ?
    `, [id])
    return user as Omit<User, 'password'> | null
  }

  // 创建新用户（超级管理员创建管理员，管理员创建普通用户）
  static async createUser(userData: CreateUserRequest, creatorId: string): Promise<Omit<User, 'password'>> {
    const db = await getDatabase()
    
    // 检查用户名和邮箱是否已存在
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?', 
      [userData.username, userData.email]
    )

    if (existingUser) {
      throw new Error('用户名或邮箱已存在')
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // 生成用户ID
    const userId = generateId()

    // 创建用户
    await db.run(`
      INSERT INTO users (id, username, email, password, role, isActive, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, 
      userData.username, 
      userData.email, 
      hashedPassword, 
      userData.role, 
      1,
      creatorId
    ])

    // 返回创建的用户信息（不包含密码）
    const newUser = await this.getUserById(userId)
    if (!newUser) {
      throw new Error('创建用户失败')
    }

    return newUser
  }

  // 更新用户信息
  static async updateUser(userId: string, updateData: UpdateUserRequest, operatorId: string): Promise<Omit<User, 'password'>> {
    const db = await getDatabase()
    
    // 检查用户是否存在
    const existingUser = await this.getUserById(userId)
    if (!existingUser) {
      throw new Error('用户不存在')
    }

    // 检查权限：超级管理员可以修改所有用户，管理员只能修改自己创建的用户
    const operator = await this.getUserById(operatorId)
    if (!operator) {
      throw new Error('操作者不存在')
    }

    if (operator.role !== 'super_admin' && existingUser.created_by !== operatorId) {
      throw new Error('无权限修改此用户')
    }

    // 构建更新语句
    const updates: string[] = []
    const params: any[] = []

    if (updateData.username) {
      // 检查用户名是否已被其他用户使用
      const duplicateUser = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', [updateData.username, userId])
      if (duplicateUser) {
        throw new Error('用户名已被使用')
      }
      updates.push('username = ?')
      params.push(updateData.username)
    }

    if (updateData.email) {
      // 检查邮箱是否已被其他用户使用
      const duplicateUser = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [updateData.email, userId])
      if (duplicateUser) {
        throw new Error('邮箱已被使用')
      }
      updates.push('email = ?')
      params.push(updateData.email)
    }

    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10)
      updates.push('password = ?')
      params.push(hashedPassword)
    }

    if (updateData.role) {
      // 只有超级管理员可以修改角色
      if (operator.role !== 'super_admin') {
        throw new Error('只有超级管理员可以修改用户角色')
      }
      updates.push('role = ?')
      params.push(updateData.role)
    }

    if (updateData.isActive !== undefined) {
      updates.push('isActive = ?')
      params.push(updateData.isActive ? 1 : 0)
    }

    if (updates.length === 0) {
      throw new Error('没有要更新的字段')
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(userId)

    // 执行更新
    await db.run(`
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `, params)

    // 返回更新后的用户信息
    const updatedUser = await this.getUserById(userId)
    if (!updatedUser) {
      throw new Error('更新用户失败')
    }

    return updatedUser
  }

  // 删除用户
  static async deleteUser(userId: string, operatorId: string): Promise<boolean> {
    const db = await getDatabase()
    
    // 检查用户是否存在
    const existingUser = await this.getUserById(userId)
    if (!existingUser) {
      throw new Error('用户不存在')
    }

    // 不能删除自己
    if (userId === operatorId) {
      throw new Error('不能删除自己')
    }

    // 不能删除超级管理员
    if (existingUser.role === 'super_admin') {
      throw new Error('不能删除超级管理员')
    }

    // 检查权限
    const operator = await this.getUserById(operatorId)
    if (!operator) {
      throw new Error('操作者不存在')
    }

    if (operator.role !== 'super_admin' && existingUser.created_by !== operatorId) {
      throw new Error('无权限删除此用户')
    }

    // 检查用户是否有应用，如果有应用则不能删除
    const userApps = await db.get('SELECT COUNT(*) as count FROM apps WHERE owner_id = ?', [userId])
    if (userApps.count > 0) {
      throw new Error('用户拥有应用，无法删除。请先转移或删除用户的所有应用。')
    }

    // 删除用户
    const result = await db.run('DELETE FROM users WHERE id = ?', [userId])
    
    return result.changes > 0
  }

  // 切换用户状态（启用/禁用）
  static async toggleUserStatus(userId: string, operatorId: string): Promise<Omit<User, 'password'>> {
    const db = await getDatabase()
    
    const existingUser = await this.getUserById(userId)
    if (!existingUser) {
      throw new Error('用户不存在')
    }

    // 不能禁用自己
    if (userId === operatorId) {
      throw new Error('不能禁用自己')
    }

    // 不能禁用超级管理员
    if (existingUser.role === 'super_admin') {
      throw new Error('不能禁用超级管理员')
    }

    // 检查权限
    const operator = await this.getUserById(operatorId)
    if (!operator) {
      throw new Error('操作者不存在')
    }

    if (operator.role !== 'super_admin' && existingUser.created_by !== operatorId) {
      throw new Error('无权限修改此用户状态')
    }

    // 切换状态
    const newStatus = existingUser.isActive ? 0 : 1
    await db.run('UPDATE users SET isActive = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, userId])

    // 返回更新后的用户信息
    const updatedUser = await this.getUserById(userId)
    if (!updatedUser) {
      throw new Error('更新用户状态失败')
    }

    return updatedUser
  }

  // 获取用户统计信息
  static async getUserStats(): Promise<{
    total: number
    superAdmins: number
    admins: number
    users: number
    active: number
    inactive: number
  }> {
    const db = await getDatabase()
    
    const stats = await db.all(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as superAdmins,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as users,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) as inactive
      FROM users
    `)

    return stats[0] || {
      total: 0,
      superAdmins: 0,
      admins: 0,
      users: 0,
      active: 0,
      inactive: 0
    }
  }
} 