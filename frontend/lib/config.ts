/**
 * 前端配置管理
 * 统一管理环境变量和应用配置
 */

export interface AppConfig {
  // API服务器配置
  api: {
    host: string;
    port: number;
    protocol: 'http' | 'https';
    baseUrl: string;
  };
  
  // 前端服务器配置
  frontend: {
    host: string;
    port: number;
    protocol: 'http' | 'https';
    baseUrl: string;
  };
  
  // 环境配置
  env: {
    nodeEnv: 'development' | 'production' | 'test';
    debug: boolean;
  };
}

/**
 * 获取环境变量，提供默认值
 */
function getEnvVar(key: string, defaultValue: string): string {
  if (typeof window !== 'undefined') {
    // 客户端环境
    return process.env[`NEXT_PUBLIC_${key}`] || defaultValue;
  }
  // 服务端环境
  return process.env[`NEXT_PUBLIC_${key}`] || process.env[key] || defaultValue;
}

/**
 * 获取数字类型的环境变量
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = getEnvVar(key, defaultValue.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 获取布尔类型的环境变量
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = getEnvVar(key, defaultValue.toString()).toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * 构建完整URL
 */
function buildUrl(protocol: string, host: string, port: number): string {
  // 如果是标准端口，不需要显示端口号
  const isStandardPort = 
    (protocol === 'http' && port === 80) || 
    (protocol === 'https' && port === 443);
  
  if (isStandardPort) {
    return `${protocol}://${host}`;
  }
  
  return `${protocol}://${host}:${port}`;
}

/**
 * 智能检测API配置
 * 根据当前环境自动推断最佳配置
 */
function detectApiConfig(): { host: string; port: number; protocol: 'http' | 'https' } {
  // 优先使用环境变量
  const envHost = getEnvVar('API_HOST', '');
  const envPort = getEnvNumber('API_PORT', 0);
  const envProtocol = getEnvVar('API_PROTOCOL', '') as 'http' | 'https';
  
  if (envHost && envPort && envProtocol) {
    return { host: envHost, port: envPort, protocol: envProtocol };
  }
  
  // 如果在浏览器环境中，根据当前页面自动推断
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    
    // 如果是localhost，使用localhost:8000
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return {
        host: 'localhost',
        port: 8000,
        protocol: 'https' // 开发环境默认使用HTTPS
      };
    }
    
    // 否则使用相同的IP地址但端口8000
    return {
      host: currentHost,
      port: 8000,
      protocol: 'https' // 默认使用HTTPS
    };
  }
  
  // 服务端渲染的默认值
  return {
    host: envHost || 'localhost',
    port: envPort || 8000,
    protocol: envProtocol || 'https'
  };
}

/**
 * 智能检测前端配置
 */
function detectFrontendConfig(): { host: string; port: number; protocol: 'http' | 'https' } {
  // 优先使用环境变量
  const envHost = getEnvVar('FRONTEND_HOST', '');
  const envPort = getEnvNumber('FRONTEND_PORT', 0);
  const envProtocol = getEnvVar('FRONTEND_PROTOCOL', '') as 'http' | 'https';
  
  if (envHost && envPort && envProtocol) {
    return { host: envHost, port: envPort, protocol: envProtocol };
  }
  
  // 如果在浏览器环境中，使用当前页面的配置
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    const currentPort = parseInt(window.location.port, 10) || (window.location.protocol === 'https:' ? 443 : 80);
    const currentProtocol = window.location.protocol === 'https:' ? 'https' : 'http';
    
    return {
      host: currentHost,
      port: currentPort,
      protocol: currentProtocol
    };
  }
  
  // 服务端渲染的默认值
  return {
    host: envHost || 'localhost',
    port: envPort || 3000,
    protocol: envProtocol || 'https'
  };
}

/**
 * 创建应用配置
 */
function createConfig(): AppConfig {
  const apiConfig = detectApiConfig();
  const frontendConfig = detectFrontendConfig();
  
  const config: AppConfig = {
    api: {
      ...apiConfig,
      baseUrl: buildUrl(apiConfig.protocol, apiConfig.host, apiConfig.port)
    },
    frontend: {
      ...frontendConfig,
      baseUrl: buildUrl(frontendConfig.protocol, frontendConfig.host, frontendConfig.port)
    },
    env: {
      nodeEnv: getEnvVar('NODE_ENV', 'development') as any,
      debug: getEnvBoolean('DEBUG', true)
    }
  };
  
  // 调试信息
  if (config.env.debug && typeof window !== 'undefined') {
    console.log('🔧 前端配置加载完成:', config);
  }
  
  return config;
}

/**
 * 应用配置实例
 */
export const config = createConfig();

/**
 * 配置验证器
 */
export class ConfigValidator {
  /**
   * 验证API配置
   */
  static validateApiConfig(config: AppConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.api.host) {
      errors.push('API主机地址未配置');
    }
    
    if (!config.api.port || config.api.port < 1 || config.api.port > 65535) {
      errors.push('API端口配置无效');
    }
    
    if (!['http', 'https'].includes(config.api.protocol)) {
      errors.push('API协议配置无效');
    }
    
    try {
      new URL(config.api.baseUrl);
    } catch {
      errors.push('API基础URL格式无效');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 打印配置验证结果
   */
  static printValidationResult(result: { isValid: boolean; errors: string[] }): void {
    if (result.isValid) {
      console.log('✅ 配置验证通过');
    } else {
      console.error('❌ 配置验证失败:');
      result.errors.forEach(error => console.error(`  - ${error}`));
    }
  }
  
  /**
   * 检查配置并打印结果
   */
  static checkConfig(config: AppConfig): void {
    const apiValidation = this.validateApiConfig(config);
    this.printValidationResult(apiValidation);
    
    if (config.env.debug) {
      console.log('📋 当前配置信息:');
      console.log(`  - API服务器: ${config.api.baseUrl}`);
      console.log(`  - 前端服务器: ${config.frontend.baseUrl}`);
      console.log(`  - 运行环境: ${config.env.nodeEnv}`);
      console.log(`  - 调试模式: ${config.env.debug}`);
    }
  }
}

// 如果在浏览器环境，自动验证配置
if (typeof window !== 'undefined' && config.env.debug) {
  ConfigValidator.checkConfig(config);
} 