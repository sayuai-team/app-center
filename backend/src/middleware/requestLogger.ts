import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { generateId } from '../utils/idGenerator';

// 创建日志目录
const logsDir = path.join(process.cwd(), '../data/logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 日志级别枚举
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN', 
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

// 日志配置
const LOG_CONFIG = {
  // 是否输出到控制台
  console: {
    INFO: process.env.NODE_ENV === 'development', // 开发环境显示INFO日志
    WARN: true,  // 警告总是显示
    ERROR: true, // 错误总是显示
    DEBUG: process.env.LOG_DEBUG === 'true' // 调试日志需要明确开启
  },
  // 是否写入文件（所有日志都写文件）
  file: {
    INFO: true,
    WARN: true,
    ERROR: true,
    DEBUG: true
  }
};

// 获取北京时间字符串
function getBeijingTime(): string {
  const now = new Date();
  // 北京时间 = UTC时间 + 8小时
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return beijingTime.toISOString().replace('T', ' ').substring(0, 23);
}

// 获取今天的日志文件路径（使用北京时间的日期）
function getTodayLogFile(): string {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const today = beijingTime.toISOString().split('T')[0];
  return path.join(logsDir, `request-${today}.log`);
}

// 生成trace ID
function generateTraceId(): string {
  return generateId();
}

// 优化的日志写入函数
function writeLog(message: string, level: LogLevel = LogLevel.INFO): void {
  // 控制台输出（根据配置决定）
  if (LOG_CONFIG.console[level]) {
    // 根据日志级别使用不同的输出方法
    switch (level) {
      case LogLevel.ERROR:
        console.error(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      default:
        console.log(message);
    }
  }
  
  // 文件输出（根据配置决定）
  if (LOG_CONFIG.file[level]) {
    try {
      const logFile = getTodayLogFile();
      const logEntry = `${message}\n`;
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      // 文件写入失败时才输出到控制台（避免日志丢失）
      console.error('写入日志文件失败:', error);
    }
  }
}

// 格式化所有请求头为单行字符串
function formatAllHeaders(headers: any): string {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}

// 限制字符串长度并格式化JSON
function formatAndTruncate(obj: any, maxLength: number = 2000, singleLine: boolean = false): string {
  try {
    let str = typeof obj === 'string' ? obj : JSON.stringify(obj, null, singleLine ? 0 : 2);
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength) + '...[truncated]';
  } catch (e) {
    return '[Error formatting data]';
  }
}

// 数据脱敏处理
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[HIDDEN]';
    }
  }
  
  return sanitized;
}

