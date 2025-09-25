interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Step {currentStep} of {totalSteps}
        </h2>
        <div className="text-sm text-muted-foreground">
          {Math.round(progress)}% Complete
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-between mt-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <div
              key={stepNumber}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                isCompleted
                  ? 'bg-primary text-primary-foreground'
                  : isActive
                  ? 'bg-accent text-accent-foreground ring-2 ring-accent/50'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {stepNumber}
            </div>
          );
        })}
      </div>
    </div>
  );
};