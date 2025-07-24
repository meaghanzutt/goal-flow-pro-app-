import { useQuery } from "@tanstack/react-query";

export interface SubscriptionStatus {
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'cancel_at_period_end';
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

export function useSubscription() {
  const { data: subscription, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription-status"],
    retry: false,
  });

  return {
    subscription,
    isLoading,
    isPremium: subscription?.status === 'active',
    isFree: !subscription || subscription.status === 'free',
  };
}