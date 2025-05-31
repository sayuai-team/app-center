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

// GET /api/v1/apps - 获取所有应用
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apps = await AppService.getAllApps();
    res.json(createSuccessResponse('获取应用列表成功', apps));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/apps - 创建新应用 (需要管理员权限)
router.post('/', requireRole(['admin', 'super_admin']), validateApp, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = await AppService.createApp(req.body);
    res.status(200).json(createSuccessResponse('应用创建成功', app));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/apps/:id - 获取单个应用
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = await AppService.getAppById(req.params.id);
    res.json(createSuccessResponse('获取应用信息成功', app));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/apps/:id/update - 更新应用 (需要管理员权限)
router.post('/:id/update', requireRole(['admin', 'super_admin']), validateApp, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = await AppService.updateApp(req.params.id, req.body);
    res.json(createSuccessResponse('应用更新成功', app));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/apps/:id/delete - 删除单个应用 (需要管理员权限)
router.post('/:id/delete', requireRole(['admin', 'super_admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
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