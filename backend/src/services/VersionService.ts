import { getDatabase } from '../utils/database';
import { Version } from '@app-center/shared';
import { generateId } from '../utils/idGenerator';

export class VersionService {
  // 获取应用的所有版本
  static async getVersionsByAppId(appId: string): Promise<Version[]> {
    const db = await getDatabase()
    const versions = await db.all(`
      SELECT * FROM versions 
      WHERE appId = ?
      ORDER BY created_at DESC
    `, [appId])
    return versions as Version[]
  }

  // 根据ID获取版本
  static async getVersionById(id: string): Promise<Version | null> {
    const db = await getDatabase()
    const version = await db.get(`
      SELECT * FROM versions 
      WHERE id = ?
    `, [id])
    return version as Version | null
  }

  // 创建新版本
  static async createVersion(version: Omit<Version, 'id'>): Promise<Version> {
    const db = await getDatabase()
    const id = generateId()
    
    await db.run(`
      INSERT INTO versions (id, appId, version, buildNumber, updateContent, uploadDate, size, status, fileName, filePath, downloadUrl, platform)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      version.appId,
      version.version,
      version.buildNumber,
      version.updateContent || '',
      version.uploadDate,
      version.size,
      version.status,
      version.fileName,
      version.filePath,
      version.downloadUrl || null,
      version.platform || null
    ])

    const newVersion = await this.getVersionById(id)
    return newVersion!
  }

  // 更新版本
  static async updateVersion(id: string, updates: Partial<Omit<Version, 'id'>>): Promise<Version | null> {
    const db = await getDatabase()
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = Object.values(updates)
    
    await db.run(`
      UPDATE versions 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [...values, id])

    return await this.getVersionById(id)
  }

  // 删除版本
  static async deleteVersion(id: string): Promise<boolean> {
    const db = await getDatabase()
    const result = await db.run(`
      DELETE FROM versions 
      WHERE id = ?
    `, [id])
    
    return result.changes! > 0
  }

  // 检查版本是否存在
  static async versionExists(appId: string, version: string, buildNumber: string, excludeId?: string): Promise<boolean> {
    const db = await getDatabase()
    let query = 'SELECT COUNT(*) as count FROM versions WHERE appId = ? AND version = ? AND buildNumber = ?'
    const params: (string | number)[] = [appId, version, buildNumber]
    
    if (excludeId) {
      query += ' AND id != ?'
      params.push(excludeId)
    }
    
    const result = await db.get(query, params)
    return result.count > 0
  }
} 