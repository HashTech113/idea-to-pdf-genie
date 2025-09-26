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
      <div className="w-full bg-muted rounded-full h-3">
        <div 
          className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
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
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                isCompleted
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : isActive
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md'
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