import path from 'path';
import dotenv from 'dotenv';

// Load environment variables first, before any other imports
// Load .env from the backend directory (where this server runs)
console.log('🔍 当前工作目录:', process.cwd());

// Check if we're running from project root or backend directory
const envPath = process.cwd().endsWith('/backend') 
  ? path.resolve(process.cwd(), '.env')
  : path.resolve(process.cwd(), 'backend', '.env');

console.log('🔍 查找 .env 文件路径:', envPath);

const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.log('❌ .env 文件加载失败:', envResult.error.message);
} else {
  console.log('✅ .env 文件加载成功');
  console.log('🔍 PORT 环境变量:', process.env.PORT);
}

// Now import everything else after environment variables are loaded
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'https';
import { readFileSync } from 'fs';

import { errorHandler, setupGlobalErrorHandlers } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger } from './middleware/requestLogger';
import { config } from './config/config';
import { ConfigValidator } from './utils/configValidator';

// Import routes
import appRoutes from './routes/apps';
import authRoutes from './routes/auth';
import downloadRoutes from './routes/download';
import versionRoutes from './routes/versions';
import fileRoutes from './routes/files';
import healthRoutes from './routes/health';

// 启用全局错误处理
setupGlobalErrorHandlers();

// 运行配置安全检查
const securityValidation = ConfigValidator.validateSecurity();
ConfigValidator.printValidationResult(securityValidation);

// 如果在生产环境有严重安全问题，拒绝启动
if (config.nodeEnv === 'production' && !securityValidation.isValid) {
  console.error('🚨 生产环境安全检查未通过，服务器拒绝启动！');
  console.error('请修复上述安全问题后重新启动服务器。');
  process.exit(1);
}

const app: Express = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'development' ? 1000 : 100, // 开发环境允许更多请求
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // 允许的域名模式 - 支持 HTTP 和 HTTPS
    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      /^https?:\/\/192\.168\.\d+\.\d+:3000$/,  // 允许局域网IP (HTTP/HTTPS)
      /^https?:\/\/127\.0\.0\.1:3000$/,        // 允许127.0.0.1 (HTTP/HTTPS)
    ];
    
    // 如果没有origin（如直接访问API），也允许
    if (!origin) return callback(null, true);
    
    // 检查origin是否在允许列表中
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      return allowedOrigin.test(origin);
    });
    
    console.log(`🔐 CORS检查: ${origin} -> ${isAllowed ? '✅ 允许' : '❌ 拒绝'}`);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 详细请求日志 (在 body parser 之后，确保能记录请求体)
app.use(requestLogger);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check routes
app.use('/health', healthRoutes);

// API routes
app.use('/api/v1/apps', appRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/download', downloadRoutes);
app.use('/api/v1/apps', versionRoutes);
app.use('/api/v1/files', fileRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Server startup
const startServer = () => {
  const port = config.port;
  const host = config.host;

  if (config.enableHttps) {
    try {
      const httpsOptions = {
        key: readFileSync(config.sslKeyPath!),
        cert: readFileSync(config.sslCertPath!),
      };

      createServer(httpsOptions, app).listen(port, host, () => {
        console.log(`🚀 HTTPS Server running on https://${host}:${port}`);
        console.log(`📱 Environment: ${config.nodeEnv}`);
        console.log(`🔒 HTTPS enabled`);
      });
    } catch (error) {
      console.error('❌ Failed to start HTTPS server:', error);
      console.log('🔄 Falling back to HTTP server...');
      startHttpServer();
    }
  } else {
    startHttpServer();
  }

  function startHttpServer() {
    app.listen(port, host, () => {
      console.log(`🚀 HTTP Server running on http://${host}:${port}`);
      console.log(`📱 Environment: ${config.nodeEnv}`);
      console.log(`🌐 CORS enabled for: ${config.corsOrigin}`);
    });
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app; 