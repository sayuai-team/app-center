import { getDatabase } from '../utils/database';
import { App } from '@app-center/shared';
import { generateId } from '../utils/idGenerator';

export class AppService {
  // 生成16位随机字符串作为appKey
  private static generateAppKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // 生成8位随机字符串作为downloadKey
  private static generateDownloadKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // 获取所有应用（超级管理员权限）
  static async getAllApps(): Promise<App[]> {
    const db = await getDatabase()
    const apps = await db.all(`
      SELECT * FROM apps 
      ORDER BY created_at DESC
    `)
    return apps as App[]
  }

  // 根据所有者获取应用（管理员权限）
  static async getAppsByOwner(ownerId: string): Promise<App[]> {
    const db = await getDatabase()
    const apps = await db.all(`
      SELECT * FROM apps 
      WHERE owner_id = ?
      ORDER BY created_at DESC
    `, [ownerId])
    return apps as App[]
  }

  // 根据 ID 获取应用
  static async getAppById(id: string): Promise<App | null> {
    const db = await getDatabase()
    const app = await db.get(`
      SELECT * FROM apps 
      WHERE id = ?
    `, [id])
    return app as App | null
  }

  // 根据 appKey 获取应用
  static async getAppByKey(appKey: string): Promise<App | null> {
    const db = await getDatabase()
    const app = await db.get(`
      SELECT * FROM apps 
      WHERE appKey = ?
    `, [appKey])
    return app as App | null
  }

  // 根据 downloadKey 获取应用
  static async getAppByDownloadKey(downloadKey: string): Promise<App | null> {
    const db = await getDatabase()
    const app = await db.get(`
      SELECT * FROM apps 
      WHERE downloadKey = ?
    `, [downloadKey])
    return app as App | null
  }

  // 创建新应用
  static async createApp(app: Omit<App, 'id' | 'appKey' | 'downloadKey'> & { downloadKey?: string }): Promise<App> {
    const db = await getDatabase()
    const id = generateId()
    const appKey = this.generateAppKey()
    const downloadKey = app.downloadKey || this.generateDownloadKey()
    
    // 检查downloadKey是否唯一
    const isUnique = await this.isDownloadKeyUnique(downloadKey)
    if (!isUnique) {
      throw new Error('Download Key already exists')
    }
    
    await db.run(`
      INSERT INTO apps (id, name, appName, appKey, icon, system, bundleId, version, buildNumber, uploadDate, downloadUrl, description, downloadKey, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, 
      app.name, 
      app.appName || app.name,
      appKey,
      app.icon, 
      app.system, 
      app.bundleId, 
      app.version, 
      app.buildNumber, 
      app.uploadDate, 
      app.downloadUrl || null, 
      app.description || null,
      downloadKey,
      app.owner_id
    ])

    const newApp = await this.getAppById(id)
    return newApp!
  }

  // 更新应用
  static async updateApp(id: string, updates: Partial<Omit<App, 'id'>>): Promise<App | null> {
    const db = await getDatabase()
    
    // 如果更新包含downloadKey，检查唯一性
    if (updates.downloadKey) {
      const isUnique = await this.isDownloadKeyUnique(updates.downloadKey, id)
      if (!isUnique) {
        throw new Error('Download Key already exists')
      }
    }
    
    // 过滤掉undefined值
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )
    
    if (Object.keys(filteredUpdates).length === 0) {
      // 如果没有有效的更新字段，直接返回当前应用
      return await this.getAppById(id)
    }
    
    const setClause = Object.keys(filteredUpdates).map(key => `${key} = ?`).join(', ')
    const values = Object.values(filteredUpdates)
    
    const result = await db.run(`
      UPDATE apps 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [...values, id])
    
    if (result.changes === 0) {
      throw new Error('App not found or no changes made')
    }

    return await this.getAppById(id)
  }

  // 删除应用
  static async deleteApp(id: string): Promise<boolean> {
    const db = await getDatabase()
    
    // 首先获取应用的所有版本，以便删除文件
    const { VersionService } = await import('./VersionService');
    const versions = await VersionService.getVersionsByAppId(id);
    
    // 删除所有版本的文件
    const fs = await import('fs');
    const path = await import('path');
    const { config } = await import('../config/config');
    const { uploadLogger } = await import('../utils/uploadLogger');
    
    for (const version of versions) {
      if (version.filePath && fs.existsSync(version.filePath)) {
        try {
          fs.unlinkSync(version.filePath);
          uploadLogger.logFileCleanup(version.filePath, `App deletion cleanup: ${version.id}`);
        } catch (cleanupError) {
          uploadLogger.logFileCleanupError(version.filePath, cleanupError);
        }
      }
    }
    
    // 删除应用专用的文件夹（如果存在且为空）
    const appFolder = path.join(config.uploadDir, id);
    if (fs.existsSync(appFolder)) {
      try {
        // 尝试删除文件夹（只有在为空时才会成功）
        const files = fs.readdirSync(appFolder);
        if (files.length === 0) {
          fs.rmdirSync(appFolder);
          uploadLogger.logFileCleanup(appFolder, `App folder cleanup: ${id}`);
        } else {
          // 如果文件夹不为空，删除剩余文件
          for (const file of files) {
            const filePath = path.join(appFolder, file);
            try {
              fs.unlinkSync(filePath);
              uploadLogger.logFileCleanup(filePath, `Remaining file cleanup: ${id}`);
            } catch (fileError) {
              uploadLogger.logFileCleanupError(filePath, fileError);
            }
          }
          // 再次尝试删除文件夹
          try {
            fs.rmdirSync(appFolder);
            uploadLogger.logFileCleanup(appFolder, `App folder cleanup (after clearing): ${id}`);
          } catch (folderError) {
            uploadLogger.logFileCleanupError(appFolder, folderError);
          }
        }
      } catch (cleanupError) {
        uploadLogger.logFileCleanupError(appFolder, cleanupError);
      }
    }
    
    // 删除应用记录（这会自动级联删除版本记录，因为有 ON DELETE CASCADE）
    const result = await db.run(`
      DELETE FROM apps 
      WHERE id = ?
    `, [id])
    
    if (result.changes! > 0) {
      uploadLogger.logFileProcessing(id, `App ${id} deleted successfully with ${versions.length} versions`);
    }
    
    return result.changes! > 0
  }

