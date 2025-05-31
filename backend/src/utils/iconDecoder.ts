import * as fs from 'fs';
import * as path from 'path';

/**
 * iOS图标解密和处理工具
 */
export class IconDecoder {
  /**
   * 检测图片格式
   */
  static detectImageFormat(buffer: Buffer): string {
    if (buffer.length < 4) return 'unknown';
    
    const header = buffer.subarray(0, 4);
    
    // JPEG: FF D8
    if (header[0] === 0xFF && header[1] === 0xD8) {
      return 'image/jpeg';
    }
    // PNG: 89 50 4E 47
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      return 'image/png';
    }
    // GIF: 47 49 46 38
    if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
      return 'image/gif';
    }
    // WebP: 52 49 46 46
    if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) {
      return 'image/webp';
    }
    // ICO: 00 00 01 00
    if (header[0] === 0x00 && header[1] === 0x00 && header[2] === 0x01 && header[3] === 0x00) {
      return 'image/x-icon';
    }
    // BMP: 42 4D
    if (header[0] === 0x42 && header[1] === 0x4D) {
      return 'image/bmp';
    }
    
    return 'image/png'; // 默认为PNG
  }

  /**
   * 检查是否为Apple优化的PNG格式
   * Apple有时会对PNG进行特殊优化，这可能导致标准PNG解码器无法正确处理
   */
  static isAppleOptimizedPNG(buffer: Buffer): boolean {
    if (buffer.length < 8) return false;
    
    // 检查PNG文件头
    const pngHeader = buffer.subarray(0, 8);
    const expectedHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    if (!pngHeader.equals(expectedHeader)) return false;
    
    // 查找CgBI chunk，这是Apple优化PNG的标志
    let offset = 8;
    while (offset < buffer.length - 8) {
      const chunkLength = buffer.readUInt32BE(offset);
      const chunkType = buffer.subarray(offset + 4, offset + 8).toString('ascii');
      
      if (chunkType === 'CgBI') {
        return true;
      }
      
      // 移动到下一个chunk
      offset += 8 + chunkLength + 4; // length + type + data + crc
    }
    
    return false;
  }

  /**
   * 尝试修复Apple优化的PNG格式
   * 这是一个简化的修复，可能不适用于所有情况
   */
  static fixAppleOptimizedPNG(buffer: Buffer): Buffer {
    if (!this.isAppleOptimizedPNG(buffer)) {
      return buffer;
    }

    try {
      // 创建一个新的Buffer来存储修复后的PNG
      const newBuffer = Buffer.alloc(buffer.length);
      let writeOffset = 0;
      let readOffset = 0;

      // 复制PNG头
      buffer.copy(newBuffer, writeOffset, readOffset, readOffset + 8);
      writeOffset += 8;
      readOffset += 8;

      // 处理chunks
      while (readOffset < buffer.length - 8) {
        const chunkLength = buffer.readUInt32BE(readOffset);
        const chunkType = buffer.subarray(readOffset + 4, readOffset + 8).toString('ascii');

        // 跳过CgBI chunk（Apple专有）
        if (chunkType === 'CgBI') {
          readOffset += 8 + chunkLength + 4;
          continue;
        }

        // 复制其他chunks
        const chunkSize = 8 + chunkLength + 4;
        buffer.copy(newBuffer, writeOffset, readOffset, readOffset + chunkSize);
        writeOffset += chunkSize;
        readOffset += chunkSize;
      }

      return newBuffer.subarray(0, writeOffset);
    } catch (error) {
      console.warn('Failed to fix Apple optimized PNG:', error);
      return buffer;
    }
  }

  /**
   * 处理图标数据
   */
  static processIcon(iconData: any): { dataUrl?: string; error?: string } {
    try {
      let buffer: Buffer;

      // 转换为Buffer
      if (Buffer.isBuffer(iconData)) {
        buffer = iconData;
      } else if (typeof iconData === 'string') {
        if (iconData.startsWith('data:')) {
          const base64Data = iconData.split(',')[1];
          buffer = Buffer.from(base64Data, 'base64');
        } else {
          buffer = Buffer.from(iconData, 'base64');
        }
      } else {
        buffer = Buffer.from(iconData);
      }

      // 检查Buffer是否有效
      if (buffer.length === 0) {
        return { error: 'Icon buffer is empty' };
      }

      // 尝试修复Apple优化的PNG
      if (this.isAppleOptimizedPNG(buffer)) {
        console.log('Detected Apple optimized PNG, attempting to fix...');
        buffer = this.fixAppleOptimizedPNG(buffer);
      }

      // 检测图片格式
      const mimeType = this.detectImageFormat(buffer);
      
      // 生成data URL
      const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      
      console.log(`Successfully processed icon. Format: ${mimeType}, Size: ${buffer.length} bytes`);
      
      return { dataUrl };
    } catch (error) {
      console.error('Icon processing error:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * 生成默认图标
   */
  static generateFallbackIcon(platform: 'ios' | 'android'): string {
    if (platform === 'ios') {
      return "https://via.placeholder.com/60x60/3b82f6/ffffff?text=iOS";
    } else {
      return "https://via.placeholder.com/60x60/10b981/ffffff?text=AND";
    }
  }
} 