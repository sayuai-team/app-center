import { Router, Request, Response, NextFunction } from 'express';
import * as path from 'path';
import fs from 'fs';
import { VersionService } from '../services/VersionService';
import { AppService } from '../services/AppService';
import { FileService } from '../services/FileService';
import { config } from '../config/config';
import { uploadLogger } from '../utils/uploadLogger';
import { Version } from '@app-center/shared';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validateVersion, limitRequestSize, preventSqlInjection } from '../middleware/validation';
import { RESPONSE_CODES, createSuccessResponse, createErrorResponse } from '../utils/responseCodes';
import { generateId } from '../utils/idGenerator';

const router: Router = Router();

// 添加基础安全中间件
router.use(limitRequestSize(10)); // 限制请求体大小为10MB (考虑到应用信息可能较大)
router.use(preventSqlInjection); // SQL注入防护

// 对所有版本API添加认证保护
router.use(authMiddleware);

// GET /api/v1/apps/:appId/versions - 获取应用的所有版本
router.get('/:appId/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId } = req.params;
    
    // 检查应用是否存在
    const app = await AppService.getAppById(appId);
    if (!app) {
      return res.status(404).json(createErrorResponse(RESPONSE_CODES.APP.NOT_FOUND));
    }

    const versions = await VersionService.getVersionsByAppId(appId);
    res.json(createSuccessResponse('获取版本列表成功', versions));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/apps/:appId/versions - 上传新版本 (需要管理员权限)
router.post('/:appId/versions', requireRole(['admin', 'super_admin']), validateVersion, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId } = req.params;
    const fileId = req.body.fileId;

    uploadLogger.logRequestDetails(req.method, req.url, req.body, !!req.body.confirm);

    // 检查应用是否存在
    const app = await AppService.getAppById(appId);
    if (!app) {
      uploadLogger.logFileProcessing('no_file', 'App not found');
      return res.status(404).json(createErrorResponse(RESPONSE_CODES.APP.NOT_FOUND));
    }

    if (!fileId) {
      uploadLogger.logFileProcessing('no_file', 'No file ID provided');
      return res.status(400).json(createErrorResponse(RESPONSE_CODES.FILE.MISSING_FILE, '请提供文件ID'));
    }

    uploadLogger.logFileReceived(fileId, 0, appId);

    try {
      uploadLogger.logFileParseStart(fileId);
      
      // 获取文件信息
      const fileInfo = await FileService.getFileById(fileId);
      if (!fileInfo || fileInfo.status !== 'temporary') {
        uploadLogger.logFileProcessing(fileId, 'File not found or not temporary');
        return res.status(404).json(createErrorResponse(RESPONSE_CODES.VERSION.INVALID_FILE));
      }

      uploadLogger.logFileParseSuccess(fileId, fileInfo);

      console.log('=== 文件记录信息 ===');
      console.log(JSON.stringify(fileInfo, null, 2));

      // 检查是否只是解析请求（未确认创建版本）
      if (!req.body.confirm) {
        uploadLogger.logFileProcessing(fileId, 'Parse only - no confirmation');
        
        // 直接返回已解析的应用信息
        return res.json(createSuccessResponse('文件解析成功', {
          appInfo: fileInfo.parsedInfo
        }));
      }

      uploadLogger.logVersionCreationStart(fileId, req.body);

      // 确认创建版本
      const { version, buildNumber, updateContent } = req.body;

      if (!version || !buildNumber) {
        return res.status(400).json(createErrorResponse(RESPONSE_CODES.VERSION.MISSING_FIELDS));
      }

      // 生成最终文件路径 - 为每个应用创建子文件夹
      const timestamp = Date.now();
      const ext = path.extname(fileInfo.originalName);
      const finalFilename = `${timestamp}_${generateId()}${ext}`;
      
      // 创建应用专用的文件夹，使用appId作为文件夹名
      const appFolder = path.join(config.uploadDir, appId);
      const finalPath = path.join(appFolder, finalFilename);

      // 确认文件，移动到正式目录
      const confirmed = await FileService.confirmFile(fileId, finalPath);
      if (!confirmed) {
        uploadLogger.logFileProcessing(fileId, 'Failed to confirm file');
        return res.status(500).json(createErrorResponse(RESPONSE_CODES.FILE.PROCESSING_ERROR));
      }

      // 创建下载URL
      const downloadUrl = `${req.protocol}://${req.get('host')}/uploads/${appId}/${finalFilename}`;

      // 更新应用的最新版本信息和解析出的应用信息
      const parsedInfo = fileInfo.parsedInfo;
      if (!parsedInfo) {
        uploadLogger.logFileProcessing(fileId, 'No parsed info available');
        return res.status(500).json(createErrorResponse(RESPONSE_CODES.FILE.PROCESSING_ERROR, '缺少解析信息'));
      }

      // 从文件名推断平台
      const platform = fileInfo.originalName.toLowerCase().endsWith('.ipa') ? 'iOS' : 'Android';

      // 创建版本记录
      const newVersion = await VersionService.createVersion({
        appId,
        version,
        buildNumber,
        updateContent: updateContent || '',
        uploadDate: new Date().toISOString(),
        size: (fileInfo.size / (1024 * 1024)).toFixed(2) + ' MB',
        status: 'active',
        fileName: fileInfo.originalName,
        filePath: finalPath,
        downloadUrl,
        platform
      } as Omit<Version, 'id'>);

      uploadLogger.logVersionCreationSuccess(finalPath, newVersion.id);

      // 更新应用的最新版本信息和解析出的应用信息
      await AppService.updateApp(appId, {
        // 版本相关信息
        version,
        buildNumber,
        uploadDate: new Date().toISOString(),
        downloadUrl,
        // 从IPA/APK解析出的应用信息
        appName: parsedInfo.name,
        bundleId: parsedInfo.bundleId,
        icon: parsedInfo.icon,
        system: platform
      });

      console.log('✅ 已更新app表的应用信息:', {
        appName: parsedInfo.name,
        bundleId: parsedInfo.bundleId,
        system: platform,
        iconUpdated: !!parsedInfo.icon
      });

      res.status(200).json(createSuccessResponse('版本创建成功', newVersion));

    } catch (parseError) {
      uploadLogger.logFileParseError(fileId, parseError);
      console.error('Parse error:', parseError);

      return res.status(400).json(createErrorResponse(RESPONSE_CODES.VERSION.PARSE_ERROR));
    }

  } catch (error) {
    uploadLogger.logVersionCreationError(req.body.fileId || 'unknown', error);
    next(error);
  }
});