  // 清空所有应用数据
  static async clearAllApps(): Promise<number> {
    const db = await getDatabase()
    
    // 获取所有应用，以便清理文件
    const apps = await this.getAllApps();
    
    // 导入必要的模块
    const fs = await import('fs');
    const path = await import('path');
    const { config } = await import('../config/config');
    const { uploadLogger } = await import('../utils/uploadLogger');
    
    let totalVersionsDeleted = 0;
    
    // 为每个应用清理文件
    for (const app of apps) {
      // 获取应用的所有版本
      const { VersionService } = await import('./VersionService');
      const versions = await VersionService.getVersionsByAppId(app.id);
      totalVersionsDeleted += versions.length;
      
      // 删除应用专用的文件夹及其所有内容
      const appFolder = path.join(config.uploadDir, app.id);
      if (fs.existsSync(appFolder)) {
        try {
          // 递归删除文件夹及其所有内容
          const deleteRecursive = (dirPath: string) => {
            if (fs.existsSync(dirPath)) {
              const files = fs.readdirSync(dirPath);
              for (const file of files) {
                const filePath = path.join(dirPath, file);
                if (fs.statSync(filePath).isDirectory()) {
                  deleteRecursive(filePath);
                } else {
                  fs.unlinkSync(filePath);
                  uploadLogger.logFileCleanup(filePath, `Clear all apps cleanup`);
                }
              }
              fs.rmdirSync(dirPath);
              uploadLogger.logFileCleanup(dirPath, `Clear all apps folder cleanup: ${app.id}`);
            }
          };
          
          deleteRecursive(appFolder);
        } catch (cleanupError) {
          uploadLogger.logFileCleanupError(appFolder, cleanupError);
        }
      }
    }
    
    // 删除所有应用记录（会级联删除版本记录）
    const result = await db.run(`DELETE FROM apps`)
    const deletedCount = result.changes || 0;
    
    uploadLogger.logFileProcessing('clear_all', `Cleared ${deletedCount} apps and ${totalVersionsDeleted} versions with files`);
    
    return deletedCount;
  }

  // 初始化示例数据
  static async initializeSampleData(): Promise<void> {
    const db = await getDatabase()
    
    // 检查是否已有数据
    const count = await db.get('SELECT COUNT(*) as count FROM apps')
    if (count.count > 0) {
      return // 已有数据，不需要初始化
    }

    // 获取第一个管理员用户作为默认所有者
    const defaultOwner = await db.get('SELECT id FROM users WHERE role IN (?, ?) ORDER BY created_at ASC LIMIT 1', ['super_admin', 'admin']) as { id: string } | undefined
    
    if (!defaultOwner) {
      console.warn('⚠️ No admin user found, skipping sample data initialization')
      return
    }

    const sampleApps = [
      {
        name: "MyApp iOS",
        icon: "https://via.placeholder.com/60x60/3b82f6/ffffff?text=iOS",
        system: "iOS",
        bundleId: "com.example.myapp",
        version: "1.2.0",
        buildNumber: "123",
        uploadDate: "2024-01-15",
        owner_id: defaultOwner.id
      },
      {
        name: "MyApp Android",
        icon: "https://via.placeholder.com/60x60/10b981/ffffff?text=AND",
        system: "Android",
        bundleId: "com.example.myapp.android",
        version: "1.1.5",
        buildNumber: "456",
        uploadDate: "2024-01-10",
        owner_id: defaultOwner.id
      }
    ]

    for (const app of sampleApps) {
      await this.createApp(app)
    }
  }

  // 检查downloadKey是否唯一
  static async isDownloadKeyUnique(downloadKey: string, excludeId?: string): Promise<boolean> {
    const db = await getDatabase()
    let query = 'SELECT COUNT(*) as count FROM apps WHERE downloadKey = ?'
    const params: (string | number)[] = [downloadKey]
    
    if (excludeId) {
      query += ' AND id != ?'
      params.push(excludeId)
    }
    
    const result = await db.get(query, params)
    return result.count === 0
  }
} 