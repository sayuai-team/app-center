import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { RESPONSE_CODES, createErrorResponse } from '../utils/responseCodes';
import { generateId } from '../utils/idGenerator';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: string;
}

// 创建错误日志目录
const errorLogsDir = path.join(process.cwd(), 'logs', 'errors');
if (!fs.existsSync(errorLogsDir)) {
  fs.mkdirSync(errorLogsDir, { recursive: true });
}

// 获取北京时间字符串
function getBeijingTime(): string {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return beijingTime.toISOString().replace('T', ' ').substring(0, 23);
}

// 获取今天的错误日志文件路径
function getTodayErrorLogFile(): string {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const today = beijingTime.toISOString().split('T')[0];
  return path.join(errorLogsDir, `error-${today}.log`);
}

// 写入错误日志
function writeErrorLog(errorInfo: any): void {
  try {
    const logFile = getTodayErrorLogFile();
    const logEntry = `${JSON.stringify(errorInfo)}\n`;
    fs.appendFileSync(logFile, logEntry);
  } catch (error) {
    console.error('写入错误日志文件失败:', error);
  }
}

// 生成请求ID用于追踪
function generateRequestId(): string {
  return generateId();
}

// 创建操作错误类
export class AppOperationalError extends Error implements AppError {
  statusCode: number;
  status: string;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = 'AppOperationalError';
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 常见错误类型
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
} as const;

// 错误分类函数
function categorizeError(err: AppError): string {
  if (err.code) return err.code;
  
  if (err.statusCode === 401) return ErrorTypes.AUTHENTICATION_ERROR;
  if (err.statusCode === 403) return ErrorTypes.AUTHORIZATION_ERROR;
  if (err.statusCode === 404) return ErrorTypes.NOT_FOUND_ERROR;
  if (err.statusCode === 409) return ErrorTypes.DUPLICATE_ERROR;
  if (err.statusCode === 429) return ErrorTypes.RATE_LIMIT_ERROR;
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    return ErrorTypes.VALIDATION_ERROR;
  }
  
  // 检查错误消息中的关键词
  const message = err.message.toLowerCase();
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorTypes.VALIDATION_ERROR;
  }
  if (message.includes('file') || message.includes('upload')) {
    return ErrorTypes.FILE_ERROR;
  }
  if (message.includes('database') || message.includes('sqlite')) {
    return ErrorTypes.DATABASE_ERROR;
  }
  
  return 'UNKNOWN_ERROR';
}

