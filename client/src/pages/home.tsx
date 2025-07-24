import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Trophy, Heart, Users, CheckCircle, Settings } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();

  const motivationalQuotes = [
    "Your goals are the roadmap to your dreams.",
    "Progress, not perfection, is the key to success.",
    "Every small step forward counts.",
    "Believe in yourself and all that you are.",
    "Success is the sum of small efforts repeated daily."
  ];

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  const stepInfo = [
    { title: "Brainstorm Ideas", description: "Capture and organize your thoughts", icon: Target },
    { title: "Create SMART Goals", description: "Transform ideas into actionable goals", icon: CheckCircle },
    { title: "Break Into Tasks", description: "Define clear steps to achieve your goals", icon: TrendingUp },
    { title: "Track Progress", description: "Monitor your journey and stay motivated", icon: Heart },
    { title: "Collaborate & Share", description: "Get support from your network", icon: Users },
    { title: "Achieve & Review", description: "Celebrate success and learn from the journey", icon: Trophy }
  ];

  const currentStep = user?.currentStep || 1;
  const completedSteps = currentStep - 1;
  const progressPercentage = (completedSteps / 6) * 100;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="glass-card border-0 sticky top-0 z-50 m-2 sm:m-4 mb-0 safe-area-top">
        <div className="container-mobile mobile-padding py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 step-gradient-1 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-medium text-black">
              <span className="hidden sm:inline">Goal Flow Pro</span>
              <span className="sm:hidden">GFP</span>
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 text-[#171616]">
            {user?.profileImageUrl && (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white/30 shadow-lg"
              />
            )}
            <span className="text-xs sm:text-sm text-gray-700 font-medium hidden sm:inline">
              Welcome, {user?.firstName || user?.email || "there"}!
            </span>
            <Button 
              variant="outline"
              size="sm"
              className="border-gray-300 hover:bg-gray-100 text-gray-700 bg-white/80 text-xs sm:text-sm touch-target"
              onClick={() => window.location.href = "/api/logout"}
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="container-mobile mobile-padding py-4 sm:py-8 safe-area-bottom">
        {/* Welcome Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="glass-card-dark mobile-card mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-4xl font-medium mb-3 sm:mb-4 text-black">
              Your Goal Achievement Journey
            </h2>
            <p className="text-base sm:text-xl text-gray-700 mb-4 sm:mb-6 italic mobile-readable">
              "{randomQuote}"
            </p>
            
            {/* Progress Overview */}
            <div className="glass-card-dark max-w-full sm:max-w-md mx-auto border border-white/20">
              <div className="mobile-card">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Your Progress</h3>
                <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">Step {currentStep} of 6</p>
                <Progress value={progressPercentage} className="mb-3 sm:mb-4 h-2 sm:h-3" />
                <p className="text-xs sm:text-sm text-gray-600">
                  {completedSteps} steps completed • {6 - completedSteps} remaining
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Step Highlight */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-xl sm:text-2xl font-medium text-center mb-4 sm:mb-6 text-black">Continue Your Journey</h3>
          <div className="glass-card-dark max-w-full sm:max-w-2xl mx-auto border-2 border-white/20">
            <div className="mobile-card">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                {stepInfo[currentStep - 1] && (
                  <>
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 step-gradient-${currentStep} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0`}>
                      {stepInfo[currentStep - 1].icon && 
                        React.createElement(stepInfo[currentStep - 1].icon, {
                          className: "w-6 h-6 sm:w-8 sm:h-8 text-white"
                        })
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg sm:text-2xl font-medium text-black">{stepInfo[currentStep - 1].title}</h4>
                      <p className="text-gray-700 text-sm sm:text-lg mobile-readable">{stepInfo[currentStep - 1].description}</p>
                    </div>
                  </>
                )}
              </div>
              <Link href={`/step/${currentStep}`}>
                <Button 
                  size="lg" 
                  className={`w-full step-gradient-${currentStep} hover:scale-105 transition-all duration-300 text-white font-bold py-3 sm:py-4 text-base sm:text-lg shadow-lg text-shadow-medium touch-target`}
                >
                  {currentStep === 1 ? "Start Your Journey" : "Continue"}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* All Steps Overview */}
        <div>
          <h3 className="text-xl sm:text-2xl font-medium text-center mb-6 sm:mb-8 text-black">The Goal Flow Process</h3>
          <div className="mobile-grid">
            {stepInfo.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              const isLocked = stepNumber > currentStep;

              return (
                <div 
                  key={index} 
                  className="glass-card-dark mobile-card hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl shadow-lg step-gradient-${stepNumber} text-white`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <span className="font-bold text-sm sm:text-lg">{stepNumber}</span>
                      )}
                    </div>
                    {isCompleted && <Badge className="bg-emerald-500 text-white border-0 text-xs" style={{color: 'white !important'}}>✓ Done</Badge>}
                    {isCurrent && <Badge className="bg-amber-500 text-white border-0 text-xs">→ Active</Badge>}
                    {isLocked && <Badge variant="outline" className="border-gray-300 text-gray-500 bg-gray-100 text-xs">🔒 Locked</Badge>}
                  </div>
                  <h4 className="text-base sm:text-lg font-medium text-black mb-2">
                    Step {stepNumber}: {step.title}
                  </h4>
                  <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base mobile-readable">{step.description}</p>
                  {!isLocked ? (
                    <Link href={`/step/${stepNumber}`}>
                      <Button 
                        size="sm"
                        className={`step-gradient-${stepNumber} text-white border-0 hover:scale-105 transition-all duration-300 shadow-lg w-full text-shadow-medium font-bold touch-target text-sm sm:text-base`}
                      >
                        {isCompleted ? "Review" : isCurrent ? "Continue" : "Start"}
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled className="border-gray-300 text-gray-500 w-full bg-gray-100 touch-target text-sm sm:text-base">
                      Complete previous steps first
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 sm:mt-12 text-center">
          <h3 className="text-xl font-semibold mb-6 text-white text-shadow-strong">Quick Access</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                className="border-white/30 hover:bg-white/20 backdrop-blur-sm shadow-lg text-[#000000] bg-[#ffffff66] font-bold"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/integrations">
              <Button 
                variant="outline" 
                className="border-white/30 hover:bg-white/20 backdrop-blur-sm shadow-lg text-[#000000] bg-[#ffffff66] font-bold"
              >
                <Settings className="w-4 h-4 mr-2" />
                Integrations
              </Button>
            </Link>
            <Link href={`/step/${currentStep}`}>
              <Button className={`step-gradient-${currentStep} text-white border-0 shadow-lg hover:scale-105 transition-all duration-300 text-shadow-medium font-bold`}>
                Continue Journey
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}