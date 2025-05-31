# 数据库部署指南

## 📁 文件结构

```
backend/database/
├── schema.sql              # 数据库架构定义 (表结构、索引、触发器)
├── seed.sql                # 基础数据 (管理员账号)
├── init-database.ts        # 数据库初始化脚本
└── README.md              # 此文档
```

## 🚀 快速部署

### 标准部署

```bash
# 初始化数据库
cd backend
npx tsx database/init-database.ts --verbose

# 或使用npm脚本
npm run init-db
```

### 强制重新初始化

```bash
# 强制重新初始化（会备份现有数据库）
npx tsx database/init-database.ts --force --verbose

# 或使用npm脚本
npm run init-db:force
```

## 📋 基础数据说明

### 默认管理员账号 (`seed.sql`)

**管理员账号:**
- **超级管理员**: `admin` / `Psw#123456`
- **备用管理员**: `manager` / `Psw#123456`

⚠️ **重要**: 部署后**立即修改默认密码**！

## 🔧 命令行选项

### 基本用法
```bash
npx tsx database/init-database.ts [选项]
```

### 可用选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `--force` | 强制重新初始化（会备份现有数据） | `--force` |
| `--no-seed` | 只创建表结构，不插入基础数据 | `--no-seed` |
| `--verbose` | 显示详细执行日志 | `--verbose` |
| `--help` | 显示帮助信息 | `--help` |

### 使用示例

```bash
# 标准初始化
npx tsx database/init-database.ts --verbose

# 只创建表结构，不插入任何数据
npx tsx database/init-database.ts --no-seed --verbose

# 强制重新初始化并备份现有数据
npx tsx database/init-database.ts --force --verbose
```

## 🗃️ 数据库架构

### 核心表结构

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `users` | 用户表 | id (UUID), username, email, role, password |
| `apps` | 应用表 | id (UUID), name, appKey, downloadKey, system |
| `versions` | 版本表 | id (UUID), appId, version, buildNumber, filePath |
| `files` | 文件表 | id (UUID), originalName, status, parsedInfo |

### 索引优化

- 所有主键使用 UUID v4 格式
- 用户名、邮箱、appKey、downloadKey 建立唯一索引
- 查询热点字段建立普通索引
- 时间字段建立索引优化排序查询

### 触发器

- 自动更新 `updated_at` 时间戳
- 数据变更日志记录

## 🔐 安全配置

### 默认配置
- 管理员密码: `Psw#123456` (使用bcrypt加密，12轮)
- 邮箱: `admin@appcenter.com`, `manager@appcenter.com`
- 部署后立即修改所有默认配置

## 📝 部署后检查清单

### 必做事项

- [ ] 修改所有默认密码
- [ ] 更新管理员邮箱为企业邮箱
- [ ] 根据需要修改用户名
- [ ] 删除不需要的默认账号
- [ ] 配置强密码策略
- [ ] 启用访问日志监控
- [ ] 设置定期数据库备份
- [ ] 配置SSL/TLS证书
- [ ] 验证外键约束启用
- [ ] 检查数据库文件权限

### 验证命令

```bash
# 检查管理员账号
sqlite3 data/database.sqlite "SELECT username, email, role FROM users WHERE role IN ('super_admin', 'admin');"

# 检查表结构
sqlite3 data/database.sqlite ".schema"

# 检查数据统计
sqlite3 data/database.sqlite "SELECT 'Users: ' || COUNT(*) FROM users; SELECT 'Apps: ' || COUNT(*) FROM apps;"
```

## 🔄 数据备份与恢复

### 备份
```bash
# 手动备份
cp data/database.sqlite data/database.backup.$(date +%Y%m%d_%H%M%S).sqlite

# 使用npm脚本备份
npm run db:backup

# 脚本会在强制初始化时自动备份
npx tsx database/init-database.ts --force
```

### 恢复
```bash
# 从备份恢复
cp data/database.backup.20250131_143022.sqlite data/database.sqlite
```

## 🐛 故障排除

### 常见问题

**Q: 执行脚本时提示文件不存在**
```bash
A: 确保在 backend 目录下执行命令，检查文件路径是否正确
```

**Q: 数据库已存在但想重新初始化**
```bash
A: 使用 --force 参数，脚本会自动备份现有数据库
npx tsx database/init-database.ts --force
```

**Q: 初始化后登录失败**
```bash
A: 检查密码是否正确，默认密码为 Psw#123456
```

**Q: 外键约束错误**
```bash
A: 确保 SQLite 版本支持外键约束，检查 PRAGMA foreign_keys = ON 是否生效
```

### 日志查看

```bash
# 详细日志模式
npx tsx database/init-database.ts --verbose

# 查看数据库日志
cat logs/request-$(date +%Y-%m-%d).log
```

## 📚 相关文档

- [环境配置说明](../ENVIRONMENT_SETUP.md)
- [UUID标准说明](../src/utils/testIdGeneration.ts)
- [错误码规范](../src/utils/responseCodes.ts) 