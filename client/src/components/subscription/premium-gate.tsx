import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { Link } from "wouter";

interface PremiumGateProps {
  children: React.ReactNode;
  featureName: string;
  description?: string;
}

export function PremiumGate({ children, featureName, description }: PremiumGateProps) {
  const { isPremium, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <Crown className="text-white" size={32} />
          </div>
        </div>
        <CardTitle className="text-xl text-gray-900 mb-2">
          <Lock className="inline-block mr-2" size={20} />
          Premium Feature: {featureName}
        </CardTitle>
        {description && (
          <p className="text-gray-600 text-sm">{description}</p>
        )}
      </CardHeader>
      <CardContent className="text-center">
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Unlock this feature and many more with Goal Flow Pro Premium
          </div>
          <Link href="/subscribe">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <Crown size={16} className="mr-2" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}