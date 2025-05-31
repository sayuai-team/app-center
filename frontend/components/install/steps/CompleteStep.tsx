import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, ExternalLink, Copy, Check, Sparkles, AlertTriangle, Info } from 'lucide-react';

interface CompleteStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  currentStep: number;
  isLastStep: boolean;
}

export function CompleteStep({ formData, prevStep }: CompleteStepProps) {
  const [installing, setInstalling] = useState(true);
  const [installComplete, setInstallComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);

  const adminUrl = `${window.location.origin}/dashboard`;

  useEffect(() => {
    performInstallation();
  }, []);

  const performInstallation = async () => {
    const steps = [
      '创建数据库表结构...',
      '初始化系统配置...',
      '创建管理员账户...',
      '配置缓存设置...',
      '生成安全密钥...',
      '完成安装...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInstallProgress(((i + 1) / steps.length) * 100);
    }

    setInstalling(false);
    setInstallComplete(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleEnterAdmin = () => {
    window.open(adminUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">安装完成</h2>
        <p className="text-muted-foreground">
          {installing ? '正在完成最后的安装步骤...' : '恭喜！App Center 已成功安装'}
        </p>
      </div>

      {installing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              安装进行中
            </CardTitle>
            <CardDescription>
              正在配置系统并完成最后的设置步骤
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={installProgress} className="w-full" />
            <div className="text-center text-sm text-muted-foreground">
              安装进度: {Math.round(installProgress)}%
            </div>
          </CardContent>
        </Card>
      )}

      {installComplete && (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-green-800">安装成功！</h3>
                  <p className="text-green-700 mt-2">
                    恭喜，您已完成了 App Center 的安装配置
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  系统信息
                </CardTitle>
                <CardDescription>
                  当前配置的系统信息概览
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">数据库</span>
                    <Badge variant="secondary">
                      {formData.database?.type || '未配置'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">缓存</span>
                    <Badge variant="secondary">
                      {formData.cache?.type === 'memory' ? '内存缓存' : 'Redis'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">管理员</span>
                    <Badge variant="outline">
                      {formData.admin?.username || '未配置'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">状态</span>
                    <Badge className="bg-green-500 hover:bg-green-600">
                      运行中
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>访问信息</CardTitle>
                <CardDescription>
                  管理后台访问地址和登录凭据
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">管理后台地址</Label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono">
                      {adminUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(adminUrl)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">登录账户</Label>
                  <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                    <div><span className="font-medium">用户名:</span> admin</div>
                    <div><span className="font-medium">邮箱:</span> admin@appcenter.com</div>
                    <div><span className="font-medium">默认密码:</span> Psw#123456</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>下一步操作</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1">
                <li>• 访问管理后台完成系统初始化配置</li>
                <li>• 配置应用上传和分发设置</li>
                <li>• 设置用户权限和组织架构</li>
                <li>• 查看使用文档和最佳实践</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">重要提醒</AlertTitle>
            <AlertDescription className="text-yellow-700">
              <ul className="mt-2 space-y-1">
                <li>• 请妥善保管管理员登录凭据</li>
                <li>• 建议启用 HTTPS 以确保数据传输安全</li>
                <li>• 定期备份数据库和配置文件</li>
                <li>• 关注系统更新和安全补丁</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Button
                onClick={handleEnterAdmin}
                size="lg"
                className="px-8"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                进入管理后台
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                获取更多使用帮助请访问{' '}
                <a 
                  href="https://docs.appcenter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  App Center 文档中心
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={installing}
          size="lg"
        >
          上一步
        </Button>
        
        {installComplete && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 mr-1" />
            安装完成时间: {new Date().toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
} 