import { Router, Request, Response, NextFunction } from 'express'
import { UserService } from '../services/UserService'
import { authMiddleware, requireRole } from '../middleware/auth'
import { asyncErrorHandler } from '../middleware/errorHandler'
import { RESPONSE_CODES, createSuccessResponse, createErrorResponse } from '../utils/responseCodes'
import { CreateUserRequest, UpdateUserRequest } from '@app-center/shared/types'

const router: Router = Router()

// 所有路由都需要认证
router.use(authMiddleware)

// GET /api/v1/users - 获取用户列表
router.get('/', requireRole(['super_admin']), asyncErrorHandler(async (req: Request, res: Response) => {
  const users = await UserService.getAllUsers()
  res.json(createSuccessResponse('获取用户列表成功', users))
}))

// GET /api/v1/users/my-users - 获取当前用户创建的用户
router.get('/my-users', requireRole(['super_admin', 'admin']), asyncErrorHandler(async (req: Request, res: Response) => {
  const creatorId = req.user!.userId
  const users = await UserService.getUsersByCreator(creatorId)
  res.json(createSuccessResponse('获取用户列表成功', users))
}))

// GET /api/v1/users/stats - 获取用户统计信息
router.get('/stats', requireRole(['super_admin']), asyncErrorHandler(async (req: Request, res: Response) => {
  const stats = await UserService.getUserStats()
  res.json(createSuccessResponse('获取用户统计成功', stats))
}))

// GET /api/v1/users/:id - 根据ID获取用户
router.get('/:id', requireRole(['super_admin', 'admin']), asyncErrorHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const operatorRole = req.user!.role
  const operatorId = req.user!.userId

  // 检查权限：超级管理员可以查看所有用户，管理员只能查看自己创建的用户
  if (operatorRole === 'admin') {
    const user = await UserService.getUserById(id)
    if (!user || user.created_by !== operatorId) {
      return res.status(403).json(createErrorResponse(RESPONSE_CODES.AUTH.PERMISSION_DENIED, '无权限访问此用户'))
    }
  }

  const user = await UserService.getUserById(id)
  if (!user) {
    return res.status(404).json(createErrorResponse(RESPONSE_CODES.USER.NOT_FOUND, '用户不存在'))
  }

  res.json(createSuccessResponse('获取用户信息成功', user))
}))

// POST /api/v1/users - 创建新用户
router.post('/', requireRole(['super_admin']), asyncErrorHandler(async (req: Request, res: Response) => {
  const userData: CreateUserRequest = req.body
  const creatorId = req.user!.userId

  // 验证必填字段
  if (!userData.username || !userData.email || !userData.password || !userData.role) {
    return res.status(400).json(createErrorResponse(RESPONSE_CODES.USER.MISSING_FIELDS, '用户名、邮箱、密码和角色为必填字段'))
  }

  // 超级管理员只能创建管理员
  if (userData.role !== 'admin') {
    return res.status(400).json(createErrorResponse(RESPONSE_CODES.USER.INVALID_ROLE, '超级管理员只能创建管理员用户'))
  }

  // 密码长度验证
  if (userData.password.length < 6) {
    return res.status(400).json(createErrorResponse(RESPONSE_CODES.AUTH.PASSWORD_TOO_SHORT, '密码长度至少为6位'))
  }

  const newUser = await UserService.createUser(userData, creatorId)
  res.status(201).json(createSuccessResponse('用户创建成功', newUser))
}))

// PUT /api/v1/users/:id - 更新用户信息
router.put('/:id', requireRole(['super_admin', 'admin']), asyncErrorHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const updateData: UpdateUserRequest = req.body
  const operatorId = req.user!.userId

  if (updateData.password && updateData.password.length < 6) {
    return res.status(400).json(createErrorResponse(RESPONSE_CODES.AUTH.PASSWORD_TOO_SHORT, '密码长度至少为6位'))
  }

  const updatedUser = await UserService.updateUser(id, updateData, operatorId)
  res.json(createSuccessResponse('用户更新成功', updatedUser))
}))

// POST /api/v1/users/:id/toggle-status - 切换用户状态
router.post('/:id/toggle-status', requireRole(['super_admin', 'admin']), asyncErrorHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const operatorId = req.user!.userId

  const updatedUser = await UserService.toggleUserStatus(id, operatorId)
  const statusText = updatedUser.isActive ? '启用' : '禁用'
  res.json(createSuccessResponse(`用户${statusText}成功`, updatedUser))
}))

// DELETE /api/v1/users/:id - 删除用户
router.delete('/:id', requireRole(['super_admin', 'admin']), asyncErrorHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const operatorId = req.user!.userId

  const success = await UserService.deleteUser(id, operatorId)
  if (success) {
    res.json(createSuccessResponse('用户删除成功'))
  } else {
    res.status(404).json(createErrorResponse(RESPONSE_CODES.USER.NOT_FOUND, '用户不存在'))
  }
}))

export default router 