// 判断是否应该记录响应体
function shouldLogResponseBody(statusCode: number, contentType?: string): boolean {
  // 错误响应总是记录
  if (statusCode >= 400) return true;
  
  // 生产环境不记录成功响应体（可配置）
  if (process.env.NODE_ENV === 'production' && process.env.LOG_RESPONSE_BODY !== 'true') {
    return false;
  }
  
  // 跳过二进制内容
  if (contentType) {
    const skipTypes = ['image/', 'video/', 'audio/', 'application/octet-stream'];
    if (skipTypes.some(type => contentType.includes(type))) {
      return false;
    }
  }
  
  return true;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = getBeijingTime();
  const traceId = generateTraceId();
  const method = req.method;
  const url = req.url;
  const origin = req.get('Origin') || req.get('Referer') || 'Direct';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  const userAgent = req.get('User-Agent')?.substring(0, 100) || 'Unknown';

  // 🚀 请求开始日志 - INFO级别（开发环境控制台+文件，生产环境仅文件）
  writeLog(`[${timestamp}]-[${traceId}] 🚀 ${method} ${url} | IP: ${ip} | UA: ${userAgent}`, LogLevel.INFO);
  
  // 📥 请求参数详情
  const requestDetails: any = {};
  
  // 查询参数
  if (req.query && Object.keys(req.query).length > 0) {
    requestDetails.query = req.query;
  }
  
  // 路径参数
  if (req.params && Object.keys(req.params).length > 0) {
    requestDetails.params = req.params;
  }
  
  // 请求体
  if (req.body && Object.keys(req.body).length > 0) {
    requestDetails.body = sanitizeData(req.body);
  }
  
  // 文件上传
  if (req.file) {
    requestDetails.file = {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    };
  }
  
  // 记录请求参数 - DEBUG级别（仅在明确启用时显示控制台）
  if (Object.keys(requestDetails).length > 0) {
    writeLog(`[${timestamp}]-[${traceId}] 📥 Request Data: ${formatAndTruncate(requestDetails, 2000, true)}`, LogLevel.DEBUG);
  }
  
  // 📋 重要请求头 - DEBUG级别
  const importantHeaders = {
    'content-type': req.get('Content-Type'),
    'authorization': req.get('Authorization') ? '[PRESENT]' : undefined,
    'origin': req.get('Origin'),
    'referer': req.get('Referer'),
    'user-agent': req.get('User-Agent')?.substring(0, 100)
  };
  
  // 过滤掉undefined值
  const filteredHeaders = Object.fromEntries(
    Object.entries(importantHeaders).filter(([_, value]) => value !== undefined)
  );
  
  if (Object.keys(filteredHeaders).length > 0) {
    writeLog(`[${timestamp}]-[${traceId}] 📋 Request Headers: ${JSON.stringify(filteredHeaders)}`, LogLevel.DEBUG);
  }

  // 记录响应时间
  const startTime = Date.now();
  
  // 劫持响应的json方法来捕获响应数据
  const originalJson = res.json;
  let responseData: any = null;
  
  res.json = function(obj: any) {
    responseData = obj;
    return originalJson.call(this, obj);
  };
  
  // 劫持响应的end方法来记录响应信息
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: () => void) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const responseTimestamp = getBeijingTime();
    const contentType = res.get('Content-Type');
    
    // 📤 响应数据
    let loggedResponseData = responseData;
    
    // 如果没有通过json方法发送，尝试解析chunk
    if (!loggedResponseData && chunk && shouldLogResponseBody(res.statusCode, contentType)) {
      try {
        if (typeof chunk === 'string') {
          // 尝试解析JSON
          try {
            loggedResponseData = JSON.parse(chunk);
          } catch {
            loggedResponseData = chunk;
          }
        } else if (Buffer.isBuffer(chunk)) {
          const chunkStr = chunk.toString('utf8');
          try {
            loggedResponseData = JSON.parse(chunkStr);
          } catch {
            loggedResponseData = chunkStr;
          }
        }
      } catch (e) {
        writeLog(`[${responseTimestamp}]-[${traceId}] ⚠️ Response parse error: ${e}`, LogLevel.WARN);
      }
    }
    
    // 记录响应数据 - DEBUG级别（成功）或WARN级别（错误）
    if (loggedResponseData) {
      const responseLevel = res.statusCode >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
      writeLog(`[${responseTimestamp}]-[${traceId}] 📤 Response Data: ${formatAndTruncate(loggedResponseData, 2000, true)}`, responseLevel);
    }
    
    // 📊 响应摘要 - 根据状态码决定日志级别
    const statusEmoji = res.statusCode >= 400 ? '❌' : res.statusCode >= 300 ? '🔄' : '✅';
    const summaryLevel = res.statusCode >= 400 ? LogLevel.ERROR : duration > 1000 ? LogLevel.WARN : LogLevel.INFO;
    writeLog(`[${responseTimestamp}]-[${traceId}] ${statusEmoji} ${res.statusCode} | ${duration}ms | ${contentType || 'unknown'}`, summaryLevel);
    
    // 🔚 请求结束分隔线 - 仅在有问题时显示
    if (res.statusCode >= 400 || duration > 1000) {
      writeLog(`[${responseTimestamp}]-[${traceId}] ════════════════════════════════════════`, res.statusCode >= 400 ? LogLevel.ERROR : LogLevel.WARN);
    }
    
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
}; 