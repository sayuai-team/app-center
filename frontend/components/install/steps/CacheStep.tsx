import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Zap } from 'lucide-react';

interface CacheStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  currentStep: number;
  isLastStep: boolean;
}

export function CacheStep({ formData, updateFormData, nextStep, prevStep }: CacheStepProps) {
  const config = {
    type: 'memory'
  };

  const handleNext = () => {
    updateFormData({ cache: config });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">缓存设置</h2>
        <p className="text-muted-foreground">
          配置应用的缓存服务，提升系统性能
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            内存缓存
          </CardTitle>
          <CardDescription>
            使用应用内存作为缓存存储
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <div>
                  <h4 className="font-medium text-blue-900">内存缓存已选择</h4>
                  <p className="text-sm text-blue-700">
                    缓存数据将存储在应用内存中，适合开发环境和小型应用
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Zap className="h-4 w-4" />
        <AlertTitle>内存缓存特性</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1">
            <li>• 无需额外配置，开箱即用</li>
            <li>• 读写速度快，性能优秀</li>
            <li>• 适合开发环境和中小型应用</li>
            <li>• 应用重启后缓存数据会丢失</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>配置预览</CardTitle>
          <CardDescription>
            当前缓存配置的详细信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">类型:</span> 内存缓存
              </div>
              <div>
                <span className="font-medium">存储:</span> 应用内存
              </div>
              <div>
                <span className="font-medium">持久化:</span> 否
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
          内存缓存配置已完成，可以继续下一步。
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