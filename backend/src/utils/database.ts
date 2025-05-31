import Database from 'better-sqlite3'
import { config } from '../config/config'
import bcrypt from 'bcryptjs'
import { generateId } from './idGenerator'

// 定义列信息的类型
interface ColumnInfo {
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

// 定义应用记录的类型
interface AppRecord {
  id: string;
}

// 生成随机字符串的辅助函数（保留用于appKey和downloadKey）
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

let db: Database.Database | null = null

export async function getDatabase(): Promise<{
  all: (sql: string, params?: any[]) => any[]
  get: (sql: string, params?: any[]) => any
  run: (sql: string, params?: any[]) => { changes: number }
  exec: (sql: string) => void
}> {
  if (db) {
    return {
      all: (sql: string, params?: any[]) => {
        const stmt = db!.prepare(sql)
        return params ? stmt.all(params) : stmt.all()
      },
      get: (sql: string, params?: any[]) => {
        const stmt = db!.prepare(sql)
        return params ? stmt.get(params) : stmt.get()
      },
      run: (sql: string, params?: any[]) => {
        const stmt = db!.prepare(sql)
        const result = params ? stmt.run(params) : stmt.run()
        return { changes: result.changes }
      },
      exec: (sql: string) => db!.exec(sql)
    }
  }

  db = new Database(config.databasePath)

  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      isActive INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `)

  // 创建应用表
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      appName TEXT,
      appKey TEXT NOT NULL UNIQUE,
      downloadKey TEXT NOT NULL UNIQUE,
      icon TEXT,
      system TEXT NOT NULL,
      bundleId TEXT,
      version TEXT,
      buildNumber TEXT,
      uploadDate TEXT,
      downloadUrl TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建版本表
  db.exec(`
    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      appId TEXT NOT NULL,
      version TEXT NOT NULL,
      buildNumber TEXT NOT NULL,
      updateContent TEXT,
      uploadDate TEXT NOT NULL,
      size TEXT NOT NULL,
      status TEXT NOT NULL,
      fileName TEXT NOT NULL,
      filePath TEXT NOT NULL,
      downloadUrl TEXT,
      platform TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appId) REFERENCES apps (id) ON DELETE CASCADE
    )
  `)

  // 创建文件表
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      originalName TEXT NOT NULL,
      tempPath TEXT NOT NULL,
      finalPath TEXT,
      size INTEGER NOT NULL,
      mimeType TEXT,
      uploadDate TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'temporary',
      parsedInfo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 数据库迁移：添加新字段
  try {
    // 检查是否需要添加字段
    const columns = db.prepare('PRAGMA table_info(apps)').all() as ColumnInfo[]
    const hasAppName = columns.some((col: ColumnInfo) => col.name === 'appName')
    const hasAppKey = columns.some((col: ColumnInfo) => col.name === 'appKey')
    const hasDownloadKey = columns.some((col: ColumnInfo) => col.name === 'downloadKey')
    
    if (!hasAppName) {
      db.exec('ALTER TABLE apps ADD COLUMN appName TEXT')
    }
    
    if (!hasAppKey) {
      db.exec('ALTER TABLE apps ADD COLUMN appKey TEXT')
      // 为现有记录生成 appKey
      const apps = db.prepare('SELECT id FROM apps WHERE appKey IS NULL').all() as AppRecord[]
      for (const app of apps) {
        const appKey = generateRandomString(16)
        db.prepare('UPDATE apps SET appKey = ? WHERE id = ?').run([appKey, app.id])
      }
      // 添加唯一约束
      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_apps_appkey ON apps(appKey)')
    }
    
    if (!hasDownloadKey) {
      db.exec('ALTER TABLE apps ADD COLUMN downloadKey TEXT')
      // 为现有记录生成 downloadKey
      const apps = db.prepare('SELECT id FROM apps WHERE downloadKey IS NULL').all() as AppRecord[]
      for (const app of apps) {
        const downloadKey = generateRandomString(8)
        db.prepare('UPDATE apps SET downloadKey = ? WHERE id = ?').run([downloadKey, app.id])
      }
      // 添加唯一约束
      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_apps_downloadkey ON apps(downloadKey)')
    }

    // 检查versions表是否需要添加platform字段
    const versionColumns = db.prepare('PRAGMA table_info(versions)').all() as ColumnInfo[]
    const hasPlatform = versionColumns.some((col: ColumnInfo) => col.name === 'platform')
    
    if (!hasPlatform) {
      db.exec('ALTER TABLE versions ADD COLUMN platform TEXT')
      // 为现有版本根据文件名推断平台
      const versions = db.prepare('SELECT id, fileName FROM versions WHERE platform IS NULL').all() as { id: string, fileName: string }[]
      for (const version of versions) {
        const platform = version.fileName.toLowerCase().endsWith('.ipa') ? 'iOS' : 'Android'
        db.prepare('UPDATE versions SET platform = ? WHERE id = ?').run([platform, version.id])
      }
      console.log(`✅ Migrated ${versions.length} versions with platform information`)
    }
  } catch (error) {
    console.error('Migration error:', error)
  }

  // 创建默认管理员账号
  await createDefaultAdminUsers()

  return {
    all: (sql: string, params?: any[]) => {
      const stmt = db!.prepare(sql)
      return params ? stmt.all(params) : stmt.all()
    },
    get: (sql: string, params?: any[]) => {
      const stmt = db!.prepare(sql)
      return params ? stmt.get(params) : stmt.get()
    },
    run: (sql: string, params?: any[]) => {
      const stmt = db!.prepare(sql)
      const result = params ? stmt.run(params) : stmt.run()
      return { changes: result.changes }
    },
    exec: (sql: string) => db!.exec(sql)
  }
}

// 创建默认管理员账号
async function createDefaultAdminUsers() {
  if (!db) {
    console.error('Database not initialized')
    return
  }
  
  try {
    // 检查是否已存在超级管理员
    const existingSuperAdmin = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get(['super_admin'])
    
    if (!existingSuperAdmin) {
      // 创建超级管理员 - 使用UUID
      const superAdminPassword = await bcrypt.hash(config.defaultSuperAdminPassword, 10)
      db.prepare(`
        INSERT INTO users (id, username, email, password, role, isActive)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run([
        generateId(),
        config.defaultSuperAdminUsername,
        config.defaultSuperAdminEmail,
        superAdminPassword,
        'super_admin',
        1
      ])
      console.log(`✅ Created default super admin: ${config.defaultSuperAdminUsername} / ${config.defaultSuperAdminPassword}`)
    }

    // 检查是否已存在普通管理员
    const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ? LIMIT 1').get([config.defaultAdminUsername])
    
    if (!existingAdmin) {
      // 创建普通管理员 - 使用UUID
      const adminPassword = await bcrypt.hash(config.defaultAdminPassword, 10)
      db.prepare(`
        INSERT INTO users (id, username, email, password, role, isActive)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run([
        generateId(),
        config.defaultAdminUsername,
        config.defaultAdminEmail,
        adminPassword,
        'admin',
        1
      ])
      console.log(`✅ Created default admin: ${config.defaultAdminUsername} / ${config.defaultAdminPassword}`)
    }
  } catch (error) {
    console.error('Error creating default admin users:', error)
  }
}

// 导出db实例以供其他模块使用
export { db } 