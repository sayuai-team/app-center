import * as fs from 'fs';
import * as path from 'path';

class UploadLogger {
  private logFilePath: string;

  constructor() {
    // 创建logs目录
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // 使用日期作为日志文件名
    const today = new Date().toISOString().split('T')[0];
    this.logFilePath = path.join(logsDir, `upload-${today}.log`);
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private writeLog(level: string, message: string, data?: any): void {
    const timestamp = this.formatTimestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data || null
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      fs.appendFileSync(this.logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
    
    // 同时输出到控制台
    console.log(`[${timestamp}] ${level}: ${message}`, data ? data : '');
  }

  logFileReceived(fileName: string, fileSize: number, appId: string): void {
    this.writeLog('INFO', 'File upload received', {
      fileName,
      fileSize,
      appId,
      fileSizeMB: (fileSize / (1024 * 1024)).toFixed(2)
    });
  }

  logFileProcessing(filePath: string, operation: string): void {
    this.writeLog('INFO', `File processing: ${operation}`, {
      filePath,
      operation
    });
  }

  logFileParseStart(filePath: string): void {
    this.writeLog('INFO', 'Starting file parsing', {
      filePath
    });
  }

  logFileParseSuccess(filePath: string, appInfo: any): void {
    this.writeLog('SUCCESS', 'File parsing successful', {
      filePath,
      appName: appInfo.CFBundleDisplayName || appInfo.application?.label?.[0],
      bundleId: appInfo.CFBundleIdentifier || appInfo.package,
      version: appInfo.CFBundleShortVersionString || appInfo.versionName
    });
  }

  logFileParseError(filePath: string, error: any): void {
    this.writeLog('ERROR', 'File parsing failed', {
      filePath,
      error: error.message || error.toString()
    });
  }

  logVersionCreationStart(filePath: string, versionData: any): void {
    this.writeLog('INFO', 'Version creation started', {
      filePath,
      version: versionData.version,
      buildNumber: versionData.buildNumber
    });
  }

  logVersionCreationSuccess(filePath: string, versionId: string): void {
    this.writeLog('SUCCESS', 'Version created successfully', {
      filePath,
      versionId
    });
  }

  logVersionCreationError(filePath: string, error: any): void {
    this.writeLog('ERROR', 'Version creation failed', {
      filePath,
      error: error.message || error.toString()
    });
  }

  logFileCleanup(filePath: string, reason: string): void {
    this.writeLog('INFO', 'File cleanup', {
      filePath,
      reason
    });
  }

  logFileCleanupError(filePath: string, error: any): void {
    this.writeLog('ERROR', 'File cleanup failed', {
      filePath,
      error: error.message || error.toString()
    });
  }

  logTemporaryFileScheduled(filePath: string, cleanupTime: number): void {
    this.writeLog('INFO', 'Temporary file cleanup scheduled', {
      filePath,
      cleanupTimeMinutes: cleanupTime,
      scheduledFor: new Date(Date.now() + cleanupTime * 60 * 1000).toISOString()
    });
  }

  logTemporaryFileCleanup(filePath: string, exists: boolean): void {
    this.writeLog('INFO', 'Temporary file auto-cleanup executed', {
      filePath,
      fileExists: exists,
      result: exists ? 'deleted' : 'already_removed'
    });
  }

  logRequestDetails(method: string, url: string, body: any, confirm: boolean): void {
    this.writeLog('INFO', 'Upload request details', {
      method,
      url,
      hasConfirm: confirm,
      bodyKeys: Object.keys(body || {})
    });
  }
}

// 创建单例实例
export const uploadLogger = new UploadLogger(); 