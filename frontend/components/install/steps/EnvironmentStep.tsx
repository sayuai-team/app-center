import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EnvironmentStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  currentStep: number;
  isLastStep: boolean;
}

interface CheckItem {
  name: string;
  description: string;
  required: boolean;
  status: 'checking' | 'pass' | 'fail' | 'warning';
  message?: string;
}

export function EnvironmentStep({ formData, updateFormData, nextStep, prevStep }: EnvironmentStepProps) {
  const [checks, setChecks] = useState<CheckItem[]>([
    {
      name: 'Node.js 版本',
      description: '检查 Node.js 版本是否 >= 18.0.0',
      required: true,
      status: 'checking'
    },
    {
      name: '磁盘空间',
      description: '检查可用磁盘空间是否 >= 1GB',
      required: true,
      status: 'checking'
    },
    {
      name: '网络连接',
      description: '检查网络连接是否正常',
      required: true,
      status: 'checking'
    },
    {
      name: '端口可用性',
      description: '检查端口 3000 是否可用',
      required: true,
      status: 'checking'
    },
    {
      name: '数据库连接',
      description: '检查数据库服务是否可用',
      required: false,
      status: 'checking'
    },
    {
      name: '文件权限',
      description: '检查应用目录的读写权限',
      required: true,
      status: 'checking'
    }
  ]);

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    runEnvironmentChecks();
  }, []);

  const runEnvironmentChecks = async () => {
    const updatedChecks = [...checks];

    // 模拟环境检测过程
    for (let i = 0; i < updatedChecks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟检测结果
      switch (i) {
        case 0: // Node.js 版本
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: 'pass',
            message: 'Node.js v20.10.0'
          };
          break;
        case 1: // 磁盘空间
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: 'pass',
            message: '可用空间: 15.2 GB'
          };
          break;
        case 2: // 网络连接
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: 'pass',
            message: '网络连接正常'
          };
          break;
        case 3: // 端口可用性
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: 'pass',
            message: '端口 3000 可用'
          };
          break;
        case 4: // 数据库连接
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: 'warning',
            message: '数据库服务未启动 (可选)'
          };
          break;
        case 5: // 文件权限
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: 'pass',
            message: '权限检查通过'
          };
          break;
      }

      setChecks([...updatedChecks]);
    }

    setIsChecking(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (check: CheckItem) => {
    switch (check.status) {
      case 'checking':
        return <Badge variant="secondary">检测中</Badge>;
      case 'pass':
        return <Badge variant="default" className="bg-green-500">通过</Badge>;
      case 'fail':
        return <Badge variant="destructive">失败</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">警告</Badge>;
      default:
        return null;
    }
  };

  const canProceed = () => {
    return checks.every(check => !check.required || check.status === 'pass');
  };

  const hasFailures = () => {
    return checks.some(check => check.required && check.status === 'fail');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">环境检测</h2>
        <p className="text-muted-foreground">
          正在检查系统环境是否满足安装要求
        </p>
      </div>

      <div className="grid gap-4">
        {checks.map((check, index) => (
          <Card key={index} className="transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h3 className="font-medium">
                      {check.name}
                      {check.required && <span className="text-destructive ml-1">*</span>}
                    </h3>
                    <p className="text-sm text-muted-foreground">{check.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {check.message && (
                    <span className="text-sm text-muted-foreground hidden sm:block">
                      {check.message}
                    </span>
                  )}
                  {getStatusBadge(check)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isChecking && hasFailures() && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>环境检测失败</AlertTitle>
          <AlertDescription>
            请解决上述必需项目的问题后重新检测。
          </AlertDescription>
        </Alert>
      )}

      {!isChecking && !hasFailures() && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>环境检测通过</AlertTitle>
          <AlertDescription>
            系统环境满足安装要求，可以继续下一步。
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          size="lg"
        >
          上一步
        </Button>
        
        <div className="space-x-3">
          {!isChecking && hasFailures() && (
            <Button
              variant="outline"
              onClick={runEnvironmentChecks}
              size="lg"
            >
              重新检测
            </Button>
          )}
          
          <Button
            onClick={nextStep}
            disabled={isChecking || !canProceed()}
            size="lg"
          >
            {isChecking ? '检测中...' : '下一步'}
          </Button>
        </div>
      </div>
    </div>
  );
} 