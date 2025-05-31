/**
 * ID生成工具
 * 使用UUID v4标准格式生成ID
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * 生成UUID v4格式的ID
 * @returns UUID v4格式的字符串 (例: 550e8400-e29b-41d4-a716-446655440000)
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * 生成指定长度的随机字母数字组合（保留此函数用于兼容性）
 * @param length 长度
 * @returns 指定长度的字母数字组合字符串
 */
export function generateIdWithLength(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 验证UUID格式
 * @param id 要验证的ID
 * @returns 是否为有效的UUID格式
 */
export function isValidId(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * 验证UUID v4格式
 * @param id 要验证的ID
 * @returns 是否为有效的UUID v4格式
 */
export function isValidUuidV4(id: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(id);
} 