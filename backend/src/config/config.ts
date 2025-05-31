interface Config {
  port: number;
  host: string;
  nodeEnv: string;
  databasePath: string;
  jwtSecret: string;
  jwtExpiresIn?: string;  // Optional
  uploadDir?: string;     // Optional
  maxFileSize?: number;   // Optional
  corsOrigin: string;
  sslKeyPath?: string;    // Optional - only needed when HTTPS is enabled
  sslCertPath?: string;   // Optional - only needed when HTTPS is enabled
  enableHttps: boolean;
  // Default admin accounts
  defaultSuperAdminUsername: string;
  defaultSuperAdminEmail: string;
  defaultSuperAdminPassword: string;
  defaultAdminUsername: string;
  defaultAdminEmail: string;
  defaultAdminPassword: string;
}

export const config: Config = {
  // Core server settings - all required
  port: parseInt(requireEnv('PORT'), 10),
  host: requireEnv('HOST'),
  nodeEnv: requireEnv('NODE_ENV'),
  
  // Critical settings - require explicit configuration
  databasePath: requireEnv('DATABASE_PATH'),
  jwtSecret: requireEnvWithValidation('JWT_SECRET', 
    (value) => value.length >= 32, 
    'JWT_SECRET must be at least 32 characters long'
  ),
  corsOrigin: requireEnv('CORS_ORIGIN'),
  
  // Optional settings - no defaults
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  uploadDir: process.env.UPLOAD_DIR,
  maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE, 10) : undefined,
  sslKeyPath: process.env.SSL_KEY_PATH,
  sslCertPath: process.env.SSL_CERT_PATH,
  enableHttps: process.env.ENABLE_HTTPS === 'true',
  
  // Default admin accounts - with fallback defaults
  defaultSuperAdminUsername: process.env.DEFAULT_SUPER_ADMIN_USERNAME || 'admin',
  defaultSuperAdminEmail: process.env.DEFAULT_SUPER_ADMIN_EMAIL || 'admin@appcenter.com',
  defaultSuperAdminPassword: process.env.DEFAULT_SUPER_ADMIN_PASSWORD || 'Psw#123456',
  defaultAdminUsername: process.env.DEFAULT_ADMIN_USERNAME || 'manager',
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'manager@appcenter.com',
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'Psw#123456',
}; 

// Helper function to require environment variables
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Required environment variable ${name} is not set`);
  }
  return value;
}

// Helper function to require environment variables with validation
function requireEnvWithValidation(name: string, validator?: (value: string) => boolean, errorMsg?: string): string {
  const value = requireEnv(name);
  if (validator && !validator(value)) {
    throw new Error(`❌ Invalid value for environment variable ${name}: ${errorMsg || 'validation failed'}`);
  }
  return value;
}