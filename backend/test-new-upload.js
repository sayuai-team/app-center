const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testNewUploadFlow() {
  console.log('🧪 测试新的两阶段上传流程...\n');

  try {
    // 阶段1: 上传文件到临时目录
    console.log('📤 阶段1: 上传文件并解析...');
    
    // 创建一个模拟的IPA文件用于测试
    const testFilePath = path.join(__dirname, 'test.ipa');
    if (!fs.existsSync(testFilePath)) {
      console.log('⚠️  创建测试文件...');
      fs.writeFileSync(testFilePath, 'fake ipa content for testing');
    }
    
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    
    const uploadResponse = await axios.post(`${BASE_URL}/files/upload`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });
    
    console.log('✅ 上传成功!');
    console.log('📄 文件ID:', uploadResponse.data.data.fileId);
    console.log('📱 解析信息:', JSON.stringify(uploadResponse.data.data.appInfo, null, 2));
    
    const fileId = uploadResponse.data.data.fileId;
    
    // 阶段2: 使用文件ID创建版本
    console.log('\n📝 阶段2: 创建版本...');
    
    const versionData = {
      fileId: fileId,
      version: '1.0.0',
      buildNumber: '1',
      updateContent: '测试版本',
      confirm: true
    };
    
    const createVersionResponse = await axios.post(
      `${BASE_URL}/apps/test-app-id/versions`, 
      versionData
    );
    
    console.log('✅ 版本创建成功!');
    console.log('📋 版本信息:', JSON.stringify(createVersionResponse.data.data, null, 2));
    
    // 清理测试文件
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 清理测试文件完成');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    // 清理测试文件
    const testFilePath = path.join(__dirname, 'test.ipa');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testNewUploadFlow();
}

module.exports = { testNewUploadFlow }; 