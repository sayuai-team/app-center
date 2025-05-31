import { Router, Request, Response } from 'express';
import { getDatabase } from '../utils/database';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config/config';

const router: Router = Router();

// 基础健康检查
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// 详细健康检查
router.get('/detailed', async (req: Request, res: Response) => {
  const checks = {
    database: 'unknown',
    filesystem: 'unknown',
    memory: 'unknown',
    diskSpace: 'unknown',
  };

  const startTime = Date.now();

  try {
    // 数据库检查
    const db = await getDatabase();
    const result = db.get('SELECT 1 as test');
    checks.database = result ? 'healthy' : 'unhealthy';
  } catch (error) {
    checks.database = 'unhealthy';
  }

  try {
    // 文件系统检查
    const uploadDir = config.uploadDir;
    if (fs.existsSync(uploadDir)) {
      const stats = fs.statSync(uploadDir);
      checks.filesystem = stats.isDirectory() ? 'healthy' : 'unhealthy';
    } else {
      checks.filesystem = 'unhealthy';
    }
  } catch (error) {
    checks.filesystem = 'unhealthy';
  }

  try {
    // 内存使用检查
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };
    
    // 如果堆使用超过1GB，标记为警告
    checks.memory = memUsageMB.heapUsed > 1024 ? 'warning' : 'healthy';
  } catch (error) {
    checks.memory = 'unhealthy';
  }

  try {
    // 磁盘空间检查（简单版本）
    const uploadPath = config.uploadDir;
    const stats = fs.statSync(uploadPath);
    checks.diskSpace = stats ? 'healthy' : 'unhealthy';
  } catch (error) {
    checks.diskSpace = 'unhealthy';
  }

  const responseTime = Date.now() - startTime;
  const overallStatus = Object.values(checks).every(check => check === 'healthy') ? 'healthy' : 'degraded';

  res.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    checks,
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  });
});

export default router; 