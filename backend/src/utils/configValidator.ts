import { config } from '../config/config';

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  securityScore: number;
}

/**
 * 配置安全验证工具
 */
export class ConfigValidator {
  
  /**
   * 验证所有配置的安全性
   */
  static validateSecurity(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      securityScore: 100
    };

    // JWT密钥验证
    this.validateJWTSecret(result);
    
    // 默认密码验证
    this.validateDefaultPasswords(result);
    
    // HTTPS配置验证
    this.validateHTTPSConfig(result);
    
    // CORS配置验证
    this.validateCORSConfig(result);
    
    // 环境配置验证
    this.validateEnvironmentConfig(result);
    
    // 数据库配置验证
    this.validateDatabaseConfig(result);

    // 计算最终安全分数
    result.securityScore = Math.max(0, result.securityScore);
    result.isValid = result.errors.length === 0 && result.securityScore >= 70;

    return result;
  }

  /**
   * JWT密钥安全性验证
   */
  private static validateJWTSecret(result: ValidationResult): void {
    const jwtSecret = config.jwtSecret;
    
    if (jwtSecret.includes('app-center-internal-')) {
      result.warnings.push('JWT密钥使用默认生成算法，建议在生产环境设置自定义密钥');
      result.securityScore -= 10;
    }
    
    if (jwtSecret.length < 32) {
      result.errors.push('JWT密钥长度过短，建议至少32个字符');
      result.securityScore -= 20;
    }
    
    // 检查是否使用了示例密钥
    const dangerousSecrets = [
      'your-super-secret-jwt-key-here',
      'secret',
      'password',
      'jwt-secret',
      'CHANGE_THIS'
    ];
    
    if (dangerousSecrets.some(dangerous => jwtSecret.includes(dangerous))) {
      result.errors.push('JWT密钥使用了示例值，必须更换为安全的随机密钥');
      result.securityScore -= 30;
    }
  }

  /**
   * 默认密码安全性验证
   */
  private static validateDefaultPasswords(result: ValidationResult): void {
    const superAdminPassword = config.defaultSuperAdminPassword;
    const adminPassword = config.defaultAdminPassword;
    
    const weakPasswords = ['admin123', 'password', '123456', 'admin', 'CHANGE_THIS'];
    
    if (weakPasswords.includes(superAdminPassword)) {
      if (config.nodeEnv === 'production') {
        result.errors.push('生产环境使用弱默认超级管理员密码，存在严重安全风险');
        result.securityScore -= 25;
      } else {
        result.warnings.push('超级管理员使用弱默认密码，建议修改');
        result.securityScore -= 10;
      }
    }
    
    if (weakPasswords.includes(adminPassword)) {
      if (config.nodeEnv === 'production') {
        result.errors.push('生产环境使用弱默认管理员密码，存在安全风险');
        result.securityScore -= 20;
      } else {
        result.warnings.push('管理员使用弱默认密码，建议修改');
        result.securityScore -= 5;
      }
    }
  }

  /**
   * HTTPS配置验证
   */
  private static validateHTTPSConfig(result: ValidationResult): void {
    if (config.nodeEnv === 'production' && !config.enableHttps) {
      result.warnings.push('生产环境建议启用HTTPS以确保数据传输安全');
      result.securityScore -= 15;
    }
    
    if (config.enableHttps) {
      // 这里可以添加证书文件检查逻辑
      result.warnings.push('请确保SSL证书文件存在且有效');
    }
  }

  /**
   * CORS配置验证
   */
  private static validateCORSConfig(result: ValidationResult): void {
    const corsOrigin = config.corsOrigin;
    
    if (corsOrigin === '*') {
      result.errors.push('CORS配置允许所有域名访问，存在安全风险');
      result.securityScore -= 20;
    }
    
    if (corsOrigin.includes('localhost') && config.nodeEnv === 'production') {
      result.warnings.push('生产环境CORS配置包含localhost，请检查是否正确');
      result.securityScore -= 5;
    }
  }

  /**
   * 环境配置验证
   */
  private static validateEnvironmentConfig(result: ValidationResult): void {
    if (config.nodeEnv === 'production') {
      // 生产环境特定检查
      if (process.env.NODE_ENV !== 'production') {
        result.warnings.push('NODE_ENV环境变量与配置不匹配');
      }
    }
  }

  /**
   * 数据库配置验证
   */
  private static validateDatabaseConfig(result: ValidationResult): void {
    const dbPath = config.databasePath;
    
    if (dbPath.includes('./data/database.sqlite') && config.nodeEnv === 'production') {
      result.warnings.push('生产环境建议使用专门的数据库路径');
      result.securityScore -= 5;
    }
  }

  /**
   * 打印验证结果
   */
  static printValidationResult(result: ValidationResult): void {
    const timestamp = new Date().toISOString();
    
    console.log('\n🔒 =============== 配置安全检查结果 ===============');
    console.log(`📅 检查时间: ${timestamp}`);
    console.log(`🌍 环境: ${config.nodeEnv}`);
    console.log(`📊 安全分数: ${result.securityScore}/100`);
    console.log(`✅ 总体状态: ${result.isValid ? '通过' : '不通过'}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ 严重问题 (必须修复):');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  警告 (建议修复):');
      result.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }
    
    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log('\n🎉 配置安全检查全部通过！');
    }
    
    console.log('\n💡 安全建议:');
    console.log('   1. 定期更换JWT密钥');
    console.log('   2. 使用强密码策略');
    console.log('   3. 启用HTTPS传输加密');
    console.log('   4. 限制CORS域名范围');
    console.log('   5. 定期检查访问日志');
    
    console.log('================================================\n');
  }

  /**
   * 生成安全配置建议
   */
  static generateSecurityRecommendations(): string[] {
    const recommendations = [
      '使用 openssl rand -base64 32 生成强JWT密钥',
      '修改所有默认密码为强密码（至少8位，包含大小写字母、数字和特殊字符）',
      '在生产环境启用HTTPS',
      '配置具体的CORS域名，避免使用通配符',
      '定期备份数据库文件',
      '设置适当的文件上传大小限制',
      '配置日志轮转，避免日志文件过大',
      '使用防火墙限制不必要的端口访问',
    ];
    
    return recommendations;
  }
} 