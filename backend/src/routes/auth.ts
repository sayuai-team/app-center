import { Router } from 'express';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../utils/database';
import { config } from '../config/config';
import { validateLogin, validateRegister, limitRequestSize, preventSqlInjection } from '../middleware/validation';
import { asyncErrorHandler } from '../middleware/errorHandler';
import { RESPONSE_CODES, createSuccessResponse, createErrorResponse } from '../utils/responseCodes';
import { generateId } from '../utils/idGenerator';

const router: Router = Router();

// 对所有认证路由添加基础安全中间件
router.use(limitRequestSize(1)); // 限制请求体大小为1MB
router.use(preventSqlInjection); // SQL注入防护

// 登录接口
router.post('/login', validateLogin, asyncErrorHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!password || (!username && !email)) {
    return res.status(400).json(createErrorResponse(RESPONSE_CODES.AUTH.INVALID_REQUEST));
  }

  const db = await getDatabase();
  
  // 根据用户名或邮箱查找用户
  let user;
  if (email) {
    user = db.get('SELECT * FROM users WHERE email = ? AND isActive = 1', [email]);
  } else {
    user = db.get('SELECT * FROM users WHERE username = ? AND isActive = 1', [username]);
  }

  if (!user) {
    return res.status(401).json(createErrorResponse(RESPONSE_CODES.AUTH.INVALID_CREDENTIALS));
  }

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json(createErrorResponse(RESPONSE_CODES.AUTH.INVALID_CREDENTIALS));
  }

  // 生成JWT token
  const token = jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role 
    },
    config.jwtSecret,
    { expiresIn: '24h' }
  );

  // 更新最后登录时间
  db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

  res.json(createSuccessResponse('登录成功', {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  }));
}));

// 注册接口
router.post('/register', validateRegister, asyncErrorHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json(createErrorResponse(RESPONSE_CODES.AUTH.MISSING_FIELDS));
  }

  if (password.length < 6) {
    return res.status(400).json(createErrorResponse(RESPONSE_CODES.AUTH.PASSWORD_TOO_SHORT));
  }

  const db = await getDatabase();
  
  // 检查用户名和邮箱是否已存在
  const existingUser = db.get(
    'SELECT id FROM users WHERE username = ? OR email = ?', 
    [username, email]
  );

  if (existingUser) {
    return res.status(409).json(createErrorResponse(RESPONSE_CODES.AUTH.USER_EXISTS));
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);

  // 生成用户ID - 使用UUID
  const userId = generateId();

  // 创建用户
  db.run(
    `INSERT INTO users (id, username, email, password, role, isActive) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, username, email, hashedPassword, 'user', 1]
  );

  res.status(200).json(createSuccessResponse('用户注册成功', {
    id: userId,
    username,
    email,
    role: 'user',
    createdAt: new Date().toISOString(),
  }));
}));

// 验证token接口
router.get('/verify', asyncErrorHandler(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json(createErrorResponse(RESPONSE_CODES.AUTH.TOKEN_MISSING));
  }

  const decoded = jwt.verify(token, config.jwtSecret) as any;
  
  const db = await getDatabase();
  const user = db.get('SELECT id, username, email, role FROM users WHERE id = ? AND isActive = 1', [decoded.userId]);
  
  if (!user) {
    return res.status(401).json(createErrorResponse(RESPONSE_CODES.AUTH.USER_NOT_FOUND));
  }

  res.json(createSuccessResponse('Token 验证成功', { user }));
}));

export default router; 