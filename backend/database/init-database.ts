#!/usr/bin/env npx tsx

/**
 * 数据库初始化脚本
 * 用于部署时初始化数据库结构和基础数据
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../src/config/config';

interface InitOptions {
  force?: boolean;
  seedData?: boolean;
  verbose?: boolean;
}

class DatabaseInitializer {
  private db: Database.Database;
  private verbose: boolean = false;

  constructor(private options: InitOptions = {}) {
    this.verbose = options.verbose || false;
    this.db = new Database(config.databasePath);
    
    // 启用外键约束
    this.db.pragma('foreign_keys = ON');
    
    this.log(`📂 数据库文件: ${config.databasePath}`);
  }

  private log(message: string) {
    if (this.verbose) {
      console.log(message);
    }
  }

  private error(message: string) {
    console.error(`❌ ${message}`);
  }

  private success(message: string) {
    console.log(`✅ ${message}`);
  }

  /**
   * 检查数据库是否已初始化
   */
  private isDatabaseInitialized(): boolean {
    try {
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const requiredTables = ['users', 'apps', 'versions', 'files'];
      
      return requiredTables.every(table => 
        tables.some((t: any) => t.name === table)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * 执行SQL文件
   */
  private executeSqlFile(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        this.error(`SQL文件不存在: ${filePath}`);
        return false;
      }

      const sql = fs.readFileSync(filePath, 'utf-8');
      this.log(`📜 执行SQL文件: ${path.basename(filePath)}`);
      
      // 分割SQL语句并执行
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.toUpperCase().startsWith('SELECT')) {
          // 执行查询语句并显示结果
          try {
            const result = this.db.prepare(statement).all();
            if (result.length > 0) {
              console.log(result);
            }
          } catch (error) {
            // 忽略查询错误，可能是表还不存在
            this.log(`查询跳过: ${statement.substring(0, 50)}...`);
          }
        } else if (statement.trim()) {
          try {
            // 使用 prepare().run() 而不是 exec() 来避免事务问题
            this.db.prepare(statement).run();
          } catch (error) {
            // 对于某些语句类型，fallback 到 exec()
            try {
              this.db.exec(statement);
            } catch (execError) {
              this.log(`语句执行警告: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }
      }

      return true;
    } catch (error) {
      this.error(`执行SQL文件失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * 初始化数据库结构
   */
  private initializeSchema(): boolean {
    const schemaPath = path.join(__dirname, 'schema.sql');
    this.log('🏗️  创建数据库结构...');
    return this.executeSqlFile(schemaPath);
  }

  /**
   * 初始化基础数据
   */
  private initializeSeedData(): boolean {
    const seedPath = path.join(__dirname, 'seed.sql');
    
    this.log('🌱 初始化基础数据...');
    return this.executeSqlFile(seedPath);
  }

  /**
   * 备份现有数据库
   */
  private backupDatabase(): string | null {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${config.databasePath}.backup.${timestamp}`;
      
      fs.copyFileSync(config.databasePath, backupPath);
      this.success(`数据库已备份到: ${backupPath}`);
      return backupPath;
    } catch (error) {
      this.error(`数据库备份失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * 主初始化方法
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log('🚀 开始数据库初始化...\n');

      // 检查是否已初始化
      if (this.isDatabaseInitialized() && !this.options.force) {
        console.log('ℹ️  数据库已初始化，使用 --force 参数强制重新初始化');
        return true;
      }

      // 如果强制初始化且数据库存在，先备份
      if (this.options.force && fs.existsSync(config.databasePath)) {
        this.backupDatabase();
      }

      // 1. 创建数据库结构
      if (!this.initializeSchema()) {
        return false;
      }
      this.success('数据库结构创建完成');

      // 2. 初始化基础数据
      if (this.options.seedData !== false) {
        if (!this.initializeSeedData()) {
          this.error('基础数据初始化失败');
          return false;
        }
        this.success('基础数据初始化完成');
      }

      // 3. 验证初始化结果
      const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      const appCount = this.db.prepare('SELECT COUNT(*) as count FROM apps').get() as { count: number };
      
      console.log('\n📊 初始化结果:');
      console.log(`   👥 用户数量: ${userCount.count}`);
      console.log(`   📱 应用数量: ${appCount.count}`);

      this.success('数据库初始化完成！');
      return true;

    } catch (error) {
      this.error(`数据库初始化失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      this.db.close();
    }
  }
}

/**
 * 命令行入口
 */
async function main() {
  const args = process.argv.slice(2);
  
  const options: InitOptions = {
    force: false,
    seedData: true,
    verbose: false
  };

  // 解析命令行参数
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--force':
        options.force = true;
        break;
      case '--no-seed':
        options.seedData = false;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
数据库初始化脚本

用法: npx tsx database/init-database.ts [选项]

选项:
  --force                     强制重新初始化
  --no-seed                   不插入基础数据
  --verbose, -v               显示详细日志
  --help, -h                  显示帮助信息

示例:
  npx tsx database/init-database.ts
  npx tsx database/init-database.ts --force
  npx tsx database/init-database.ts --no-seed --verbose
        `);
        process.exit(0);
        break;
      default:
        console.warn(`未知参数: ${arg}`);
        break;
    }
  }

  const initializer = new DatabaseInitializer(options);
  const success = await initializer.initialize();
  
  process.exit(success ? 0 : 1);
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseInitializer, InitOptions }; 