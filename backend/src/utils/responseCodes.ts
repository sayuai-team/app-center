/**
 * 标准响应码定义
 * 格式：2-3位模块前缀 + HTTP状态码 + 递增序号
 */

export const RESPONSE_CODES = {
  // 通用成功码
  SUCCESS: '0',

  // 认证模块 (AU + HTTP状态码)
  AUTH: {
    INVALID_CREDENTIALS: 'AU0401',        // 用户名/邮箱或密码错误
    TOKEN_EXPIRED: 'AU0402',              // Token 过期，请重新登录
    TOKEN_MISSING: 'AU0403',              // 未提供认证令牌
    USER_NOT_FOUND: 'AU0404',             // 用户不存在或已被禁用
    USER_EXISTS: 'AU4091',                // 用户名或邮箱已存在
    INVALID_REQUEST: 'AU4001',            // 请求参数错误
    PASSWORD_TOO_SHORT: 'AU4002',         // 密码长度至少为6位
    MISSING_FIELDS: 'AU4003',             // 请提供必要字段
    PERMISSION_DENIED: 'AU4031',          // 权限不足
  },

  // 应用模块 (AP + HTTP状态码)
  APP: {
    NOT_FOUND: 'AP4041',                  // 应用不存在
    CREATE_SUCCESS: '0',                  // 应用创建成功
    UPDATE_SUCCESS: '0',                  // 应用更新成功
    DELETE_SUCCESS: '0',                  // 应用删除成功
    LIST_SUCCESS: '0',                    // 获取应用列表成功
    VALIDATION_ERROR: 'AP4001',           // 应用信息验证失败
  },

  // 版本模块 (VR + HTTP状态码)
  VERSION: {
    NOT_FOUND: 'VR4041',                  // 版本不存在
    CREATE_SUCCESS: '0',                  // 版本创建成功
    UPDATE_SUCCESS: '0',                  // 版本更新成功
    DELETE_SUCCESS: '0',                  // 版本删除成功
    LIST_SUCCESS: '0',                    // 获取版本列表成功
    MISSING_FIELDS: 'VR4001',             // 请提供版本号和构建号
    INVALID_FILE: 'VR4002',               // 文件不存在或已被处理
    PARSE_ERROR: 'VR4003',                // 处理文件时发生错误
  },

  // 文件模块 (FL + HTTP状态码)
  FILE: {
    NOT_FOUND: 'FL4041',                  // 文件不存在
    UPLOAD_SUCCESS: '0',                  // 文件上传成功
    DELETE_SUCCESS: '0',                  // 文件删除成功
    MISSING_FILE: 'FL4001',               // 请上传应用文件
    INVALID_FORMAT: 'FL4002',             // 只允许上传 .ipa 或 .apk 文件
    PARSE_ERROR: 'FL4003',                // 无法解析应用文件
    PROCESSING_ERROR: 'FL5001',           // 文件处理失败
  },

  // 用户模块 (US + HTTP状态码)
  USER: {
    NOT_FOUND: 'US4041',                  // 用户不存在
    MISSING_FIELDS: 'US4001',             // 缺少必填字段
    INVALID_ROLE: 'US4002',               // 无效的用户角色
    CREATE_SUCCESS: '0',                  // 用户创建成功
    UPDATE_SUCCESS: '0',                  // 用户更新成功
    DELETE_SUCCESS: '0',                  // 用户删除成功
  },

  // 系统模块 (SY + HTTP状态码)
  SYSTEM: {
    INTERNAL_ERROR: 'SY5001',             // 内部服务器错误
    VALIDATION_ERROR: 'SY4001',           // 输入验证失败
    RATE_LIMIT: 'SY4291',                 // 请求过于频繁
    REQUEST_TOO_LARGE: 'SY4131',          // 请求体过大
  }
} as const;

/**
 * 响应消息定义
 */
