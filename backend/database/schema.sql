-- ================================
-- App Center 数据库架构定义
-- 创建时间: 2025-01-31
-- 描述: 包含所有表结构和索引的定义
-- ================================

-- 启用外键约束
PRAGMA foreign_keys = ON;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                           -- UUID v4格式的用户ID
    username TEXT NOT NULL UNIQUE,                 -- 用户名，唯一
    email TEXT NOT NULL UNIQUE,                    -- 邮箱，唯一
    password TEXT NOT NULL,                        -- 加密后的密码
    role TEXT NOT NULL DEFAULT 'user',             -- 用户角色: super_admin, admin, user
    isActive INTEGER NOT NULL DEFAULT 1,           -- 是否启用: 1=启用, 0=禁用
    created_by TEXT,                               -- 创建者ID (super_admin创建admin时使用)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    last_login DATETIME,                           -- 最后登录时间
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

-- 应用表
CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY,                           -- UUID v4格式的应用ID
    name TEXT NOT NULL,                           -- 用户定义的应用名称
    appName TEXT,                                 -- 从IPA/APK解析的应用名称
    appKey TEXT NOT NULL UNIQUE,                  -- 16位API密钥，用于自动化上传
    downloadKey TEXT NOT NULL UNIQUE,             -- 8位下载密钥，用于生成下载链接
    icon TEXT,                                    -- 应用图标URL或base64
    system TEXT NOT NULL,                         -- 操作系统: iOS, Android
    bundleId TEXT,                                -- Bundle ID / Package Name
    version TEXT,                                 -- 版本号
    buildNumber TEXT,                             -- 构建号
    uploadDate TEXT,                              -- 上传日期
    downloadUrl TEXT,                             -- 下载链接
    description TEXT,                             -- 应用描述
    owner_id TEXT NOT NULL,                       -- 应用所有者ID (管理员用户)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 版本表
CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,                           -- UUID v4格式的版本ID
    appId TEXT NOT NULL,                          -- 关联的应用ID
    version TEXT NOT NULL,                        -- 版本号
    buildNumber TEXT NOT NULL,                    -- 构建号
    updateContent TEXT,                           -- 更新内容说明
    uploadDate TEXT NOT NULL,                     -- 上传日期
    size TEXT NOT NULL,                           -- 文件大小
    status TEXT NOT NULL,                         -- 状态: active, inactive
    fileName TEXT NOT NULL,                       -- 原始文件名
    filePath TEXT NOT NULL,                       -- 文件存储路径
    downloadUrl TEXT,                             -- 下载链接
    platform TEXT,                               -- 平台标识: iOS, Android
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (appId) REFERENCES apps (id) ON DELETE CASCADE
);

-- 文件表
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,                           -- UUID v4格式的文件ID
    originalName TEXT NOT NULL,                   -- 原始文件名
    tempPath TEXT NOT NULL,                       -- 临时路径
    finalPath TEXT,                               -- 最终路径
    size INTEGER NOT NULL,                        -- 文件大小(字节)
    mimeType TEXT,                                -- MIME类型
    uploadDate TEXT NOT NULL,                     -- 上传日期
    status TEXT NOT NULL DEFAULT 'temporary',     -- 状态: temporary, confirmed, expired
    parsedInfo TEXT,                              -- 解析信息(JSON格式)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

-- ================================
-- 索引定义
-- ================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(isActive);
CREATE INDEX IF NOT EXISTS idx_users_login_time ON users(last_login);

-- 应用表索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_apps_appkey ON apps(appKey);
CREATE UNIQUE INDEX IF NOT EXISTS idx_apps_downloadkey ON apps(downloadKey);
CREATE INDEX IF NOT EXISTS idx_apps_system ON apps(system);
CREATE INDEX IF NOT EXISTS idx_apps_bundle ON apps(bundleId);
CREATE INDEX IF NOT EXISTS idx_apps_owner ON apps(owner_id);
CREATE INDEX IF NOT EXISTS idx_apps_created ON apps(created_at);

-- 版本表索引
CREATE INDEX IF NOT EXISTS idx_versions_app ON versions(appId);
CREATE INDEX IF NOT EXISTS idx_versions_version ON versions(version);
CREATE INDEX IF NOT EXISTS idx_versions_build ON versions(buildNumber);
CREATE INDEX IF NOT EXISTS idx_versions_status ON versions(status);
CREATE INDEX IF NOT EXISTS idx_versions_platform ON versions(platform);
CREATE INDEX IF NOT EXISTS idx_versions_upload ON versions(uploadDate);

-- 文件表索引
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_upload ON files(uploadDate);
CREATE INDEX IF NOT EXISTS idx_files_created ON files(created_at);

-- ================================
-- 触发器定义 (自动更新时间戳)
-- ================================

-- 用户表更新触发器
CREATE TRIGGER IF NOT EXISTS trigger_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 应用表更新触发器
CREATE TRIGGER IF NOT EXISTS trigger_apps_updated_at
    AFTER UPDATE ON apps
    FOR EACH ROW
BEGIN
    UPDATE apps SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 版本表更新触发器
CREATE TRIGGER IF NOT EXISTS trigger_versions_updated_at
    AFTER UPDATE ON versions
    FOR EACH ROW
BEGIN
    UPDATE versions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 文件表更新触发器
CREATE TRIGGER IF NOT EXISTS trigger_files_updated_at
    AFTER UPDATE ON files
    FOR EACH ROW
BEGIN
    UPDATE files SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END; 