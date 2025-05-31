import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api';
import https from 'https';

// Create an HTTPS agent that ignores self-signed certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function GET(
  request: NextRequest,
  { params }: { params: { downloadKey: string } }
) {
  try {
    const { downloadKey } = await params;
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('version');
    
    // 构建后端 API URL
    let backendUrl = buildApiUrl(`/api/v1/download/${downloadKey}/plist`);
    
    // 如果有版本参数，添加到URL
    if (versionId) {
      backendUrl += `?version=${encodeURIComponent(versionId)}`;
    }
    
    // 转发请求到后端（忽略自签名证书错误）
    const response = await fetch(backendUrl, {
      method: 'GET',
      // @ts-ignore - Node.js specific agent
      agent: httpsAgent,
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: '应用不存在或已下架' 
        }, 
        { status: response.status }
      );
    }

    // 获取响应内容和headers
    const content = await response.text();
    const contentType = response.headers.get('content-type') || 'application/x-plist';
    const contentDisposition = response.headers.get('content-disposition');

    // 创建响应并复制相关headers
    const nextResponse = new NextResponse(content);
    nextResponse.headers.set('Content-Type', contentType);
    
    if (contentDisposition) {
      nextResponse.headers.set('Content-Disposition', contentDisposition);
    }

    return nextResponse;
    
  } catch (error) {
    console.error('Plist API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器连接错误' 
      }, 
      { status: 500 }
    );
  }
} 