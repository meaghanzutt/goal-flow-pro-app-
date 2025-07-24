import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { CheckCircle, Star, Trophy, Target, TrendingUp, Users, Zap } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
      },
    });

    if (result.error) {
      toast({
        title: "Payment Failed",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to Goal Flow Pro Premium!",
      });
      // Redirect to dashboard after successful payment
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    }

    setIsProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full brand-orange text-lg py-3" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : "Subscribe to Goal Flow Pro Premium"}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Add a small delay to ensure authentication is complete
    const timer = setTimeout(() => {
      apiRequest("POST", "/api/create-subscription")
        .then((res) => res.json())
        .then((data) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
            setLoading(false);
          } else {
            setError("Failed to initialize payment system");
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error creating subscription:", error);
          setError("Authentication required. Please sign in to continue.");
          setLoading(false);
        });
    }, 1000); // Wait 1 second for authentication

    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <Target className="text-blue-500" size={24} />,
      title: "Unlimited Goals",
      description: "Create and track unlimited personal and professional goals"
    },
    {
      icon: <TrendingUp className="text-green-500" size={24} />,
      title: "Advanced Analytics",
      description: "AI-powered insights and predictive goal completion analysis"
    },
    {
      icon: <Users className="text-purple-500" size={24} />,
      title: "Team Collaboration",
      description: "Share goals and collaborate with unlimited team members"
    },
    {
      icon: <Zap className="text-orange-500" size={24} />,
      title: "AI Task Generation",
      description: "Smart task breakdowns and personalized recommendations"
    },
    {
      icon: <Trophy className="text-yellow-500" size={24} />,
      title: "Advanced Reporting",
      description: "Detailed progress reports and achievement tracking"
    },
    {
      icon: <Star className="text-pink-500" size={24} />,
      title: "Priority Support",
      description: "Direct access to our goal achievement experts"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card className="text-center">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-x-4">
                <Button onClick={() => window.location.href = "/api/login"} className="brand-orange">
                  Sign In
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card className="text-center">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Subscription</h2>
              <p className="text-gray-600 mb-6">There was an issue setting up your subscription. Please try again later.</p>
              <Button onClick={() => window.location.reload()} className="brand-orange">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center header-with-backdrop bg-[#1f2836]">
          <h1 className="text-4xl font-bold text-white mb-4">
            Unlock Your Full Potential
          </h1>
          <p className="text-xl text-white mb-6">
            Join Goal Flow Pro Premium and transform your goal achievement journey
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Badge className="bg-green-500 text-white text-lg px-4 py-2 font-bold">
              $29/month
            </Badge>
            <span className="text-white line-through font-bold">$49/month</span>
            <Badge variant="outline" className="bg-white text-green-600 border-green-500 font-bold">
              40% OFF Launch Special
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Features */}
          <div>
            <Card className="shadow-xl bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-white">
                  Premium Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                      <p className="text-gray-300 text-sm font-medium">{feature.description}</p>
                    </div>
                    <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Guarantee */}
            <Card className="mt-6 bg-gradient-to-r from-green-800 to-emerald-800 border-green-600">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-white" size={24} />
                  </div>
                </div>
                <h3 className="font-bold text-white mb-2">30-Day Money-Back Guarantee</h3>
                <p className="text-green-100 text-sm font-medium">
                  Not satisfied? Get a full refund within 30 days, no questions asked.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card className="shadow-xl bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-white">
                  Complete Your Subscription
                </CardTitle>
                <p className="text-center text-gray-300 font-medium">
                  Start your premium journey today
                </p>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscribeForm />
                </Elements>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="mt-6 text-center bg-black/30 backdrop-blur-sm rounded-lg p-3">
              <p className="text-white text-sm font-bold">
                🔒 Secured by Stripe • Your payment information is encrypted and secure
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <Card className="shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-white">
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-bold text-white mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-300 font-medium">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">What happens to my data if I cancel?</h3>
                <p className="text-gray-300 font-medium">Your goals and progress data will be preserved. You can reactivate your subscription anytime to regain full access.</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">Is there a free trial?</h3>
                <p className="text-gray-300 font-medium">We offer a 14-day free trial for new users. No credit card required to start exploring Goal Flow Pro.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}