import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface LicenseStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  currentStep: number;
  isLastStep: boolean;
}

export function LicenseStep({ formData, updateFormData, nextStep }: LicenseStepProps) {
  const [agreed, setAgreed] = useState(formData.license || false);

  const handleNext = () => {
    if (agreed) {
      updateFormData({ license: true });
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">许可协议</h2>
        <p className="text-muted-foreground">
          请仔细阅读以下许可协议，同意后方可继续安装
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">App Center 软件许可协议</h3>
        <p className="text-sm text-muted-foreground">
          请仔细阅读以下条款和条件，使用本软件即表示您同意受本协议约束
        </p>
      </div>

      <ScrollArea className="h-80 w-full rounded-md border p-4">
        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-base">1. 许可授权</h4>
            <p className="text-muted-foreground leading-relaxed">
              我们授予您一个非独占的、不可转让的许可，允许您按照本协议的条款使用 App Center 软件。
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-base">2. 使用限制</h4>
            <ul className="text-muted-foreground space-y-1 pl-4">
              <li>• 您不得复制、修改、分发、销售或出租本软件的任何部分</li>
              <li>• 您不得对软件进行反向工程、反编译或反汇编</li>
              <li>• 您不得移除或修改软件中的任何版权声明或其他所有权标识</li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-base">3. 隐私保护</h4>
            <p className="text-muted-foreground leading-relaxed">
              我们承诺保护您的隐私和数据安全。详细的隐私政策请参考我们的隐私声明。
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-base">4. 免责声明</h4>
            <p className="text-muted-foreground leading-relaxed">
              本软件按"现状"提供，不提供任何明示或暗示的保证。在适用法律允许的最大范围内，我们不承担任何直接、间接、附带或后果性损害的责任。
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-base">5. 协议修改</h4>
            <p className="text-muted-foreground leading-relaxed">
              我们保留随时修改本协议的权利。修改后的协议将在发布后生效。
            </p>
          </div>

          <Separator />

          <div className="pt-4">
            <p className="text-xs text-muted-foreground">
              最后更新时间：2024年1月1日
            </p>
          </div>
        </div>
      </ScrollArea>

      <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/50">
        <Checkbox
          id="license-agreement"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(!!checked)}
        />
        <label
          htmlFor="license-agreement"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          我已阅读并同意上述许可协议
        </label>
      </div>

      <div className="flex justify-end pt-6">
        <Button
          onClick={handleNext}
          disabled={!agreed}
          size="lg"
        >
          同意并继续
        </Button>
      </div>
    </div>
  );
} 