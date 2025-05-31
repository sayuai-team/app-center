-- ================================
-- App Center 生产环境基础数据
-- 环境: Production
-- 创建时间: 2025-01-31
-- 描述: 仅包含必要的管理员账号，无示例数据
-- ================================

-- ⚠️  重要安全提醒:
-- 1. 生产环境部署后立即修改默认密码
-- 2. 使用强密码策略
-- 3. 定期更新管理员密码
-- 4. 考虑启用多因素认证

-- ================================
-- 生产环境管理员账号
-- ================================

-- 注意：以下密码仅为初始部署使用，部署后必须立即修改
-- 默认密码: Psw#123456 (已加密)

-- 超级管理员账号
-- 用户名: admin (生产环境建议修改为您的用户名)
-- 邮箱: admin@appcenter.com (请修改为您的企业邮箱)
-- 密码: Psw#123456 (部署后立即修改)
INSERT OR IGNORE INTO users (
    id, 
    username, 
    email, 
    password, 
    role, 
    isActive,
    created_at,
    updated_at
) VALUES (
    '880e8400-e29b-41d4-a716-446655440001',
    'admin',
    'admin@appcenter.com',
    '$2b$12$G36RcwzZ9chddhD.YpM3pOnZzxeJ9xWO/41OTby/MQ/OBpeN7wna.',
    'super_admin',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 备用管理员账号
-- 用户名: manager (生产环境建议修改)
-- 邮箱: manager@appcenter.com (请修改为您的企业邮箱)
-- 密码: Psw#123456 (部署后立即修改)
INSERT OR IGNORE INTO users (
    id, 
    username, 
    email, 
    password, 
    role, 
    isActive,
    created_at,
    updated_at
) VALUES (
    '880e8400-e29b-41d4-a716-446655440002',
    'manager',
    'manager@appcenter.com',
    '$2b$12$G36RcwzZ9chddhD.YpM3pOnZzxeJ9xWO/41OTby/MQ/OBpeN7wna.',
    'admin',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ================================
-- 生产环境配置验证
-- ================================

-- 验证管理员账号创建情况
SELECT 'Production Admin Users Created: ' || COUNT(*) as info 
FROM users 
WHERE role IN ('super_admin', 'admin');

-- ================================
-- 部署后必做事项提醒
-- ================================

-- 请在部署完成后执行以下步骤:
-- 1. 登录系统并立即修改所有默认密码
-- 2. 更新管理员邮箱为真实企业邮箱
-- 3. 根据需要修改用户名
-- 4. 删除不需要的默认账号
-- 5. 配置强密码策略
-- 6. 启用访问日志监控
-- 7. 定期备份数据库
-- 8. 配置SSL/TLS证书

-- 查看当前管理员信息 (供验证使用)
SELECT 
    username,
    email,
    role,
    isActive,
    created_at
FROM users 
WHERE role IN ('super_admin', 'admin')
ORDER BY role DESC, created_at ASC; 