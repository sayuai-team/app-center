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
    
    // 构建后端 API URL
    const backendUrl = buildApiUrl(`/api/v1/download/${downloadKey}/versions`);
    
    // 转发请求到后端（忽略自签名证书错误）
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // @ts-ignore - Node.js specific agent
      agent: httpsAgent,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        success: false, 
        message: '获取版本历史失败' 
      }));
      
      return NextResponse.json(errorData, { 
        status: response.status 
      });
    }

    const data = await response.json();
    return NextResponse.json(data.data || data);
    
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器连接错误' 
      }, 
      { status: 500 }
    );
  }
} 