export const RESPONSE_MESSAGES: Record<string, string> = {
  [RESPONSE_CODES.SUCCESS]: 'Success',

  // 认证模块消息
  [RESPONSE_CODES.AUTH.INVALID_CREDENTIALS]: '用户名/邮箱或密码错误',
  [RESPONSE_CODES.AUTH.TOKEN_EXPIRED]: 'Token 过期，请重新登录',
  [RESPONSE_CODES.AUTH.TOKEN_MISSING]: '未提供认证令牌',
  [RESPONSE_CODES.AUTH.USER_NOT_FOUND]: '用户不存在或已被禁用',
  [RESPONSE_CODES.AUTH.USER_EXISTS]: '用户名或邮箱已存在',
  [RESPONSE_CODES.AUTH.INVALID_REQUEST]: '请提供用户名/邮箱和密码',
  [RESPONSE_CODES.AUTH.PASSWORD_TOO_SHORT]: '密码长度至少为6位',
  [RESPONSE_CODES.AUTH.MISSING_FIELDS]: '请提供用户名、邮箱和密码',
  [RESPONSE_CODES.AUTH.PERMISSION_DENIED]: '权限不足',

  // 应用模块消息
  [RESPONSE_CODES.APP.NOT_FOUND]: '应用不存在',
  '应用创建成功': '应用创建成功',
  '应用更新成功': '应用更新成功',
  '应用删除成功': '应用删除成功',
  '获取应用列表成功': '获取应用列表成功',

  // 版本模块消息
  [RESPONSE_CODES.VERSION.NOT_FOUND]: '版本不存在',
  '版本创建成功': '版本创建成功',
  '版本更新成功': '版本更新成功',
  '版本删除成功': '版本删除成功',
  '获取版本列表成功': '获取版本列表成功',
  [RESPONSE_CODES.VERSION.MISSING_FIELDS]: '请提供版本号和构建号',
  [RESPONSE_CODES.VERSION.INVALID_FILE]: '文件不存在或已被处理',
  [RESPONSE_CODES.VERSION.PARSE_ERROR]: '处理文件时发生错误',

  // 文件模块消息
  [RESPONSE_CODES.FILE.NOT_FOUND]: '文件不存在',
  '文件上传成功': '文件上传成功',
  '文件删除成功': '文件删除成功',
  [RESPONSE_CODES.FILE.MISSING_FILE]: '请上传应用文件',
  [RESPONSE_CODES.FILE.INVALID_FORMAT]: '只允许上传 .ipa 或 .apk 文件',
  [RESPONSE_CODES.FILE.PARSE_ERROR]: '无法解析应用文件，请确保上传的是有效的 IPA 或 APK 文件',
  [RESPONSE_CODES.FILE.PROCESSING_ERROR]: '文件处理失败',

  // 用户模块消息
  [RESPONSE_CODES.USER.NOT_FOUND]: '用户不存在',
  [RESPONSE_CODES.USER.MISSING_FIELDS]: '缺少必填字段',
  [RESPONSE_CODES.USER.INVALID_ROLE]: '无效的用户角色',

  // 系统模块消息
  [RESPONSE_CODES.SYSTEM.INTERNAL_ERROR]: '内部服务器错误',
  [RESPONSE_CODES.SYSTEM.VALIDATION_ERROR]: '输入验证失败',
  [RESPONSE_CODES.SYSTEM.RATE_LIMIT]: '请求过于频繁，请稍后再试',
  [RESPONSE_CODES.SYSTEM.REQUEST_TOO_LARGE]: '请求体过大',
};

/**
 * 创建标准成功响应
 */
export function createSuccessResponse(message: string = 'Success', data: any = {}) {
  return {
    code: RESPONSE_CODES.SUCCESS,
    message: message,
    data: data
  };
}

/**
 * 创建标准错误响应
 */
export function createErrorResponse(code: string, message?: string, data: any = {}) {
  return {
    code: code,
    message: message || RESPONSE_MESSAGES[code] || '未知错误',
    data: data
  };
} 