import { Router, Request, Response, NextFunction } from 'express';
import { AppService } from '../services/AppService';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validateApp, limitRequestSize, preventSqlInjection } from '../middleware/validation';
import { RESPONSE_CODES, createSuccessResponse, createErrorResponse } from '../utils/responseCodes';

const router: Router = Router();

// 添加基础安全中间件
router.use(limitRequestSize(5)); // 限制请求体大小为5MB
router.use(preventSqlInjection); // SQL注入防护

// 对所有应用管理API添加认证保护
router.use(authMiddleware);

// GET /api/v1/apps - 获取应用列表（根据用户角色返回不同数据）
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = req.user!.role;
    const userId = req.user!.userId;
    
    let apps;
    if (userRole === 'super_admin') {
      // 超级管理员可以看到所有应用
      apps = await AppService.getAllApps();
    } else if (userRole === 'admin') {
      // 管理员只能看到自己的应用
      apps = await AppService.getAppsByOwner(userId);
    } else {
      // 普通用户无权访问应用列表
      return res.status(403).json(createErrorResponse(RESPONSE_CODES.AUTH.PERMISSION_DENIED, '无权限访问应用列表'));
    }
    
    res.json(createSuccessResponse('获取应用列表成功', apps));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/apps - 创建新应用 (需要管理员权限)
router.post('/', requireRole(['admin', 'super_admin']), validateApp, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 设置应用所有者为当前用户
    const appData = {
      ...req.body,
      owner_id: req.user!.userId
    };
    
    const app = await AppService.createApp(appData);
    res.status(200).json(createSuccessResponse('应用创建成功', app));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/apps/:id - 获取单个应用
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = await AppService.getAppById(req.params.id);
    if (!app) {
      return res.status(404).json(createErrorResponse(RESPONSE_CODES.APP.NOT_FOUND, '应用不存在'));
    }
    
    // 权限检查：超级管理员可以查看所有应用，管理员只能查看自己的应用
    const userRole = req.user!.role;
    const userId = req.user!.userId;
    
    if (userRole !== 'super_admin' && app.owner_id !== userId) {
      return res.status(403).json(createErrorResponse(RESPONSE_CODES.AUTH.PERMISSION_DENIED, '无权限访问此应用'));
    }
    
    res.json(createSuccessResponse('获取应用信息成功', app));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/apps/:id/update - 更新应用 (需要管理员权限)
router.post('/:id/update', requireRole(['admin', 'super_admin']), validateApp, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 权限检查：确保用户只能更新自己的应用
    const existingApp = await AppService.getAppById(req.params.id);
    if (!existingApp) {
      return res.status(404).json(createErrorResponse(RESPONSE_CODES.APP.NOT_FOUND, '应用不存在'));
    }
    
    const userRole = req.user!.role;
    const userId = req.user!.userId;
    
    if (userRole !== 'super_admin' && (existingApp as any).owner_id !== userId) {
      return res.status(403).json(createErrorResponse(RESPONSE_CODES.AUTH.PERMISSION_DENIED, '无权限修改此应用'));
    }
    
    const app = await AppService.updateApp(req.params.id, req.body);
    res.json(createSuccessResponse('应用更新成功', app));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/apps/:id/delete - 删除单个应用 (需要管理员权限)
router.post('/:id/delete', requireRole(['admin', 'super_admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 权限检查：确保用户只能删除自己的应用
    const existingApp = await AppService.getAppById(req.params.id);
    if (!existingApp) {
      return res.status(404).json(createErrorResponse(RESPONSE_CODES.APP.NOT_FOUND, '应用不存在'));
    }
    
    const userRole = req.user!.role;
    const userId = req.user!.userId;
    
    if (userRole !== 'super_admin' && (existingApp as any).owner_id !== userId) {
      return res.status(403).json(createErrorResponse(RESPONSE_CODES.AUTH.PERMISSION_DENIED, '无权限删除此应用'));
    }
    
    const deleted = await AppService.deleteApp(req.params.id);
    if (deleted) {
      res.status(200).json(createSuccessResponse('应用删除成功'));
    } else {
      res.status(404).json(createErrorResponse(RESPONSE_CODES.APP.NOT_FOUND));
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/apps/delete-all - 删除所有应用 (需要超级管理员权限)
router.post('/delete-all', requireRole('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deletedCount = await AppService.clearAllApps();
    res.json(createSuccessResponse(`成功删除 ${deletedCount} 个应用`, { deletedCount }));
  } catch (error) {
    next(error);
  }
});

export default router; 