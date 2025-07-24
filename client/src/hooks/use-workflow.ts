import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./useAuth";

export function useWorkflow() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const updateStepMutation = useMutation({
    mutationFn: async (step: number) => {
      return apiRequest("PATCH", `/api/auth/step`, { step });
    },
    onSuccess: (data, step) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Navigate to the new step
      setLocation(`/step/${step}`);
    },
  });

  const currentStep = user?.currentStep || 1;
  const isStepUnlocked = (step: number) => step <= currentStep;
  
  const goToNextStep = () => {
    if (currentStep < 6) {
      updateStepMutation.mutate(currentStep + 1);
    }
  };

  const goToStep = (step: number) => {
    if (isStepUnlocked(step)) {
      updateStepMutation.mutate(step);
    }
  };

  const completeCurrentStep = () => {
    if (currentStep < 6) {
      const nextStep = currentStep + 1;
      updateStepMutation.mutate(nextStep);
    }
  };

  return {
    currentStep,
    isStepUnlocked,
    goToNextStep,
    goToStep,
    completeCurrentStep,
    isLoading: !isAuthenticated || updateStepMutation.isPending,
    user,
  };
}