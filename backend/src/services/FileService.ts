import { getDatabase } from '../utils/database';
import { generateId } from '../utils/idGenerator';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config/config';
import { uploadLogger } from '../utils/uploadLogger';

export interface FileRecord {
  id: string;
  originalName: string;
  tempPath: string;
  finalPath?: string;
  size: number;
  mimeType?: string;
  uploadDate: string;
  status: 'temporary' | 'confirmed' | 'expired';
  parsedInfo?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateFileData {
  originalName: string;
  tempPath: string;
  size: number;
  mimeType?: string;
  parsedInfo?: any;
}

export class FileService {
  
  static async createTempFile(data: CreateFileData): Promise<FileRecord> {
    const db = await getDatabase();
    const id = generateId();
    const uploadDate = new Date().toISOString();
    
    const query = `
      INSERT INTO files (id, originalName, tempPath, size, mimeType, uploadDate, status, parsedInfo)
      VALUES (?, ?, ?, ?, ?, ?, 'temporary', ?)
    `;
    
    const parsedInfoJson = data.parsedInfo ? JSON.stringify(data.parsedInfo) : null;
    
    db.run(query, [
      id,
      data.originalName,
      data.tempPath,
      data.size,
      data.mimeType || null,
      uploadDate,
      parsedInfoJson
    ]);
    
    uploadLogger.logFileProcessing(data.tempPath, `Created temp file record with ID: ${id}`);
    
    const createdFile = await this.getFileById(id);
    if (!createdFile) {
      throw new Error('Failed to create file record');
    }
    
    return createdFile;
  }
  
  static async confirmFile(fileId: string, finalPath: string): Promise<boolean> {
    const db = await getDatabase();
    const file = await this.getFileById(fileId);
    if (!file || file.status !== 'temporary') {
      uploadLogger.logFileProcessing(finalPath, `Cannot confirm file ${fileId}: not found or not temporary`);
      return false;
    }
    
    try {
      // 确保目标目录存在
      const finalDir = path.dirname(finalPath);
      if (!fs.existsSync(finalDir)) {
        fs.mkdirSync(finalDir, { recursive: true });
      }
      
      // 移动文件从临时目录到正式目录
      fs.renameSync(file.tempPath, finalPath);
      
      // 更新数据库记录
      const query = `
        UPDATE files 
        SET finalPath = ?, status = 'confirmed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.run(query, [finalPath, fileId]);
      
      uploadLogger.logFileProcessing(finalPath, `File ${fileId} confirmed and moved from ${file.tempPath}`);
      return true;
      
    } catch (error) {
      uploadLogger.logFileCleanupError(file.tempPath, error);
      return false;
    }
  }
  
  static async getFileById(id: string): Promise<FileRecord | null> {
    const db = await getDatabase();
    const query = 'SELECT * FROM files WHERE id = ?';
    const row = db.get(query, [id]) as any;
    
    if (!row) return null;
    
    return {
      ...row,
      parsedInfo: row.parsedInfo ? JSON.parse(row.parsedInfo) : undefined
    };
  }
  
  static async deleteFile(id: string): Promise<boolean> {
    const db = await getDatabase();
    const file = await this.getFileById(id);
    if (!file) return false;
    
    try {
      // 删除实际文件
      const filePath = file.finalPath || file.tempPath;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        uploadLogger.logFileCleanup(filePath, `File ${id} deleted`);
      }
      
      // 删除数据库记录
      const query = 'DELETE FROM files WHERE id = ?';
      const result = db.run(query, [id]);
      
      return result.changes > 0;
    } catch (error) {
      uploadLogger.logFileCleanupError(file.tempPath, error);
      return false;
    }
  }
  
  static async cleanupExpiredTempFiles(olderThanMinutes: number = 30): Promise<number> {
    const db = await getDatabase();
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();
    
    const query = `
      SELECT * FROM files 
      WHERE status = 'temporary' AND created_at < ?
    `;
    
    const expiredFiles = db.all(query, [cutoffTime]) as any[];
    let cleanedCount = 0;
    
    for (const row of expiredFiles) {
      const file = {
        ...row,
        parsedInfo: row.parsedInfo ? JSON.parse(row.parsedInfo) : undefined
      } as FileRecord;
      
      try {
        // 删除临时文件
        if (fs.existsSync(file.tempPath)) {
          fs.unlinkSync(file.tempPath);
          uploadLogger.logFileCleanup(file.tempPath, `Expired temp file cleanup`);
        }
        
        // 标记为过期
        const updateQuery = `
          UPDATE files 
          SET status = 'expired', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        db.run(updateQuery, [file.id]);
        cleanedCount++;
        
      } catch (error) {
        uploadLogger.logFileCleanupError(file.tempPath, error);
      }
    }
    
    uploadLogger.logFileProcessing('cleanup', `Cleaned up ${cleanedCount} expired temp files`);
    return cleanedCount;
  }
  
  static async getAllTempFiles(): Promise<FileRecord[]> {
    const db = await getDatabase();
    const query = 'SELECT * FROM files WHERE status = "temporary" ORDER BY created_at DESC';
    const rows = db.all(query) as any[];
    
    return rows.map(row => ({
      ...row,
      parsedInfo: row.parsedInfo ? JSON.parse(row.parsedInfo) : undefined
    }));
  }
} 