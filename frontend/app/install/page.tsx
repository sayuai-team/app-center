'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InstallProgress } from '@/components/install/InstallProgress';
import { LicenseStep } from '@/components/install/steps/LicenseStep';
import { EnvironmentStep } from '@/components/install/steps/EnvironmentStep';
import { DatabaseStep } from '@/components/install/steps/DatabaseStep';
import { CacheStep } from '@/components/install/steps/CacheStep';
import { AdminStep } from '@/components/install/steps/AdminStep';
import { CompleteStep } from '@/components/install/steps/CompleteStep';

const INSTALL_STEPS = [
  { id: 1, title: '许可协议', component: LicenseStep },
  { id: 2, title: '环境检测', component: EnvironmentStep },
  { id: 3, title: '数据库设置', component: DatabaseStep },
  { id: 4, title: '缓存设置', component: CacheStep },
  { id: 5, title: '管理员设置', component: AdminStep },
  { id: 6, title: '安装完成', component: CompleteStep },
];

export default function InstallPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    license: false,
    database: {},
    cache: {},
    admin: {},
  });

  const nextStep = () => {
    if (currentStep < INSTALL_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (stepData: any) => {
    setFormData({ ...formData, ...stepData });
  };

  const CurrentStepComponent = INSTALL_STEPS[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">安装进度</CardTitle>
            <CardDescription>
              步骤 {currentStep} / {INSTALL_STEPS.length}: {INSTALL_STEPS[currentStep - 1].title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InstallProgress 
              steps={INSTALL_STEPS}
              currentStep={currentStep}
            />
          </CardContent>
        </Card>

        {/* Main Content Card */}
        <Card>
          <CardContent className="px-8 py-0">
            <CurrentStepComponent
              formData={formData}
              updateFormData={updateFormData}
              nextStep={nextStep}
              prevStep={prevStep}
              currentStep={currentStep}
              isLastStep={currentStep === INSTALL_STEPS.length}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 