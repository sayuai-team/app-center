/**
 * 测试新的UUID ID生成功能
 */

import { generateId, generateIdWithLength, isValidId, isValidUuidV4 } from './idGenerator';

function testIdGeneration() {
  console.log('🧪 测试UUID ID生成功能\n');

  // 测试基本UUID生成
  console.log('📋 基本UUID测试:');
  for (let i = 0; i < 5; i++) {
    const id = generateId();
    console.log(`  ${i + 1}. ${id} (长度: ${id.length}, 有效: ${isValidId(id)}, UUID v4: ${isValidUuidV4(id)})`);
  }

  // 测试不同长度的ID（兼容性功能）
  console.log('\n📋 兼容性功能 - 不同长度随机字符串测试:');
  [8, 12, 16, 20, 24].forEach(length => {
    const id = generateIdWithLength(length);
    console.log(`  ${length}位: ${id} (长度: ${id.length})`);
  });

  // 测试UUID唯一性（生成1000个UUID检查重复）
  console.log('\n📋 唯一性测试 (1000个UUID):');
  const ids = new Set();
  for (let i = 0; i < 1000; i++) {
    ids.add(generateId());
  }
  console.log(`  生成: 1000, 唯一: ${ids.size}, 重复: ${1000 - ids.size}`);

  // 测试UUID格式验证
  console.log('\n📋 UUID格式验证测试:');
  const testCases = [
    { id: generateId(), expected: true, desc: '标准UUID v4' },
    { id: '550e8400-e29b-41d4-a716-446655440000', expected: true, desc: '有效UUID' },
    { id: 'abcd1234-5678-4abc-8def-123456789012', expected: true, desc: '有效UUID v4' },
    { id: 'short', expected: false, desc: '太短' },
    { id: 'not-a-uuid-format-string', expected: false, desc: '不是UUID格式' },
    { id: '550e8400-e29b-41d4-a716-44665544000', expected: false, desc: '长度不对' },
    { id: '550e8400-e29b-41d4-a716-44665544000g', expected: false, desc: '包含非法字符' },
    { id: '550e8400-e29b-21d4-a716-446655440000', expected: true, desc: 'UUID v2 (仍然有效UUID)' },
    { id: '550e8400-e29b-51d4-a716-446655440000', expected: true, desc: 'UUID v5 (仍然有效UUID)' }
  ];

  testCases.forEach(({ id, expected, desc }) => {
    const result = isValidId(id);
    const v4Result = isValidUuidV4(id);
    const status = result === expected ? '✅' : '❌';
    console.log(`  ${status} ${desc}: "${id}" -> UUID有效: ${result}, UUID v4: ${v4Result}`);
  });

  console.log('\n🎯 对比旧格式:');
  const oldAppId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newAppId = generateId();
  const oldVersionId = `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newVersionId = generateId();
  
  console.log(`  旧App ID:     ${oldAppId} (${oldAppId.length}字符)`);
  console.log(`  新App ID:     ${newAppId} (${newAppId.length}字符)`);
  console.log(`  旧Version ID: ${oldVersionId} (${oldVersionId.length}字符)`);
  console.log(`  新Version ID: ${newVersionId} (${newVersionId.length}字符)`);
  
  console.log('\n📊 UUID优势:');
  console.log('  ✅ 标准格式 - 符合RFC 4122规范');
  console.log('  ✅ 全球唯一 - 极低碰撞概率');
  console.log('  ✅ 时间无关 - 不暴露生成时间');
  console.log('  ✅ 固定长度 - 36字符（含连字符）');
  console.log('  ✅ 更好兼容 - 大多数系统支持');
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testIdGeneration();
}

export { testIdGeneration }; 