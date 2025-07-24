import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { StepHeader } from "@/components/shared/step-header";
import { ProgressIndicator } from "@/components/shared/progress-indicator";
import { MLInsightsDashboard } from "@/components/MLInsightsDashboard";
import { useWorkflow } from "@/hooks/use-workflow";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { insertAchievementSchema, insertReviewSchema } from "@shared/schema";
import type { Goal, Achievement, Review, Category } from "@shared/schema";
import { 
  Trophy, 
  ArrowRight, 
  ArrowLeft, 
  Plus,
  Star,
  Award,
  CheckCircle,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  PartyPopper,
  Medal,
  Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const reviewSchema = insertReviewSchema.extend({
  rating: z.number().min(1).max(5),
});

type ReviewForm = z.infer<typeof reviewSchema>;

const achievementTypes = [
  { value: "goal_completed", label: "Goal Completed", icon: Target, color: "text-green-600" },
  { value: "streak", label: "Consistency Streak", icon: Award, color: "text-orange-600" },
  { value: "milestone", label: "Milestone Reached", icon: Medal, color: "text-blue-600" },
  { value: "habit_master", label: "Habit Master", icon: Crown, color: "text-purple-600" },
];

// Mock achievements for demonstration
const mockAchievements = [
  {
    id: 1,
    userId: "44129367",
    type: "goal_completed",
    title: "Goal Crusher",
    description: "Completed your first goal",
    icon: "fas fa-trophy",
    unlockedAt: new Date("2024-01-20"),
  },
  {
    id: 2,
    userId: "44129367",
    type: "streak",
    title: "7-Day Warrior",
    description: "Maintained a 7-day progress streak",
    icon: "fas fa-fire",
    unlockedAt: new Date("2024-01-25"),
  },
  {
    id: 3,
    userId: "44129367",
    type: "milestone",
    title: "Progress Pioneer",
    description: "Logged progress 10 times",
    icon: "fas fa-chart-line",
    unlockedAt: new Date("2024-01-28"),
  },
];

export default function Step6Achieve() {
  const { currentStep, isStepUnlocked, goToStep, completeCurrentStep } = useWorkflow();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const reviewForm = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      userId: user?.id || "",
      goalId: 0,
      quarter: `Q1-${new Date().getFullYear()}`,
      rating: 5,
      whatWorked: "",
      whatDidntWork: "",
      keyLearnings: "",
      improvements: "",
    },
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    enabled: !!user?.id,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
    enabled: !!user?.id,
  });

  // Use mock achievements for demonstration
  const achievements = mockAchievements;

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: ReviewForm) => {
      const response = await apiRequest("POST", "/api/reviews", reviewData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({
        title: "Review Completed!",
        description: "Your quarterly review has been saved.",
      });
      setShowReviewForm(false);
      reviewForm.reset();
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Goal> }) => {
      const response = await apiRequest("PATCH", `/api/goals/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    },
  });

  const handleCompleteGoal = (goalId: number) => {
    updateGoalMutation.mutate({
      id: goalId,
      updates: { status: "completed", progress: 100 }
    });
    
    toast({
      title: "🎉 Goal Completed!",
      description: "Congratulations on achieving your goal!",
    });
  };

  const handleCreateReview = (goalId: number) => {
    setSelectedGoalId(goalId);
    const goal = goals.find(g => g.id === goalId);
    reviewForm.reset({
      userId: DEMO_USER_ID,
      goalId,
      quarter: `Q1-${new Date().getFullYear()}`,
      rating: 5,
      whatWorked: "",
      whatDidntWork: "",
      keyLearnings: "",
      improvements: "",
    });
    setShowReviewForm(true);
  };

  const onReviewSubmit = (data: ReviewForm) => {
    createReviewMutation.mutate(data);
  };

  const completedGoals = goals.filter(goal => goal.status === "completed");
  const activeGoals = goals.filter(goal => goal.status === "active");
  const successRate = goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0;

  const progress = Math.min(Math.round(((completedGoals.length + reviews.length) / 5) * 100), 100);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Celebration Modal */}
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md mx-4"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <PartyPopper className="mx-auto text-yellow-500 mb-4" size={64} />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2 text-shadow-strong">🎉 Congratulations! 🎉</h2>
            <p className="text-gray-600 mb-4">You've completed another goal! Keep up the amazing work!</p>
            <Button onClick={() => setShowCelebration(false)} className="brand-orange">
              Continue Your Journey
            </Button>
          </motion.div>
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressIndicator 
          currentStep={currentStep} 
          isStepUnlocked={isStepUnlocked}
          onStepClick={goToStep}
        />

        <Card className="shadow-lg overflow-hidden">
          <StepHeader
            stepNumber={6}
            title="Achieve & Review"
            description="Celebrate achievements and conduct reviews"
            progress={progress}
          />

          <CardContent className="p-6">
            <Tabs defaultValue="achievements" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="goals">My Goals</TabsTrigger>
                <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
                <TabsTrigger value="review">Quarterly Review</TabsTrigger>
              </TabsList>

              <TabsContent value="achievements" className="space-y-6">
                <div className="text-center mb-8 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 rounded-xl p-6 border-2 border-yellow-400/50">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">🏆 HALL OF ACHIEVEMENTS 🏆</h3>
                  <p className="text-lg font-bold text-gray-800">Your Journey to Success - Every Victory Counts!</p>
                  <p className="text-sm font-semibold text-gray-700 mt-2">Track your progress, celebrate your wins, and unlock new milestones</p>
                </div>

                {/* Achievement Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="bg-gradient-to-br from-green-400 to-green-600 border-green-400 shadow-lg transform hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center text-white">
                      <CheckCircle className="mx-auto mb-3 drop-shadow-lg" size={40} />
                      <div className="text-3xl font-bold mb-1">{completedGoals.length}</div>
                      <div className="text-sm font-semibold uppercase tracking-wide">GOALS CRUSHED</div>
                      <div className="text-xs mt-1 opacity-90">Keep the momentum going!</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-400 to-red-500 border-orange-400 shadow-lg transform hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center text-white">
                      <Trophy className="mx-auto mb-3 drop-shadow-lg" size={40} />
                      <div className="text-3xl font-bold mb-1">{achievements.length}</div>
                      <div className="text-sm font-semibold uppercase tracking-wide">BADGES EARNED</div>
                      <div className="text-xs mt-1 opacity-90">You're on fire!</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-400 to-purple-600 border-blue-400 shadow-lg transform hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center text-white">
                      <TrendingUp className="mx-auto mb-3 drop-shadow-lg" size={40} />
                      <div className="text-3xl font-bold mb-1">{successRate}%</div>
                      <div className="text-sm font-semibold uppercase tracking-wide">SUCCESS RATE</div>
                      <div className="text-xs mt-1 opacity-90">Exceptional performance!</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Active Goals */}
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-3 border-2 border-orange-300">
                    <Target className="mr-3 text-orange-600" size={24} />
                    🎯 FINISH STRONG - Complete Your Active Goals
                  </h4>
                  
                  {activeGoals.length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl border-2 border-green-300 shadow-inner">
                      <PartyPopper className="mx-auto text-green-600 mb-4 animate-bounce" size={56} />
                      <h5 className="text-xl font-bold text-green-800 mb-2">🎉 CONGRATULATIONS! 🎉</h5>
                      <p className="text-green-700 font-semibold">All goals completed! You're unstoppable!</p>
                      <p className="text-green-600 text-sm mt-2">Ready to set new challenges and reach even greater heights?</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeGoals.map((goal) => {
                        const category = categories.find(cat => cat.id === goal.categoryId);
                        
                        return (
                          <Card key={goal.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900">{goal.title}</h5>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {category && (
                                      <Badge variant="outline" className="text-gray-700 border-gray-400 bg-white">{category.name}</Badge>
                                    )}
                                    <Badge variant="secondary" className="text-gray-700 bg-gray-200">{goal.priority}</Badge>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => handleCreateReview(goal.id)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    Review
                                  </Button>
                                  <Button
                                    onClick={() => handleCompleteGoal(goal.id)}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={goal.progress < 90}
                                  >
                                    <CheckCircle className="mr-1" size={16} />
                                    Complete
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm font-semibold text-gray-800">
                                  <span>Progress</span>
                                  <span>{goal.progress}%</span>
                                </div>
                                <Progress value={goal.progress} className="h-2" />
                                <div className="text-sm font-medium text-gray-700">
                                  Due: {new Date(goal.deadline).toLocaleDateString()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Achievement Gallery */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3 border-2 border-purple-300">
                    <Award className="mr-3 text-purple-600" size={24} />
                    🏅 YOUR TROPHY COLLECTION - Achievements Unlocked
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => {
                      const achievementType = achievementTypes.find(type => type.value === achievement.type);
                      const IconComponent = achievementType?.icon || Trophy;
                      
                      return (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.05, rotate: 1 }}
                          className="bg-gradient-to-br from-yellow-200 to-orange-200 border-2 border-yellow-400 rounded-xl p-5 shadow-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-300">
                              <IconComponent className="text-white drop-shadow-md" size={28} />
                            </div>
                            <div className="flex-1">
                              <h5 className="text-lg font-bold text-gray-900 mb-1">🎖️ {achievement.title}</h5>
                              <p className="text-sm font-bold text-gray-800">{achievement.description}</p>
                              <p className="text-xs text-gray-700 mt-2 font-semibold">
                                🗓️ Earned: {achievement.unlockedAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="goals" className="space-y-6">
                <div className="text-center mb-8 bg-gradient-to-r from-blue-400/30 to-indigo-400/30 rounded-xl p-6 border-2 border-blue-400/50">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">🎯 MY GOALS OVERVIEW 🎯</h3>
                  <p className="text-lg font-bold text-gray-800">Track All Your Goals in One Place</p>
                  <p className="text-sm font-semibold text-gray-700 mt-2">Monitor progress, deadlines, and completion status</p>
                </div>

                {/* Goals Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Active Goals */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-3 border-2 border-green-300">
                      <Target className="mr-3 text-green-600" size={24} />
                      🚀 ACTIVE GOALS ({activeGoals.length})
                    </h4>
                    <div className="space-y-3">
                      {activeGoals.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border">
                          <Target className="mx-auto text-gray-400 mb-4" size={48} />
                          <p className="text-gray-600 font-semibold">No active goals yet!</p>
                          <p className="text-gray-500 text-sm mt-2">Create some goals to get started on your journey.</p>
                        </div>
                      ) : (
                        activeGoals.map((goal) => {
                          const category = categories.find(cat => cat.id === goal.categoryId);
                          return (
                            <Card key={goal.id} className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 text-lg">{goal.title}</h5>
                                    <div className="flex items-center space-x-2 mt-1">
                                      {category && (
                                        <Badge variant="outline" className="text-gray-700 border-gray-400 bg-white">{category.name}</Badge>
                                      )}
                                      <Badge variant="secondary" className="text-gray-700 bg-gray-200">{goal.priority}</Badge>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-green-600">{goal.progress}%</div>
                                    <div className="text-xs text-gray-500">Progress</div>
                                  </div>
                                </div>
                                <Progress value={goal.progress} className="h-3 mb-2" />
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium text-gray-700">Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                                  <span className="font-medium text-gray-600">{goal.timeframe}</span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Completed Goals */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-3 border-2 border-yellow-300">
                      <CheckCircle className="mr-3 text-yellow-600" size={24} />
                      ✅ COMPLETED GOALS ({completedGoals.length})
                    </h4>
                    <div className="space-y-3">
                      {completedGoals.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border">
                          <CheckCircle className="mx-auto text-gray-400 mb-4" size={48} />
                          <p className="text-gray-600 font-semibold">No completed goals yet!</p>
                          <p className="text-gray-500 text-sm mt-2">Complete your first goal to celebrate here.</p>
                        </div>
                      ) : (
                        completedGoals.map((goal) => {
                          const category = categories.find(cat => cat.id === goal.categoryId);
                          return (
                            <Card key={goal.id} className="border-l-4 border-l-yellow-500 bg-yellow-50/50 hover:shadow-lg transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 text-lg">{goal.title}</h5>
                                    <div className="flex items-center space-x-2 mt-1">
                                      {category && (
                                        <Badge variant="outline" className="text-gray-700 border-gray-400 bg-white">{category.name}</Badge>
                                      )}
                                      <Badge className="bg-green-500 text-white">COMPLETED</Badge>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <CheckCircle className="text-green-600 mb-1" size={32} />
                                    <div className="text-xs text-gray-500">100% Done</div>
                                  </div>
                                </div>
                                <div className="text-sm font-medium text-gray-600">
                                  Completed: {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : 'Recently'}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <MLInsightsDashboard />
              </TabsContent>

              <TabsContent value="review" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-6 h-6 step-gradient-6 rounded mr-2 flex items-center justify-center">
                      <Calendar className="text-white" size={16} />
                    </div>
                    Quarterly Review Process
                  </h3>
                  {!showReviewForm && (
                    <Button onClick={() => setShowReviewForm(true)} className="brand-orange">
                      <Plus className="mr-2" size={16} />
                      Start New Review
                    </Button>
                  )}
                </div>

                {showReviewForm ? (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle>Quarterly Goal Review</CardTitle>
                      <p className="text-gray-600">Reflect on your progress and plan improvements</p>
                    </CardHeader>
                    <CardContent>
                      <Form {...reviewForm}>
                        <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={reviewForm.control}
                              name="goalId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Goal to Review</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select goal" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {goals.map((goal) => (
                                        <SelectItem key={goal.id} value={goal.id.toString()}>
                                          {goal.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={reviewForm.control}
                              name="rating"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Overall Rating (1-5)</FormLabel>
                                  <div className="flex space-x-1 pt-2">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                      <button
                                        key={rating}
                                        type="button"
                                        onClick={() => field.onChange(rating)}
                                        className={`p-1 ${
                                          field.value >= rating
                                            ? "text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      >
                                        <Star size={24} fill="currentColor" />
                                      </button>
                                    ))}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={reviewForm.control}
                              name="whatWorked"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center text-green-700">
                                    <CheckCircle className="mr-1" size={16} />
                                    What Worked Well
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="List strategies and approaches that were successful..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={reviewForm.control}
                              name="whatDidntWork"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center text-red-700">
                                    <AlertTriangle className="mr-1" size={16} />
                                    What Didn't Work
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Identify challenges and obstacles you faced..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={reviewForm.control}
                              name="keyLearnings"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center text-blue-700">
                                    <Lightbulb className="mr-1" size={16} />
                                    Key Learnings
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="What insights did you gain from this experience?" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={reviewForm.control}
                              name="improvements"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center text-purple-700">
                                    <TrendingUp className="mr-1" size={16} />
                                    Future Improvements
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="How will you approach similar goals differently?" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-between pt-6 border-t border-gray-200">
                            <Button type="button" onClick={() => setShowReviewForm(false)} variant="outline">
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createReviewMutation.isPending} className="brand-orange">
                              Save Review
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600">No reviews completed yet. Start your first quarterly review!</p>
                      </div>
                    ) : (
                      reviews.map((review) => {
                        const goal = goals.find(g => g.id === review.goalId);
                        return (
                          <Card key={review.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-white text-shadow-medium">{goal?.title}</h4>
                                <div className="flex items-center space-x-2">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        size={16}
                                        className={
                                          star <= review.rating
                                            ? "text-yellow-400 fill-current"
                                            : "text-gray-300"
                                        }
                                      />
                                    ))}
                                  </div>
                                  <Badge variant="outline">{review.quarter}</Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {review.whatWorked && (
                                  <div>
                                    <div className="font-medium text-green-700 mb-1">What Worked</div>
                                    <div className="text-gray-600">{review.whatWorked}</div>
                                  </div>
                                )}
                                {review.keyLearnings && (
                                  <div>
                                    <div className="font-medium text-blue-700 mb-1">Key Learnings</div>
                                    <div className="text-gray-600">{review.keyLearnings}</div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="insights" className="space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center text-shadow-medium">
                  <Lightbulb className="mr-2 text-brand-orange" />
                  Success Pattern Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Goal Completion Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Goals Set</span>
                          <span className="font-semibold">{goals.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Goals Completed</span>
                          <span className="font-semibold text-green-600">{completedGoals.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Success Rate</span>
                          <span className="font-semibold text-brand-orange">{successRate}%</span>
                        </div>
                        <Progress value={successRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="text-green-600 mt-1" size={16} />
                          <div className="text-sm">
                            <div className="font-medium">Keep Setting SMART Goals</div>
                            <div className="text-gray-600">Your structured approach is working well</div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <TrendingUp className="text-blue-600 mt-1" size={16} />
                          <div className="text-sm">
                            <div className="font-medium">Regular Progress Tracking</div>
                            <div className="text-gray-600">Continue logging progress consistently</div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Award className="text-orange-600 mt-1" size={16} />
                          <div className="text-sm">
                            <div className="font-medium">Celebrate Small Wins</div>
                            <div className="text-gray-600">Acknowledge progress along the way</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Success Journey Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">🎯</div>
                      <h3 className="text-2xl font-bold text-white mb-2 text-shadow-strong">Congratulations on Your Journey!</h3>
                      <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                        You've successfully completed the Goal Flow Pro 6-step process. You now have the tools and 
                        knowledge to turn any dream into reality. Keep setting goals, tracking progress, and celebrating achievements!
                      </p>
                      <div className="flex justify-center space-x-4">
                        <Button onClick={() => goToStep(1)} variant="outline">
                          Start New Goals
                        </Button>
                        <Button onClick={() => goToStep(1)} className="brand-orange">
                          Begin Again
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button onClick={() => goToStep(5)} variant="outline">
                <ArrowLeft className="mr-2" size={16} />
                Previous Step
              </Button>
              <Button 
                onClick={() => goToStep(1)}
                className="brand-orange"
              >
                Start New Journey
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
