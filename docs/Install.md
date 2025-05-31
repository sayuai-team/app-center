# App Center 安装部署指南

## 概述

App Center 是一个现代化的应用分发管理平台，支持 iOS 和 Android 应用的上传、管理和分发。本指南将帮助您从零开始部署 App Center 系统。

## 系统要求

### 环境要求
- **Node.js**: >= 18.0.0 (推荐使用 nvm 安装)
- **pnpm**: >= 8.0.0 (推荐) 或 npm >= 8.0.0
- **操作系统**: Linux / macOS / Windows
- **内存**: 最少 4GB RAM
- **磁盘空间**: 最少 50GB 可用空间
- **数据库**: SQLite
- **SSL证书**: 用于 HTTPS 部署（iOS IPA 安装必须使用 HTTPS）

### 可选依赖
- **数据库**: SQLite (默认) / PostgreSQL / MySQL
- **Web服务器**: Nginx (生产环境推荐)


## 1. 下载代码

### 从 GitHub 克隆
```bash
# 请将下面的URL替换为实际的仓库地址
git clone https://github.com/your-username/app-center.git
cd app-center
```

**注意**: 如果您是从其他源获取代码，请相应调整克隆命令。

## 2. 安装依赖

### 检查环境
```bash
# 运行环境检查脚本
sh shell/check-env.sh
```

**环境检查脚本功能：**
- 检查 Node.js 版本（要求 >= 18.0.0）
- 自动安装 pnpm（如未安装）
- 验证项目结构完整性
- 检查必要的配置文件

### 安装项目依赖
```bash
# 运行依赖安装脚本
sh shell/install-deps.sh
```

**依赖安装脚本功能：**
- 验证项目目录结构
- 安装所有依赖（根目录、前端、后端）
- 构建共享类型包
- 验证安装结果

## 3. 环境配置

### 后端配置
后端默认配置文件位于 `backend/.env`，包含以下配置：

**⚠️ 安全提醒**: 生产环境部署前必须修改所有默认密码和密钥！

**后端环境配置：**
```bash
# 服务器配置
PORT=8000
NODE_ENV=development

# 数据库配置 (SQLite 默认)
DATABASE_PATH=./data/database.sqlite

# JWT 密钥 (⚠️ 生产环境必须修改)
JWT_SECRET=your-super-secret-jwt-key-change-this

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=300MB

# HTTPS 配置 (可选)
ENABLE_HTTPS=false
SSL_KEY_PATH=../certs/server-key.pem
SSL_CERT_PATH=../certs/server-cert.pem
```

**生产环境部署清单：**
- ✅ 修改 `NODE_ENV=production`
- ✅ 更换 `JWT_SECRET` 为随机强密钥
- ✅ 配置SSL证书（iOS应用分发必需）

**默认管理员账号说明：**
- 默认账号通过数据库初始化脚本创建
- 超级管理员：`admin` / `Psw#123456`
- 普通管理员：`manager` / `Psw#123456`
- ⚠️ **部署后立即修改默认密码！**

### 前端配置
```bash
# 前端通常使用默认配置即可
# 如需自定义配置，在 frontend/ 目录创建 .env.local 文件

# 示例自定义配置 (可选)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
```

**前端可选配置项：**
- `NEXT_PUBLIC_API_URL`: 后端API地址
- `NEXT_PUBLIC_APP_NAME`: 应用名称
- `NEXT_PUBLIC_UPLOAD_MAX_SIZE`: 上传文件大小限制

## 4. 构建项目

### 开发环境构建
```bash
# 构建所有模块
pnpm run build
```

### 生产环境构建
```bash
# 设置生产环境
export NODE_ENV=production

# 构建
pnpm run build

# 验证构建结果
ls -la frontend/.next/
ls -la backend/dist/
```

## 5. 启动服务

### 开发模式启动
```bash
# 同时启动前后端开发服务器
pnpm run dev

# 或分别启动
pnpm run dev:backend    # 后端: http://localhost:8000
pnpm run dev:frontend   # 前端: http://localhost:3000
```

### 生产模式启动
```bash
# 启动所有服务
pnpm start

# 或分别启动
pnpm run start:backend   # 后端服务
pnpm run start:frontend  # 前端服务
```

## 6. 首次安装向导

### 访问安装向导
1. **启动服务后访问**: `http://localhost:3000/install`
2. **按照向导步骤完成配置**:

#### 步骤1：许可协议
- 阅读并同意软件许可协议

#### 步骤2：环境检测
- 自动检查系统要求和依赖
- 验证Node.js、pnpm版本
- 检查项目文件完整性

