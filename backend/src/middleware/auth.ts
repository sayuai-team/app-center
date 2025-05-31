import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { getDatabase } from '../utils/database';
import { RESPONSE_CODES, createErrorResponse } from '../utils/responseCodes';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * JWT认证中间件
 * 适合企业内部使用的简化版本
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      res.status(401).json(createErrorResponse(RESPONSE_CODES.AUTH.TOKEN_MISSING));
      return;
    }

    // 验证JWT token
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    
    // 检查用户是否仍然存在且有效
    const db = await getDatabase();
    const user = db.get(
      'SELECT id, username, email, role FROM users WHERE id = ? AND isActive = 1', 
      [decoded.userId]
    );
    
    if (!user) {
      res.status(401).json(createErrorResponse(RESPONSE_CODES.AUTH.USER_NOT_FOUND));
      return;
    }

    // 将用户信息添加到请求对象
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json(createErrorResponse(RESPONSE_CODES.AUTH.TOKEN_EXPIRED, '认证令牌无效'));
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json(createErrorResponse(RESPONSE_CODES.AUTH.TOKEN_EXPIRED));
      return;
    }

    res.status(500).json(createErrorResponse(RESPONSE_CODES.SYSTEM.INTERNAL_ERROR, '认证验证失败'));
  }
};

/**
 * 角色权限中间件
 * 检查用户是否有指定角色权限
 */
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(createErrorResponse(RESPONSE_CODES.AUTH.TOKEN_MISSING, '未认证用户'));
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json(createErrorResponse(RESPONSE_CODES.AUTH.PERMISSION_DENIED));
      return;
    }

    next();
  };
};

/**
 * 可选认证中间件
 * 如果有token则验证，没有则继续（适用于某些公开API）
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    const db = await getDatabase();
    const user = db.get(
      'SELECT id, username, email, role FROM users WHERE id = ? AND isActive = 1', 
      [decoded.userId]
    );
    
    if (user) {
      req.user = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
    }
  } catch (error) {
    // 可选认证失败时不阻止请求，只是不设置user信息
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Optional auth failed:', errorMessage);
  }

  next();
}; 