/**
 * API 配置
 */

// 获取当前环境的后端API地址
export function getApiBaseUrl(): string {
  // 如果在浏览器环境中
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    console.log('🌐 当前访问域名:', hostname, '协议:', protocol);
    
    // 如果是localhost，使用localhost:8000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // 如果前端是HTTPS，后端也使用HTTPS，否则使用HTTPS作为默认
      const apiProtocol = 'https'; // 始终使用HTTPS
      const apiUrl = `${apiProtocol}://localhost:8000`;
      console.log('🔗 使用本地HTTPS API地址:', apiUrl);
      return apiUrl;
    }
    
    // 否则使用相同的IP地址但端口8000，强制使用HTTPS
    const apiUrl = `https://${hostname}:8000`;
    console.log('🔗 使用IP HTTPS API地址:', apiUrl);
    return apiUrl;
  }
  
  // 服务端渲染时的默认值
  const defaultUrl = process.env.NEXT_PUBLIC_API_URL || 'https://192.168.8.111:8000';
  console.log('🔗 服务端默认API地址:', defaultUrl);
  return defaultUrl;
}

// API基础地址
export const API_BASE_URL = getApiBaseUrl();

/**
 * 获取认证token
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

/**
 * 创建带认证的请求头
 */
function createAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * 通用API请求函数
 * 自动处理认证和错误
 */
export async function apiRequest<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...createAuthHeaders(),
      ...options.headers,
    },
  };
  
  const response = await fetch(url, config);
  
  // 处理认证错误
  if (response.status === 401) {
    // 清除过期的token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      // 可以在这里重定向到登录页面
      window.location.href = '/login';
    }
    throw new Error('认证已过期，请重新登录');
  }
  
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
    }
    throw new Error(errorData.message || '请求失败');
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
} as const;

/**
 * 构建完整的API URL
 */
export function buildApiUrl(endpoint: string): string {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('📡 API请求地址:', fullUrl);
  return fullUrl;
} 