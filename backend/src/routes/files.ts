import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const AppInfoParser = require('app-info-parser');
import { FileService } from '../services/FileService';
import { config } from '../config/config';
import { IconDecoder } from '../utils/iconDecoder';
import { uploadLogger } from '../utils/uploadLogger';
import { RESPONSE_CODES, createSuccessResponse, createErrorResponse } from '../utils/responseCodes';
import { generateId } from '../utils/idGenerator';

const router: Router = Router();

// 配置临时文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(config.uploadDir, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `temp_${timestamp}_${generateId()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.maxFileSize, // 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.ipa', '.apk'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 .ipa 或 .apk 文件'));
    }
  }
});

// POST /api/v1/files/upload - 上传文件到临时目录并解析
router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;

    if (!file) {
      uploadLogger.logFileProcessing('no_file', 'No file uploaded to temp area');
      return res.status(400).json(createErrorResponse(RESPONSE_CODES.FILE.MISSING_FILE));
    }

    uploadLogger.logFileReceived(file.originalname, file.size, 'temp_upload');

    try {
      uploadLogger.logFileParseStart(file.path);
      
      // 解析应用信息
      const parser = new AppInfoParser(file.path);
      const appInfo = await parser.parse();

      uploadLogger.logFileParseSuccess(file.path, appInfo);

      // 处理图标
      let iconDataUrl = undefined;
      let iconError = null;

      if (appInfo.icon) {
        if (typeof appInfo.icon === 'string' && appInfo.icon.startsWith('data:')) {
          iconDataUrl = appInfo.icon;
        } else if (Buffer.isBuffer(appInfo.icon)) {
          const result = IconDecoder.processIcon(appInfo.icon);
          if (result.dataUrl) {
            iconDataUrl = result.dataUrl;
          } else {
            iconError = result.error;
          }
        } else {
          iconError = '图标格式不支持';
        }
      } else {
        iconError = '没有找到图标数据';
      }

      // 如果没有图标，使用默认图标
      if (!iconDataUrl) {
        const platform = path.extname(file.originalname).toLowerCase() === '.ipa' ? 'ios' : 'android';
        iconDataUrl = IconDecoder.generateFallbackIcon(platform);
      }

      // 准备解析后的应用信息
      const parsedInfo = {
        name: appInfo.CFBundleDisplayName || appInfo.application?.label?.[0] || 'Unknown App',
        bundleId: appInfo.CFBundleIdentifier || appInfo.package || 'unknown.bundle.id',
        versionName: appInfo.CFBundleShortVersionString || appInfo.versionName || '1.0.0',
        versionCode: String(parseInt(appInfo.CFBundleVersion || appInfo.versionCode || '1', 10)),
        platform: path.extname(file.originalname).toLowerCase() === '.ipa' ? 'ios' : 'android',
        icon: iconDataUrl,
        iconError: iconError
      };

      // 创建文件记录
      const fileRecord = await FileService.createTempFile({
        originalName: file.originalname,
        tempPath: file.path,
        size: file.size,
        mimeType: file.mimetype,
        parsedInfo: parsedInfo
      });

      uploadLogger.logFileProcessing(file.path, `Created temp file record: ${fileRecord.id}`);

      // 设置自动清理定时器
      setTimeout(async () => {
        await FileService.cleanupExpiredTempFiles(30);
      }, 30 * 60 * 1000); // 30分钟

      return res.json(createSuccessResponse('文件上传成功', {
        fileId: fileRecord.id,
        appInfo: parsedInfo
      }));

    } catch (parseError) {
      uploadLogger.logFileParseError(file.path, parseError);
      
      // 删除上传的文件
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          uploadLogger.logFileCleanup(file.path, 'Parse error cleanup');
        } catch (cleanupError) {
          uploadLogger.logFileCleanupError(file.path, cleanupError);
        }
      }

      return res.status(400).json(createErrorResponse(RESPONSE_CODES.FILE.PARSE_ERROR));
    }

  } catch (error) {
    uploadLogger.logFileProcessing(req.file?.path || 'unknown', 'General upload error');
    
    // 清理上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        uploadLogger.logFileCleanup(req.file.path, 'General error cleanup');
      } catch (cleanupError) {
        uploadLogger.logFileCleanupError(req.file.path, cleanupError);
      }
    }
    next(error);
  }
});

// GET /api/v1/files/:fileId - 获取文件信息
router.get('/:fileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;
    const file = await FileService.getFileById(fileId);
    
    if (!file) {
      return res.status(404).json(createErrorResponse(RESPONSE_CODES.FILE.NOT_FOUND));
    }

    res.json(createSuccessResponse('获取文件信息成功', file));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/files/:fileId/delete - 删除文件 (原DELETE)
router.post('/:fileId/delete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;
    const deleted = await FileService.deleteFile(fileId);
    
    if (deleted) {
      res.status(200).json(createSuccessResponse('文件删除成功'));
    } else {
      res.status(404).json(createErrorResponse(RESPONSE_CODES.FILE.NOT_FOUND));
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/files/cleanup/temp - 清理过期临时文件
router.post('/cleanup/temp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cleanedCount = await FileService.cleanupExpiredTempFiles(30);
    
    res.json(createSuccessResponse(`清理了 ${cleanedCount} 个过期临时文件`, { cleanedCount }));
  } catch (error) {
    next(error);
  }
});

export default router; 