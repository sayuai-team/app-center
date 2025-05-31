import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Info } from 'lucide-react';

interface DatabaseStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  currentStep: number;
  isLastStep: boolean;
}

export function DatabaseStep({ formData, updateFormData, nextStep, prevStep }: DatabaseStepProps) {
  const [config, setConfig] = useState({
    type: 'sqlite',
    database: formData.database?.database || 'app_center',
    ...formData.database
  });

  const handleInputChange = (field: string, value: string) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    updateFormData({ database: config });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">数据库设置</h2>
        <p className="text-muted-foreground">
          配置 SQLite 数据库，适合开发和小型应用使用
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SQLite 数据库配置</CardTitle>
          <CardDescription>
            轻量级数据库，数据库文件将保存在应用目录中
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="db-name">数据库名</Label>
            <Input
              id="db-name"
              value={config.database}
              onChange={(e) => handleInputChange('database', e.target.value)}
              placeholder="app_center"
            />
            <p className="text-sm text-muted-foreground">
              数据库文件将保存为 <code>{config.database}.db</code>
            </p>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>SQLite 说明</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1">
            <li>• SQLite 是一个轻量级的嵌入式数据库</li>
            <li>• 不需要单独的数据库服务器</li>
            <li>• 数据文件将存储在 <code>./data/</code> 目录中</li>
            <li>• 适合开发环境和中小型应用</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>配置预览</CardTitle>
          <CardDescription>
            当前数据库配置信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">类型:</span> SQLite
              </div>
              <div>
                <span className="font-medium">数据库名:</span> {config.database}
              </div>
              <div>
                <span className="font-medium">文件路径:</span> ./data/{config.database}.db
              </div>
              <div>
                <span className="font-medium">状态:</span> 
                <span className="text-green-600 ml-1">就绪</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">配置完成</AlertTitle>
        <AlertDescription className="text-green-700">
          SQLite 数据库配置已完成，可以继续下一步。
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
          下一步
        </Button>
      </div>
    </div>
  );
} 