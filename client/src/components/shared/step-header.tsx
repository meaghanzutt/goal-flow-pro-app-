interface StepHeaderProps {
  stepNumber: number;
  title: string;
  description: string;
  progress: number;
}

export function StepHeader({ stepNumber, title, description, progress }: StepHeaderProps) {
  return (
    <div className={`step-gradient-${stepNumber} p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-shadow-medium">Step {stepNumber}: {title}</h2>
          <p className="text-white/90 text-shadow-light">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-sm opacity-75 text-shadow-light">Progress</div>
          <div className="text-2xl font-bold text-shadow-medium">{progress}%</div>
        </div>
      </div>
    </div>
  );
}