// GET /api/v1/apps/:appId/versions/:versionId - 获取单个版本
router.get('/:appId/versions/:versionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { versionId } = req.params;
    const version = await VersionService.getVersionById(versionId);
    
    if (!version) {
      return res.status(404).json(createErrorResponse(RESPONSE_CODES.VERSION.NOT_FOUND));
    }

    res.json(createSuccessResponse('获取版本信息成功', version));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/apps/:appId/versions/:versionId/update - 更新版本 (原PUT)
router.post('/:appId/versions/:versionId/update', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { versionId } = req.params;
    const updates = req.body;
    
    const updatedVersion = await VersionService.updateVersion(versionId, updates);
    
    if (!updatedVersion) {
      return res.status(404).json(createErrorResponse(RESPONSE_CODES.VERSION.NOT_FOUND));
    }

    res.json(createSuccessResponse('版本更新成功', updatedVersion));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/apps/:appId/versions/:versionId/delete - 删除版本 (原DELETE)
router.post('/:appId/versions/:versionId/delete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { versionId } = req.params;
    
    // 获取版本信息
    const version = await VersionService.getVersionById(versionId);
    if (!version) {
      return res.status(404).json(createErrorResponse(RESPONSE_CODES.VERSION.NOT_FOUND));
    }

    // 删除版本记录
    const deleted = await VersionService.deleteVersion(versionId);
    
    if (deleted) {
      // 删除对应的文件
      if (version.filePath && fs.existsSync(version.filePath)) {
        try {
          fs.unlinkSync(version.filePath);
          uploadLogger.logFileCleanup(version.filePath, 'Version deletion cleanup');
        } catch (cleanupError) {
          uploadLogger.logFileCleanupError(version.filePath, cleanupError);
        }
      }
      
      res.status(200).json(createSuccessResponse('版本删除成功'));
    } else {
      res.status(404).json(createErrorResponse(RESPONSE_CODES.VERSION.NOT_FOUND));
    }
  } catch (error) {
    next(error);
  }
});

export default router; 