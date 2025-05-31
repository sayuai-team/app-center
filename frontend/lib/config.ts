import { getApiBaseUrl } from './api';

// 前端配置
export const config = {
  api: {
    baseUrl: getApiBaseUrl() + '/api/v1',
  },
  app: {
    name: 'App Center',
    version: '1.0.0',
  },
  upload: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedTypes: ['.ipa', '.apk'],
  },
}; 