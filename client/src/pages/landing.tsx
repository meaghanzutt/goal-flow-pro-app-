import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Target, Users, Trophy, TrendingUp, Heart } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Target,
      title: "SMART Goals",
      description: "Create specific, measurable, achievable, relevant, and time-bound goals"
    },
    {
      icon: CheckCircle,
      title: "Task Management",
      description: "Break down your goals into actionable tasks and track progress"
    },
    {
      icon: TrendingUp,
      title: "Progress Analytics",
      description: "Visualize your journey with detailed progress tracking and insights"
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Share goals with friends, family, or team members for accountability"
    },
    {
      icon: Heart,
      title: "Habit Tracking",
      description: "Build positive habits that support your long-term goals"
    },
    {
      icon: Trophy,
      title: "Achievements",
      description: "Celebrate milestones and unlock achievements as you progress"
    }
  ];

  const steps = [
    "Brainstorm Ideas",
    "Create SMART Goals", 
    "Break Into Tasks",
    "Track Progress",
    "Collaborate & Share",
    "Achieve & Review"
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-0 sticky top-0 z-50 m-4 mb-0">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 step-gradient-1 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-black">
              Goal Flow Pro
            </h1>
          </div>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            size="lg"
            className="step-gradient-2 text-white border-0 hover:scale-105 transition-all duration-300 shadow-lg font-bold"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="glass-card-dark p-12 mb-12">
          <Badge className="mb-6 step-gradient-3 text-[#fcfbfa] border-0 px-8 py-4 text-shadow-medium font-bold text-lg">
            Transform Your Dreams Into Reality
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white text-shadow-strong">
            Achieve Your Goals with
            <br />
            <span className="text-white text-shadow-strong">Confidence & Clarity</span>
          </h2>
          <p className="text-xl text-white mb-8 max-w-3xl mx-auto leading-relaxed text-shadow-medium">
            Goal Flow Pro guides you through a proven 6-step process to turn your ideas into achievements. 
            Set SMART goals, track progress, collaborate with others, and celebrate your success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = "/api/login"}
              className="step-gradient-1 text-white border-0 text-lg px-8 py-6 hover:scale-105 transition-all duration-300 shadow-xl font-bold text-shadow-medium"
            >
              Start Your Journey
            </Button>
          </div>
        </div>
      </section>

      {/* 6-Step Process */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4 text-white text-shadow-strong">Our Proven 6-Step Process</h3>
          <p className="text-white max-w-2xl mx-auto text-shadow-medium">
            Follow our structured approach to turn any idea into a successful achievement
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="glass-card-dark text-center p-6">
              <div className={`w-16 h-16 step-gradient-${index + 1} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                <span className="text-white font-bold text-xl">{index + 1}</span>
              </div>
              <h4 className="text-lg font-bold text-white text-shadow-medium">{step}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4 text-white text-shadow-strong">Everything You Need to Succeed</h3>
          <p className="text-white max-w-2xl mx-auto text-shadow-medium">
            Powerful features designed to keep you motivated and on track toward your goals
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="glass-card-dark hover:scale-105 transition-all duration-300 p-6">
              <feature.icon className="w-12 h-12 text-white mb-4 mx-auto" />
              <h4 className="font-bold text-white mb-2 text-shadow-medium">{feature.title}</h4>
              <p className="text-white/90 text-sm text-shadow-medium">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass-card-dark p-12 text-center">
          <h3 className="text-4xl font-bold mb-6 text-white text-shadow-strong">Ready to Transform Your Life?</h3>
          <p className="text-xl mb-8 text-white max-w-2xl mx-auto text-shadow-medium">
            Join thousands of people who have achieved their dreams with Goal Flow Pro. 
            Your journey to success starts with a single step.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            className="step-gradient-5 text-white border-0 text-lg px-8 py-6 hover:scale-105 transition-all duration-300 shadow-xl font-bold text-shadow-medium"
          >
            Begin Your Transformation
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-card-dark border-0 mx-4 mb-4 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 step-gradient-6 rounded-lg flex items-center justify-center shadow-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white text-shadow-medium">Goal Flow Pro</span>
          </div>
          <p className="text-white/90 text-shadow-medium">
            Transform your dreams into achievements, one goal at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}