import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield, User, Key } from 'lucide-react';

interface AdminStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  currentStep: number;
  isLastStep: boolean;
}

export function AdminStep({ formData, updateFormData, nextStep, prevStep }: AdminStepProps) {
  // 默认管理员配置
  const defaultAdmin = {
    username: 'admin',
    email: 'admin@appcenter.local',
    displayName: '系统管理员'
  };

  const handleNext = () => {
    updateFormData({ admin: defaultAdmin });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">管理员设置</h2>
        <p className="text-muted-foreground">
          系统将使用默认的管理员账户，您可以在后续的管理后台中修改
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            默认管理员账户
          </CardTitle>
          <CardDescription>
            系统预置的管理员账户信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">用户名</div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {defaultAdmin.username}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">邮箱</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {defaultAdmin.email}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">显示名称</div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {defaultAdmin.displayName}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            登录凭据
          </CardTitle>
          <CardDescription>
            首次登录使用的默认密码
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">默认密码:</span>
                  <Badge variant="secondary" className="font-mono text-lg">
                    Psw#123456
                  </Badge>
                </div>
                <p className="text-sm text-yellow-700">
                  <strong>重要:</strong> 首次登录后请立即修改默认密码
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>权限说明</CardTitle>
          <CardDescription>
            默认管理员账户的权限范围
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">系统配置管理</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">用户账户管理</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">应用包管理</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">系统监控与日志</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="border-yellow-200 bg-yellow-50">
        <Shield className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">安全提醒</AlertTitle>
        <AlertDescription className="text-yellow-700">
          <ul className="mt-2 space-y-1">
            <li>• 首次登录后请立即修改默认密码</li>
            <li>• 建议设置复杂密码（包含大小写字母、数字和特殊字符）</li>
            <li>• 可以在管理后台中添加更多管理员账户</li>
            <li>• 定期检查和更新管理员权限设置</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">账户就绪</AlertTitle>
        <AlertDescription className="text-green-700">
          默认管理员账户已配置完成，可以继续安装流程。
        </AlertDescription>
      </Alert>

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          size="lg"
        >
          上一步
        </Button>
        
        <Button
          onClick={handleNext}
          size="lg"
        >
          确认并继续
        </Button>
      </div>
    </div>
  );
} 