#### 步骤3：数据库初始化
- **自动创建**: 使用SQLite数据库，自动初始化表结构和基础数据
- **管理员账户**: 在界面中设置超级管理员信息
- **系统配置**: 基础系统参数设置

#### 步骤4：缓存配置 (可选)
- **内存缓存**: 默认使用内存缓存
- **Redis配置**: 可选配置Redis作为缓存后端

#### 步骤5：系统设置
- **站点名称**: 自定义应用中心名称
- **系统配置**: 基础系统参数设置
- **完成安装**: 自动跳转到管理后台

### 快速安装 (推荐)
一键完成安装，系统将自动使用以下配置：
- **数据库**: SQLite数据库，自动创建和初始化
- **管理员**: 在安装过程中设置管理员账户
- **缓存**: 内存缓存
- **站点名称**: App Center

### 高级功能
- **重新安装**: 如需重新配置，可访问 `/install?force=true`
- **备份恢复**: 安装前自动备份现有数据库
- **配置验证**: 每个步骤都有实时验证反馈

### 安装API接口 (开发者参考)
Web安装向导通过以下后端API完成数据库初始化：

```http
# 检查安装状态
GET /api/install/status

# 环境检测
GET /api/install/check-environment

# 验证安装环境
GET /api/install/validate

# 初始化数据库
POST /api/install/initialize-database
Content-Type: application/json
{
  "adminUsername": "admin",
  "adminEmail": "admin@example.com", 
  "adminPassword": "your-password",
  "siteName": "App Center"
}

# 完成安装
POST /api/install/complete
```

**安全说明**: 
- 安装API仅在系统未初始化时可用
- 完成安装后，这些接口将自动禁用
- 建议在生产环境中使用HTTPS

## 7. 验证安装

### 检查服务状态
```bash
# 检查后端服务
curl http://localhost:8000/api/health

# 检查前端服务
curl http://localhost:3000
```

### 登录管理后台
1. 访问: `http://localhost:3000/dashboard`
2. 使用安装时创建的管理员账户登录
3. 验证功能是否正常

## 8. 生产环境配置

### SSL 证书配置
```bash
# 生成自签名证书 (开发测试)
cd certs
openssl req -x509 -newkey rsa:4096 -keyout server-key.pem -out server-cert.pem -days 365 -nodes

# 或使用 Let's Encrypt (生产推荐)
certbot certonly --standalone -d yourdomain.com
```



### 进程管理 (PM2)
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

**ecosystem.config.js 示例：**
```javascript
module.exports = {
  apps: [
    {
      name: 'app-center-backend',
      script: './backend/dist/server.js',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      }
    },
    {
      name: 'app-center-frontend',
      script: 'next',
      args: 'start --port 3000',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

## 9. 安装完成，首次登录

### 访问系统
- **主页**: `http://localhost:3000`
- **管理后台**: `http://localhost:3000/dashboard`

### 管理员账户
- **登录信息**: 使用安装向导中设置的管理员账户
- **快速安装默认**: admin / Psw#123456 (如使用快速安装)
- **⚠️ 重要**: 首次登录后请立即修改默认密码

### 首次登录后操作
1. **修改管理员密码**
2. **配置系统设置**
3. **创建其他用户账户**
4. **上传第一个应用进行测试**

## 常见问题排除

### 端口冲突
```bash
# 检查端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000

# 修改端口配置
# 编辑 backend/.env 中的 PORT
# 编辑 frontend/package.json 中的启动命令
```

### 数据库连接问题
```bash
# 检查 SQLite 文件权限
ls -la backend/data/database.sqlite

# 如果需要重新初始化，请访问安装向导
# http://localhost:3000/install?force=true
```

### 权限问题
```bash
# 修复文件权限
chmod -R 755 ./
chown -R $USER:$USER ./
```

### 内存不足
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

## 升级指南

### 备份数据
```bash
# 备份数据库
cp backend/data/database.sqlite backend/data/database.backup.$(date +%Y%m%d_%H%M%S).sqlite

# 备份上传文件
tar -czf uploads.backup.$(date +%Y%m%d_%H%M%S).tar.gz backend/uploads/
```

### 升级步骤
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装新依赖
pnpm install

# 3. 构建项目
pnpm run build

# 4. 重启服务
pm2 restart all
```

## 技术支持

如遇到问题，请：
1. 查看 `backend/logs/` 目录下的日志文件
2. 检查浏览器开发者工具的控制台错误
3. 参考 [GitHub Issues](https://github.com/your-username/app-center/issues)
4. 联系技术支持团队

---

**🎉 恭喜！App Center 安装完成！**

现在您可以开始使用 App Center 来管理和分发您的应用程序了。
