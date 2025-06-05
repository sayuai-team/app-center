import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

// 常用验证规则
export class ValidationRules {
  
  /**
   * 验证邮箱格式
   */
  static isValidEmail(email: string): boolean {
    return validator.isEmail(email);
  }

  /**
   * 验证密码强度（企业内部使用的简化规则）
   */
  static isValidPassword(password: string): { valid: boolean; message?: string } {
    if (!password || password.length < 6) {
      return { valid: false, message: '密码长度至少为6位' };
    }
    if (password.length > 128) {
      return { valid: false, message: '密码长度不能超过128位' };
    }
    return { valid: true };
  }

  /**
   * 验证用户名格式
   */
  static isValidUsername(username: string): { valid: boolean; message?: string } {
    if (!username || username.length < 3) {
      return { valid: false, message: '用户名长度至少为3位' };
    }
    if (username.length > 50) {
      return { valid: false, message: '用户名长度不能超过50位' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { valid: false, message: '用户名只能包含字母、数字、下划线和连字符' };
    }
    return { valid: true };
  }

  /**
   * 验证应用名称
   */
  static isValidAppName(name: string): { valid: boolean; message?: string } {
    if (!name || name.trim().length === 0) {
      return { valid: false, message: '应用名称不能为空' };
    }
    if (name.length > 100) {
      return { valid: false, message: '应用名称长度不能超过100字符' };
    }
    return { valid: true };
  }

  /**
   * 验证版本号格式
   */
  static isValidVersion(version: string): { valid: boolean; message?: string } {
    if (!version || version.trim().length === 0) {
      return { valid: false, message: '版本号不能为空' };
    }
    // 支持语义化版本号格式：1.0.0, 1.0.0-beta, 等
    if (!/^[0-9]+(\.[0-9]+)*(-[a-zA-Z0-9.-]+)?$/.test(version.trim())) {
      return { valid: false, message: '版本号格式无效，请使用如：1.0.0 或 1.0.0-beta 格式' };
    }
    return { valid: true };
  }

  /**
   * 验证构建号（纯数字）
   */
  static isValidBuildNumber(buildNumber: string | number): { valid: boolean; message?: string } {
    const num = Number(buildNumber);
    if (!Number.isInteger(num) || num <= 0) {
      return { valid: false, message: '构建号必须是正整数' };
    }
    if (num > 999999999) {
      return { valid: false, message: '构建号过大' };
    }
    return { valid: true };
  }

  /**
   * 清理和验证字符串输入
   */
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (!input) return '';
    // 移除潜在危险字符，但保留中文和常用符号
    const cleaned = input.trim().replace(/[<>]/g, '');
    return cleaned.substring(0, maxLength);
  }
}

/**
 * 登录数据验证中间件
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, username, password } = req.body;

  // 必须提供邮箱或用户名
  if (!email && !username) {
    res.status(400).json({
      success: false,
      message: '请提供邮箱或用户名'
    });
    return;
  }

  // 如果提供了邮箱，验证格式
  if (email && !ValidationRules.isValidEmail(email)) {
    res.status(400).json({
      success: false,
      message: '邮箱格式无效'
    });
    return;
  }

  // 如果提供了用户名，验证格式
  if (username) {
    const usernameValidation = ValidationRules.isValidUsername(username);
    if (!usernameValidation.valid) {
      res.status(400).json({
        success: false,
        message: usernameValidation.message
      });
      return;
    }
  }

  // 验证密码
  const passwordValidation = ValidationRules.isValidPassword(password);
  if (!passwordValidation.valid) {
    res.status(400).json({
      success: false,
      message: passwordValidation.message
    });
    return;
  }

  next();
};

/**
 * 注册数据验证中间件
 */
export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const { username, email, password } = req.body;

  // 验证用户名
  const usernameValidation = ValidationRules.isValidUsername(username);
  if (!usernameValidation.valid) {
    res.status(400).json({
      success: false,
      message: usernameValidation.message
    });
    return;
  }

  // 验证邮箱
  if (!ValidationRules.isValidEmail(email)) {
    res.status(400).json({
      success: false,
      message: '邮箱格式无效'
    });
    return;
  }

  // 验证密码
  const passwordValidation = ValidationRules.isValidPassword(password);
  if (!passwordValidation.valid) {
    res.status(400).json({
      success: false,
      message: passwordValidation.message
    });
    return;
  }

  next();
};

/**
 * 应用创建/更新验证中间件
 */
export const validateApp = (req: Request, res: Response, next: NextFunction): void => {
  const { name, appName, bundleId, description } = req.body;

  // 验证应用名称 (支持 name 或 appName 字段)
  const appNameToValidate = appName || name;
  const nameValidation = ValidationRules.isValidAppName(appNameToValidate);
  if (!nameValidation.valid) {
    res.status(400).json({
      success: false,
      message: nameValidation.message
    });
    return;
  }

  // 验证Bundle ID (如果提供)
  if (bundleId && (typeof bundleId !== 'string' || bundleId.length > 255)) {
    res.status(400).json({
      success: false,
      message: 'Bundle ID格式无效'
    });
    return;
  }

  // 清理描述字段
  if (description) {
    req.body.description = ValidationRules.sanitizeString(description, 2000);
  }

  next();
};

/**
 * 版本创建验证中间件
 */
export const validateVersion = (req: Request, res: Response, next: NextFunction): void => {
  const { version, buildNumber, updateContent } = req.body;

  // 验证版本号
  const versionValidation = ValidationRules.isValidVersion(version);
  if (!versionValidation.valid) {
    res.status(400).json({
      success: false,
      message: versionValidation.message
    });
    return;
  }

  // 验证构建号
  const buildValidation = ValidationRules.isValidBuildNumber(buildNumber);
  if (!buildValidation.valid) {
    res.status(400).json({
      success: false,
      message: buildValidation.message
    });
    return;
  }

  // 清理更新内容
  if (updateContent) {
    req.body.updateContent = ValidationRules.sanitizeString(updateContent, 5000);
  }

  next();
};

/**
 * 通用请求大小限制中间件
 */
export const limitRequestSize = (maxSizeInMB: number = 10) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (contentLength > maxSizeInBytes) {
      res.status(413).json({
        success: false,
        message: `请求体过大，最大允许 ${maxSizeInMB}MB`
      });
      return;
    }

    next();
  };
};

/**
 * SQL注入防护（基础检查）
 */
export const preventSqlInjection = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\bOR\b.*=.*\bOR\b)/i,
    /('.*'|".*")/
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  // 检查查询参数、路径参数和请求体
  const allData = { ...req.query, ...req.params, ...req.body };
  
  if (checkValue(allData)) {
    console.warn('🚨 疑似SQL注入攻击:', req.ip, req.url, allData);
    res.status(400).json({
      success: false,
      message: '请求包含非法字符'
    });
    return;
  }

  next();
}; 