import { Router, Request, Response, NextFunction } from 'express';
import { AppService } from '../services/AppService';

const router: Router = Router();

// GET /api/v1/download/:downloadKey - 通过downloadKey获取应用信息
router.get('/:downloadKey', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { downloadKey } = req.params;
    const app = await AppService.getAppByDownloadKey(downloadKey);
    
    if (!app) {
      return res.status(404).json({
        success: false,
        message: '应用不存在或已下架'
      });
    }

    res.json(app);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/download/:downloadKey/plist - iOS plist文件
// 支持可选的版本查询参数：?version=versionId
router.get('/:downloadKey/plist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { downloadKey } = req.params;
    const { version: versionId } = req.query;
    
    const app = await AppService.getAppByDownloadKey(downloadKey);
    
    if (!app) {
      return res.status(404).json({
        success: false,
        message: '应用不存在或已下架'
      });
    }

    if (app.system !== 'iOS') {
      return res.status(400).json({
        success: false,
        message: '只有iOS应用才支持plist安装'
      });
    }

    let appInfo = app;
    let downloadUrl = app.downloadUrl;

    // 如果指定了版本ID，使用该版本的信息
    if (versionId && typeof versionId === 'string') {
      const { VersionService } = await import('../services/VersionService');
      const versionInfo = await VersionService.getVersionById(versionId);
      
      if (versionInfo && versionInfo.appId === app.id) {
        // 使用版本的信息覆盖应用信息
        appInfo = {
          ...app,
          version: versionInfo.version,
          buildNumber: versionInfo.buildNumber,
          downloadUrl: versionInfo.downloadUrl
        };
        downloadUrl = versionInfo.downloadUrl;
      }
    }

    // 构建可从外部访问的下载URL
    if (downloadUrl) {
      // 获取请求的host（去除端口号）
      const requestHost = req.get('host')?.replace(':8000', '') || '192.168.8.111';
      
      // 替换localhost为实际的IP，并确保使用HTTPS
      if (downloadUrl.includes('localhost')) {
        downloadUrl = downloadUrl.replace(/https?:\/\/localhost:8000/, `https://${requestHost}:8000`);
      } else {
        // 如果不是localhost，但是是HTTP，则转换为HTTPS
        downloadUrl = downloadUrl.replace(/^http:\/\//, 'https://');
      }
    }

    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>items</key>
  <array>
    <dict>
      <key>assets</key>
      <array>
        <dict>
          <key>kind</key>
          <string>software-package</string>
          <key>url</key>
          <string>${downloadUrl}</string>
        </dict>
      </array>
      <key>metadata</key>
      <dict>
        <key>bundle-identifier</key>
        <string>${appInfo.bundleId}</string>
        <key>bundle-version</key>
        <string>${appInfo.version}</string>
        <key>kind</key>
        <string>software</string>
        <key>title</key>
        <string>${appInfo.appName || appInfo.name}</string>
      </dict>
    </dict>
  </array>
</dict>
</plist>`;

    res.set({
      'Content-Type': 'application/x-plist',
      'Content-Disposition': `attachment; filename="${appInfo.appName || appInfo.name}.plist"`
    });
    res.send(plistContent);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/download/:downloadKey/versions - 获取应用的版本历史
router.get('/:downloadKey/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { downloadKey } = req.params;
    
    // 通过 downloadKey 获取应用信息
    const app = await AppService.getAppByDownloadKey(downloadKey);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: '应用不存在'
      });
    }

    // 获取该应用的所有版本
    const { VersionService } = await import('../services/VersionService');
    const versions = await VersionService.getVersionsByAppId(app.id);
    
    res.json({
      success: true,
      data: versions
    });
    
  } catch (error) {
    next(error);
  }
});

export default router; 