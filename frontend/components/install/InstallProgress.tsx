import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Step {
  id: number;
  title: string;
}

interface InstallProgressProps {
  steps: Step[];
  currentStep: number;
}

export function InstallProgress({ steps, currentStep }: InstallProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-6 left-12 right-12 h-px bg-border z-0">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ 
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` 
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              {/* Step circle */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center bg-background transition-all duration-300 shadow-sm",
                  {
                    "border-primary bg-primary text-primary-foreground": isCompleted,
                    "border-primary bg-background text-primary": isCurrent,
                    "border-muted-foreground/30 bg-background text-muted-foreground": isUpcoming,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">
                    {step.id}
                  </span>
                )}
              </div>

              {/* Step title */}
              <div className="mt-3 text-center max-w-20">
                <Badge 
                  variant={isCompleted || isCurrent ? "default" : "secondary"}
                  className={cn(
                    "text-xs px-2 py-1",
                    {
                      "bg-primary text-primary-foreground": isCompleted || isCurrent,
                      "bg-muted text-muted-foreground": isUpcoming,
                    }
                  )}
                >
                  {step.title}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 