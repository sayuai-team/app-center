/**
 * API 配置
 */

import { config } from './config'

// API基础地址（使用统一配置）
export const API_BASE_URL = config.api.baseUrl;

/**
 * 获取认证token
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

/**
 * API请求选项
 */
export interface ApiRequestOptions extends RequestInit {
  /** 是否需要认证，默认为true */
  requireAuth?: boolean;
  /** 是否自动添加JSON Content-Type，默认为true */
  autoJsonContentType?: boolean;
  /** 是否解析JSON响应，默认为true */
  parseJson?: boolean;
  /** 是否自动处理认证错误重定向，默认为true */
  autoAuthRedirect?: boolean;
}

/**
 * 创建请求头
 */
function createHeaders(options: ApiRequestOptions): HeadersInit {
  const headers: HeadersInit = {};
  
  // 自动添加 Content-Type
  if (options.autoJsonContentType !== false) {
    headers['Content-Type'] = 'application/json';
  }
  
  // 添加认证token
  if (options.requireAuth !== false) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

/**
 * 通用API请求函数
 * 支持统一配置认证、错误处理等
 */
export async function apiRequest<T = any>(
  endpoint: string, 
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    requireAuth = true,
    autoJsonContentType = true,
    parseJson = true,
    autoAuthRedirect = true,
    ...fetchOptions
  } = options;

  const url = buildApiUrl(endpoint);
  
  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      ...createHeaders({ requireAuth, autoJsonContentType }),
      ...fetchOptions.headers,
    },
  };
  
  const response = await fetch(url, config);
  
  // 处理认证错误
  if (response.status === 401 && requireAuth && autoAuthRedirect) {
    // 清除过期的token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      // 重定向到登录页面
      window.location.href = '/login';
    }
    throw new Error('认证已过期，请重新登录');
  }
  
  if (!response.ok) {
    let errorData;
    try {
      if (parseJson) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
    } catch {
      errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
    }
    throw new Error(errorData.message || '请求失败');
  }
  
  // 如果不需要解析JSON，直接返回response
  if (!parseJson) {
    return response as any;
  }
  
  // 解析 JSON 响应
  const data = await response.json();
  
  // 检查标准响应格式
  if (data.code !== undefined) {
    // 新的标准格式：{ code: "0", message: "Success", data: {...} }
    if (data.code === "0") {
      // 成功响应，返回 data 字段
      return data.data || data;
    } else {
      // 错误响应，抛出异常
      throw new Error(data.message || '请求失败');
    }
  }
  
  // 兼容旧格式：{ success: true/false, message: "...", data: {...} }
  if (data.success !== undefined) {
    if (data.success) {
      return data.data || data;
    } else {
      throw new Error(data.message || '请求失败');
    }
  }
  
  // 直接返回原始数据（用于不符合标准格式的响应）
  return data;
}

/**
 * API 端点
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
  },
  USERS: {
    LIST: '/api/v1/users',
    MY_USERS: '/api/v1/users/my-users',
    STATS: '/api/v1/users/stats',
    CREATE: '/api/v1/users',
    DETAIL: (id: string) => `/api/v1/users/${id}`,
    UPDATE: (id: string) => `/api/v1/users/${id}`,
    DELETE: (id: string) => `/api/v1/users/${id}`,
    TOGGLE_STATUS: (id: string) => `/api/v1/users/${id}/toggle-status`,
  },
  APPS: {
    LIST: '/api/v1/apps',
    CREATE: '/api/v1/apps',
    DETAIL: (id: string) => `/api/v1/apps/${id}`,
    UPDATE: (id: string) => `/api/v1/apps/${id}/update`,
    DELETE: (id: string) => `/api/v1/apps/${id}/delete`,
    VERSIONS: (id: string) => `/api/v1/apps/${id}/versions`,
  },
  VERSIONS: {
    LIST: (appId: string) => `/api/v1/apps/${appId}/versions`,
    CREATE: (appId: string) => `/api/v1/apps/${appId}/versions`,
    UPDATE: (appId: string, versionId: string) => `/api/v1/apps/${appId}/versions/${versionId}/update`,
    DELETE: (appId: string, versionId: string) => `/api/v1/apps/${appId}/versions/${versionId}/delete`,
  },
  FILES: {
    UPLOAD: '/api/v1/files/upload',
    GET: (id: string) => `/api/v1/files/${id}`,
  },
  DOWNLOAD: {
    APP: (downloadKey: string) => `/api/v1/download/${downloadKey}`,
    VERSIONS: (downloadKey: string) => `/api/v1/download/${downloadKey}/versions`,
    PLIST: (downloadKey: string) => `/api/v1/download/${downloadKey}/plist`,
    PLIST_VERSION: (downloadKey: string, versionId: string) => `/api/v1/download/${downloadKey}/plist?version=${versionId}`,
  },
} as const;

/**
 * 便捷函数：不需要认证的API请求
 */
export function apiRequestPublic<T = any>(
  endpoint: string,
  options: Omit<ApiRequestOptions, 'requireAuth'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, requireAuth: false });
}

/**
 * 便捷函数：文件上传请求（FormData，不需要JSON Content-Type）
 */
export function apiRequestUpload<T = any>(
  endpoint: string,
  formData: FormData,
  options: Omit<ApiRequestOptions, 'autoJsonContentType' | 'body'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: formData,
    autoJsonContentType: false, // FormData会自动设置multipart/form-data
  });
}

/**
 * 便捷函数：获取文本响应（不解析JSON）
 */
export function apiRequestText(
  endpoint: string,
  options: Omit<ApiRequestOptions, 'parseJson'> = {}
): Promise<Response> {
  return apiRequest(endpoint, { ...options, parseJson: false });
}

/**
 * 构建完整的API URL
 */
export function buildApiUrl(endpoint: string): string {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  if (config.env.debug) {
    console.log('📡 API请求地址:', fullUrl);
  }
  return fullUrl;
}

/**
 * 获取后端服务器URL（用于下载页面等场景）
 */
export function getBackendUrl(): string {
  return config.api.baseUrl;
}

/**
 * 获取前端服务器URL
 */
export function getFrontendUrl(): string {
  return config.frontend.baseUrl;
}

/**
 * 构建下载相关的URL
 */
export const DownloadUrls = {
  /**
   * 获取plist文件URL
   */
  getPlistUrl: (downloadKey: string, versionId?: string): string => {
    const endpoint = versionId 
      ? API_ENDPOINTS.DOWNLOAD.PLIST_VERSION(downloadKey, versionId)
      : API_ENDPOINTS.DOWNLOAD.PLIST(downloadKey);
    return `${config.api.baseUrl}${endpoint}`;
  },
  
  /**
   * 获取iOS安装URL
   */
  getInstallUrl: (downloadKey: string, versionId?: string): string => {
    const plistUrl = DownloadUrls.getPlistUrl(downloadKey, versionId);
    return `itms-services://?action=download-manifest&url=${encodeURIComponent(plistUrl)}`;
  },
  
  /**
   * 获取下载页面URL
   */
  getDownloadPageUrl: (downloadKey: string): string => {
    return `${config.frontend.baseUrl}/${downloadKey}`;
  }
}; 