import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { ProgressIndicator } from "@/components/shared/progress-indicator";
import { useWorkflow } from "@/hooks/use-workflow";
import { WORKFLOW_STEPS, DEMO_USER_ID } from "@/lib/constants";
import type { Goal, Achievement, ProgressEntry } from "@shared/schema";
import { 
  Target, 
  TrendingUp, 
  Award, 
  Calendar,
  ArrowRight,
  Trophy,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function Dashboard() {
  const { currentStep, isStepUnlocked, goToStep, user } = useWorkflow();

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/users", DEMO_USER_ID, "goals"],
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/users", DEMO_USER_ID, "achievements"],
  });

  const { data: progressEntries = [] } = useQuery<ProgressEntry[]>({
    queryKey: ["/api/users", DEMO_USER_ID, "progress"],
  });

  const activeGoals = goals.filter(goal => goal.status === "active");
  const completedGoals = goals.filter(goal => goal.status === "completed");
  const currentStreak = 7; // Calculate from progress entries
  const successRate = completedGoals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="glass-card-dark mx-4 my-8 py-8 sm:py-16">
        <div className="container-mobile mobile-padding text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Everything You Need to Succeed
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-6 sm:mb-8 max-w-3xl mx-auto mobile-readable">
            Powerful features designed to turn your aspirations into achievements, backed by science and built for real results.
          </p>
          <Link href={`/step/${currentStep}`}>
            <Button size="lg" variant="secondary" className="font-semibold mobile-button touch-target">
              Continue Your Journey
            </Button>
          </Link>
        </div>
      </section>

      {/* Progress Overview */}
      <section className="py-8 sm:py-16">
        <div className="container-mobile mobile-padding">
          <div className="glass-card-dark text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">How Goal Flow Pro Works</h2>
            <p className="text-base sm:text-lg text-gray-700 max-w-3xl mx-auto mobile-readable">
              Our comprehensive 6-step process guides you from initial ideas to achieved goals, with AI assistance and collaboration tools every step of the way.
            </p>
          </div>

          <ProgressIndicator 
            currentStep={currentStep} 
            isStepUnlocked={isStepUnlocked}
            onStepClick={goToStep}
          />

          {/* Process Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {WORKFLOW_STEPS.map((step) => {
              const isActive = step.id === currentStep;
              const isUnlocked = isStepUnlocked(step.id);
              const isCompleted = step.id < currentStep;

              return (
                <Card key={step.id} className={`step-card ${isActive ? 'active' : 'inactive'}`}>
                  <CardContent className="p-6">
                    <div className={`step-number ${isActive ? 'active' : 'inactive'}`}>
                      {isCompleted ? <CheckCircle2 size={20} /> : step.id}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    {isUnlocked ? (
                      <Link href={step.path}>
                        <Button 
                          variant={isActive ? "default" : "outline"} 
                          size="sm"
                          className={isActive ? "brand-orange" : ""}
                        >
                          {isCompleted ? "Review Step" : isActive ? "Continue" : "Start Step"}
                          <ArrowRight className="ml-2" size={16} />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        Complete Step {step.id - 1} First
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Achievement Dashboard */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Achievement Dashboard</h2>
            <p className="text-lg text-gray-600">Track your progress across all goals with detailed analytics and motivational insights</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Current Goals */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 text-brand-orange" size={24} />
                    Active Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeGoals.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600 mb-4">No active goals yet</p>
                      <Link href="/step/2">
                        <Button>Create Your First Goal</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeGoals.map((goal) => (
                        <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{goal.title}</h4>
                            <Badge variant="secondary">{goal.priority}</Badge>
                          </div>
                          <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{goal.progress}%</span>
                            </div>
                            <Progress value={goal.progress} className="h-2" />
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span className="flex items-center">
                              <Calendar className="mr-1" size={14} />
                              Due: {new Date(goal.deadline).toLocaleDateString()}
                            </span>
                            <Link href={`/goals/${goal.id}`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stats & Achievements */}
            <div className="space-y-6">
              {/* Stats Card */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 text-brand-orange" size={24} />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Goals Completed</span>
                      <span className="text-2xl font-bold text-green-600">{completedGoals.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Current Streak</span>
                      <span className="text-2xl font-bold text-brand-orange">{currentStreak} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Success Rate</span>
                      <span className="text-2xl font-bold text-blue-600">{successRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Achievements */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="mr-2 text-brand-orange" size={24} />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {achievements.length === 0 ? (
                    <div className="text-center py-4">
                      <Trophy className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-gray-600 text-sm">Complete goals to unlock achievements</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {achievements.slice(0, 3).map((achievement) => (
                        <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center">
                            <Trophy size={16} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{achievement.title}</div>
                            <div className="text-sm text-gray-600">{achievement.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
