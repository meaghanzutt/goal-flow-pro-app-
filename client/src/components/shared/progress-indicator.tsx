interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  isStepUnlocked: (step: number) => boolean;
  onStepClick?: (step: number) => void;
}

export function ProgressIndicator({ 
  currentStep, 
  totalSteps = 6, 
  isStepUnlocked, 
  onStepClick 
}: ProgressIndicatorProps) {
  return (
    <div className="mb-12">
      <div className="flex justify-center">
        <div className="flex items-center space-x-4 bg-gray-100 rounded-full p-2">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isUnlocked = isStepUnlocked(stepNumber);
            const isCompleted = stepNumber < currentStep;

            return (
              <div key={stepNumber} className="flex items-center">
                <button
                  onClick={() => onStepClick?.(stepNumber)}
                  disabled={!isUnlocked}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    isActive
                      ? "brand-orange text-white"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : isUnlocked
                      ? "bg-gray-300 text-gray-600 hover:bg-gray-400"
                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  {isCompleted ? "✓" : stepNumber}
                </button>
                {stepNumber < totalSteps && (
                  <div className={`hidden sm:block w-16 h-1 mx-2 ${
                    stepNumber < currentStep ? "brand-orange-light" : "bg-gray-300"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