// 生成用户友好的错误消息
function getUserFriendlyMessage(errorType: string, originalMessage: string): string {
  const friendlyMessages = {
    [ErrorTypes.VALIDATION_ERROR]: '请求数据格式错误，请检查输入内容',
    [ErrorTypes.AUTHENTICATION_ERROR]: '认证失败，请重新登录',
    [ErrorTypes.AUTHORIZATION_ERROR]: '权限不足，无法执行此操作',
    [ErrorTypes.NOT_FOUND_ERROR]: '请求的资源不存在',
    [ErrorTypes.DUPLICATE_ERROR]: '资源已存在，无法重复创建',
    [ErrorTypes.FILE_ERROR]: '文件处理失败，请检查文件格式',
    [ErrorTypes.DATABASE_ERROR]: '数据库操作失败，请稍后重试',
    [ErrorTypes.RATE_LIMIT_ERROR]: '请求过于频繁，请稍后重试',
  };

  return friendlyMessages[errorType as keyof typeof friendlyMessages] || originalMessage;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = generateRequestId();
  const timestamp = getBeijingTime();
  
  // 设置默认错误状态
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // 分类错误
  const errorType = categorizeError(err);
  
  // 构建详细的错误信息用于日志记录
  const errorInfo = {
    requestId,
    timestamp,
    errorType,
    statusCode: err.statusCode,
    message: err.message,
    stack: err.stack,
    request: {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      userId: req.user?.userId,
      userRole: req.user?.role,
    },
    body: req.body && Object.keys(req.body).length > 0 ? 
      (() => {
        const sanitized = { ...req.body };
        if (sanitized.password) sanitized.password = '[HIDDEN]';
        return sanitized;
      })() : undefined,
    query: req.query && Object.keys(req.query).length > 0 ? req.query : undefined,
    params: req.params && Object.keys(req.params).length > 0 ? req.params : undefined,
  };

  // 根据错误严重性记录不同级别的日志
  if (err.statusCode && err.statusCode >= 500) {
    // 服务器错误 - 记录详细日志
    console.error(`❌ [${timestamp}] 服务器错误 [${requestId}]:`, errorInfo);
    writeErrorLog(errorInfo);
  } else if (err.statusCode && err.statusCode >= 400) {
    // 客户端错误 - 记录简化日志
    console.warn(`⚠️  [${timestamp}] 客户端错误 [${requestId}]: ${err.statusCode} - ${err.message} | ${req.method} ${req.url}`);
  } else {
    // 未知错误 - 记录详细日志
    console.error(`🚨 [${timestamp}] 未知错误 [${requestId}]:`, errorInfo);
    writeErrorLog(errorInfo);
  }

  // 生成标准错误码
  let errorCode: string = RESPONSE_CODES.SYSTEM.INTERNAL_ERROR;
  
  // 根据错误类型映射错误码
  switch (errorType) {
    case ErrorTypes.AUTHENTICATION_ERROR:
      errorCode = RESPONSE_CODES.AUTH.TOKEN_EXPIRED;
      break;
    case ErrorTypes.AUTHORIZATION_ERROR:
      errorCode = RESPONSE_CODES.AUTH.PERMISSION_DENIED;
      break;
    case ErrorTypes.NOT_FOUND_ERROR:
      errorCode = RESPONSE_CODES.APP.NOT_FOUND; // 通用的 NOT_FOUND
      break;
    case ErrorTypes.VALIDATION_ERROR:
      errorCode = RESPONSE_CODES.SYSTEM.VALIDATION_ERROR;
      break;
    case ErrorTypes.RATE_LIMIT_ERROR:
      errorCode = RESPONSE_CODES.SYSTEM.RATE_LIMIT;
      break;
    case ErrorTypes.FILE_ERROR:
      errorCode = RESPONSE_CODES.FILE.PROCESSING_ERROR;
      break;
    default:
      errorCode = RESPONSE_CODES.SYSTEM.INTERNAL_ERROR;
  }

  // 根据环境返回不同的响应
  if (process.env.NODE_ENV === 'development') {
    // 开发环境 - 返回详细错误信息（保持原有格式用于调试）
    res.status(err.statusCode).json({
      code: errorCode,
      message: err.message,
      data: {
        type: errorType,
        stack: err.stack,
        requestId,
        timestamp,
      },
    });
  } else {
    // 生产环境 - 返回安全的错误信息
    if (err.isOperational) {
      // 操作错误 - 可以安全地向用户显示
      res.status(err.statusCode).json(createErrorResponse(
        errorCode,
        getUserFriendlyMessage(errorType, err.message),
        { requestId, timestamp }
      ));
    } else {
      // 编程错误 - 不泄露详细信息
      res.status(500).json(createErrorResponse(
        RESPONSE_CODES.SYSTEM.INTERNAL_ERROR,
        '服务器内部错误，请稍后重试',
        { requestId, timestamp }
      ));
    }
  }
};

// 异步错误捕获
export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 全局未捕获异常处理
export const setupGlobalErrorHandlers = () => {
  // 捕获未处理的Promise拒绝
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const timestamp = getBeijingTime();
    console.error(`💥 [${timestamp}] 未处理的Promise拒绝:`, { reason, promise });
    
    const errorInfo = {
      type: 'unhandledRejection',
      timestamp,
      reason: reason?.message || reason,
      stack: reason?.stack,
    };
    writeErrorLog(errorInfo);
  });

  // 捕获未捕获的异常
  process.on('uncaughtException', (error: Error) => {
    const timestamp = getBeijingTime();
    console.error(`💥 [${timestamp}] 未捕获的异常:`, error);
    
    const errorInfo = {
      type: 'uncaughtException',
      timestamp,
      message: error.message,
      stack: error.stack,
    };
    writeErrorLog(errorInfo);
    
    // 优雅关闭进程
    process.exit(1);
  });
}; 