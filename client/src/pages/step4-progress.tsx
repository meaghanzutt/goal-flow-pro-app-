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
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { StepHeader } from "@/components/shared/step-header";
import { ProgressIndicator } from "@/components/shared/progress-indicator";
import { useWorkflow } from "@/hooks/use-workflow";
import { apiRequest } from "@/lib/queryClient";
import { DEMO_USER_ID, MOOD_OPTIONS, HABIT_FREQUENCIES } from "@/lib/constants";
import { insertProgressEntrySchema, insertHabitSchema, insertHabitEntrySchema } from "@shared/schema";
import type { Goal, ProgressEntry, Habit, HabitEntry, Category } from "@shared/schema";
import { 
  TrendingUp, 
  ArrowRight, 
  ArrowLeft, 
  Plus,
  Calendar,
  BarChart3,
  Target,
  Flame,
  CheckCircle,
  AlertCircle,
  Activity,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const progressEntrySchema = insertProgressEntrySchema.omit({ date: true }).extend({
  dateString: z.string().min(1, "Date is required"),
});

const habitFormSchema = insertHabitSchema.omit({
  userId: true,
});

type ProgressEntryForm = z.infer<typeof progressEntrySchema>;
type HabitForm = z.infer<typeof habitFormSchema>;

export default function Step4Progress() {
  const { currentStep, isStepUnlocked, goToStep, completeCurrentStep } = useWorkflow();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);

  const progressForm = useForm<ProgressEntryForm>({
    resolver: zodResolver(progressEntrySchema),
    defaultValues: {
      userId: user?.id || "",
      goalId: 0,
      dateString: new Date().toISOString().split('T')[0],
      progressPercent: 0,
      mood: undefined,
      notes: "",
      hoursWorked: undefined,
      tasksCompleted: 0,
    },
  });

  const habitForm = useForm<HabitForm>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      goalId: 0,
      name: "",
      frequency: "daily",
      target: 1,
      currentStreak: 0,
      longestStreak: 0,
      isActive: true,
    },
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    enabled: !!user?.id,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: progressEntries = [] } = useQuery<ProgressEntry[]>({
    queryKey: ["/api/users", user?.id, "progress"],
    enabled: !!user?.id,
  });

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/users", user?.id, "habits"],
    enabled: !!user?.id,
  });

  // Add debug logging for habits
  console.log("Step 4 - Habits data:", habits);
  console.log("Step 4 - Habits count:", habits.length);

  const createProgressEntryMutation = useMutation({
    mutationFn: async (entryData: ProgressEntryForm) => {
      console.log("Mutation function called with:", entryData);
      const { dateString, ...entry } = entryData;
      const date = new Date(dateString);
      const response = await apiRequest("POST", "/api/progress", { ...entry, date });
      return response.json();
    },
    onSuccess: () => {
      console.log("Progress entry mutation successful");
      // Invalidate all related queries to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "habits"] });
      toast({
        title: "Progress Logged!",
        description: "Your progress entry has been recorded.",
      });
      setShowProgressForm(false);
      progressForm.reset();
    },
    onError: (error) => {
      console.error("Progress entry mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to log progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createHabitMutation = useMutation({
    mutationFn: async (habitData: HabitForm) => {
      const response = await apiRequest("POST", "/api/habits", { ...habitData, userId: user?.id });
      return response.json();
    },
    onSuccess: (newHabit) => {
      console.log("Habit created successfully:", newHabit);
      // Invalidate all habit-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      
      // Force a refetch of habits data
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/users", user?.id, "habits"] });
      }, 100);
      toast({
        title: "Habit Created!",
        description: "Your new habit has been added.",
      });
      setShowHabitForm(false);
      habitForm.reset();
    },
  });

  const createHabitEntryMutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: number; completed: boolean }) => {
      console.log("Creating habit entry:", { habitId, completed });
      const entryData = {
        habitId,
        date: new Date().toISOString(),
        completed,
        value: completed ? 1 : 0,
      };
      console.log("Habit entry data being sent:", entryData);
      const response = await apiRequest("POST", "/api/habit-entries", entryData);
      return response.json();
    },
    onSuccess: (data, variables) => {
      console.log("Habit entry created successfully:", data);
      // Invalidate habits queries to update streaks
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: variables.completed ? "Habit Completed!" : "Habit Updated",
        description: variables.completed ? "Great job maintaining your habit!" : "Habit status updated.",
      });
    },
    onError: (error) => {
      console.error("Habit entry error:", error);
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogProgress = (goalId: number) => {
    console.log("handleLogProgress called with goalId:", goalId);
    setSelectedGoalId(goalId);
    progressForm.reset({
      userId: user?.id || "",
      goalId,
      dateString: new Date().toISOString().split('T')[0],
      progressPercent: 0,
      mood: undefined,
      notes: "",
      hoursWorked: undefined,
      tasksCompleted: 0,
    });
    setShowProgressForm(true);
    console.log("showProgressForm set to true");
  };

  const handleCreateHabit = (goalId: number) => {
    setSelectedGoalId(goalId);
    habitForm.reset({
      goalId,
      name: "",
      frequency: "daily",
      target: 1,
      currentStreak: 0,
      longestStreak: 0,
      isActive: true,
    });
    setShowHabitForm(true);
  };

  const onProgressSubmit = (data: ProgressEntryForm) => {
    console.log("onProgressSubmit called with data:", data);
    createProgressEntryMutation.mutate(data);
  };

  const onProgressError = (errors: any) => {
    console.log("Form validation errors:", errors);
  };

  const onHabitSubmit = (data: HabitForm) => {
    createHabitMutation.mutate(data);
  };

  const handleToggleHabit = (habitId: number, completed: boolean) => {
    createHabitEntryMutation.mutate({ habitId, completed });
  };

  // Calculate current streak helper function
  const calculateCurrentStreak = (entries: ProgressEntry[]): number => {
    if (entries.length === 0) return 0;
    
    const sortedEntries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate = entryDate;
      } else if (daysDiff > streak) {
        break;
      }
    }
    
    return streak;
  };

  // Calculate analytics - these will recalculate when data updates
  const totalEntries = progressEntries.length;
  const moodEntries = progressEntries.filter(e => e.mood !== null && e.mood !== undefined);
  const avgMood = moodEntries.length > 0 
    ? moodEntries.reduce((sum, e) => sum + (e.mood || 0), 0) / moodEntries.length
    : 0;
  const totalHoursWorked = progressEntries.reduce((sum, e) => sum + (e.hoursWorked || 0), 0);
  const currentStreak = calculateCurrentStreak(progressEntries);
  
  const progress = Math.min(Math.round((totalEntries / 15) * 100), 100);
  
  console.log("Step 4 - Analytics:", { totalEntries, avgMood, totalHoursWorked, currentStreak });

  // Remove debug logs for cleaner console
  // console.log("Step 4 - Goals loaded:", goals);
  // console.log("Step 4 - User:", user);

  if (!user?.id) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressIndicator 
          currentStep={currentStep} 
          isStepUnlocked={isStepUnlocked}
          onStepClick={goToStep}
        />

        <Card className="shadow-lg overflow-hidden">
          <StepHeader
            stepNumber={4}
            title="Track Progress"
            description="Monitor your journey with detailed analytics"
            progress={progress}
          />

          <CardContent className="p-6">
            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
                <TabsTrigger value="habits">Habit Monitoring</TabsTrigger>
                <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="progress" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-6 h-6 step-gradient-4 rounded mr-2 flex items-center justify-center">
                      <TrendingUp className="text-white" size={16} />
                    </div>
                    Daily Progress Logging
                  </h3>
                  {!showProgressForm && (
                    <Button onClick={() => setShowProgressForm(true)} className="brand-orange">
                      <Plus className="mr-2" size={16} />
                      Log Progress
                    </Button>
                  )}
                </div>

                {showProgressForm ? (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle>Log Your Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...progressForm}>
                        <form onSubmit={progressForm.handleSubmit(onProgressSubmit, onProgressError)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={progressForm.control}
                              name="goalId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Goal</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
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
                              control={progressForm.control}
                              name="dateString"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={progressForm.control}
                            name="progressPercent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Progress Percentage: {field.value}%</FormLabel>
                                <FormControl>
                                  <Slider
                                    value={[field.value]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    max={100}
                                    step={5}
                                    className="py-4"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={progressForm.control}
                              name="mood"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Mood (1-10)</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Rate your mood" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {MOOD_OPTIONS.map((mood) => (
                                        <SelectItem key={mood.value} value={mood.value.toString()}>
                                          {mood.emoji} {mood.value}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={progressForm.control}
                              name="hoursWorked"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Hours Worked</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="Hours..."
                                      value={field.value?.toString() || ""}
                                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={progressForm.control}
                              name="tasksCompleted"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tasks Completed</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="Tasks..."
                                      value={field.value?.toString() || ""}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={progressForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes & Reflections</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="How did today go? Any insights or challenges?" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-between pt-4">
                            <Button type="button" onClick={() => setShowProgressForm(false)} variant="outline">
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createProgressEntryMutation.isPending} 
                              className="brand-orange"
                              onClick={() => console.log("Submit button clicked!")}
                            >
                              Log Progress
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {goals.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600 mb-4">No goals available for progress tracking.</p>
                        <Button onClick={() => goToStep(2)} variant="outline">
                          Create Goals First
                        </Button>
                      </div>
                    ) : (
                      goals.map((goal) => {
                        const category = categories.find(cat => cat.id === goal.categoryId);
                        const goalProgress = progressEntries.filter(entry => entry.goalId === goal.id);
                        const latestEntry = goalProgress[goalProgress.length - 1];
                        
                        return (
                          <Card key={goal.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 flex items-center">
                                    <Target className="mr-2 text-brand-orange" size={20} />
                                    {goal.title}
                                  </h4>
                                  {category && (
                                    <Badge variant="outline" className="mt-1">{category.name}</Badge>
                                  )}
                                </div>
                                <Button onClick={() => handleLogProgress(goal.id)} size="sm" className="brand-orange">
                                  Log Progress
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>Overall Progress</span>
                                  <span>{goal.progress}%</span>
                                </div>
                                <Progress value={goal.progress} className="h-2" />
                                
                                {latestEntry && (
                                  <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                                    <span>Last update: {new Date(latestEntry.date).toLocaleDateString()}</span>
                                    {latestEntry.mood && (
                                      <span>Mood: {MOOD_OPTIONS.find(m => m.value === latestEntry.mood)?.emoji} {latestEntry.mood}/10</span>
                                    )}
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

              <TabsContent value="habits" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Flame className="mr-2 text-brand-orange" />
                    Habit Monitoring
                  </h3>
                  {!showHabitForm && (
                    <Button onClick={() => setShowHabitForm(true)} className="brand-orange">
                      <Plus className="mr-2" size={16} />
                      Create Habit
                    </Button>
                  )}
                </div>

                {showHabitForm ? (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle>Create New Habit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...habitForm}>
                        <form onSubmit={habitForm.handleSubmit(onHabitSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={habitForm.control}
                              name="goalId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Associated Goal</FormLabel>
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
                              control={habitForm.control}
                              name="frequency"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Frequency</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select frequency" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {HABIT_FREQUENCIES.map((freq) => (
                                        <SelectItem key={freq.value} value={freq.value}>
                                          {freq.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={habitForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Habit Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Exercise for 30 minutes" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={habitForm.control}
                            name="target"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Daily Target</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Target amount per day"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-between pt-4">
                            <Button type="button" onClick={() => setShowHabitForm(false)} variant="outline">
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createHabitMutation.isPending} className="brand-orange">
                              Create Habit
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {habits.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Flame className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600">No habits created yet. Build habits that support your goals!</p>
                      </div>
                    ) : (
                      habits.map((habit) => {
                        const goal = goals.find(g => g.id === habit.goalId);
                        
                        return (
                          <Card key={habit.id} className="border-l-4 border-l-orange-400">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 flex items-center">
                                    <Flame className="mr-2 text-orange-500" size={20} />
                                    {habit.name}
                                  </h4>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                    <span className="capitalize">{habit.frequency}</span>
                                    <span>Target: {habit.target}</span>
                                    {goal && <Badge variant="outline">{goal.title}</Badge>}
                                  </div>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <span className="text-sm text-gray-600">
                                      🔥 Current streak: {habit.currentStreak} days
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      🏆 Best streak: {habit.longestStreak} days
                                    </span>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => handleToggleHabit(habit.id, true)}
                                    size="sm"
                                    className="bg-green-500 hover:bg-green-600"
                                    disabled={createHabitEntryMutation.isPending}
                                  >
                                    <CheckCircle className="mr-1" size={16} />
                                    {createHabitEntryMutation.isPending ? "Saving..." : "Done"}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="mr-2 text-brand-orange" />
                  Analytics & Insights
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Entries</p>
                          <p className="text-2xl font-bold text-brand-orange">{totalEntries}</p>
                        </div>
                        <Activity className="text-brand-orange" size={24} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Average Mood</p>
                          <p className="text-2xl font-bold text-green-600">
                            {avgMood > 0 ? avgMood.toFixed(1) : "N/A"}
                          </p>
                        </div>
                        <span className="text-2xl">
                          {avgMood > 0 ? MOOD_OPTIONS.find(m => Math.round(m.value) === Math.round(avgMood))?.emoji : "😐"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Hours Worked</p>
                          <p className="text-2xl font-bold text-blue-600">{totalHoursWorked}h</p>
                        </div>
                        <Clock className="text-blue-600" size={24} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Current Streak</p>
                          <p className="text-2xl font-bold text-orange-600">{currentStreak}</p>
                        </div>
                        <Flame className="text-orange-600" size={24} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Progress Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {progressEntries.length === 0 ? (
                      <div className="text-center py-8">
                        <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600">No progress entries yet. Start logging your progress!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {progressEntries.slice(-5).reverse().map((entry) => {
                          const goal = goals.find(g => g.id === entry.goalId);
                          return (
                            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{goal?.title}</div>
                                <div className="text-sm text-gray-600">
                                  {new Date(entry.date).toLocaleDateString()} • {entry.progressPercent}% progress
                                </div>
                                {entry.notes && (
                                  <div className="text-sm text-gray-500 mt-1">{entry.notes}</div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {entry.mood && (
                                  <span className="text-lg">
                                    {MOOD_OPTIONS.find(m => m.value === entry.mood)?.emoji}
                                  </span>
                                )}
                                <Badge variant="outline">{entry.progressPercent}%</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button onClick={() => goToStep(3)} variant="outline">
                <ArrowLeft className="mr-2" size={16} />
                Previous Step
              </Button>
              <Button 
                onClick={completeCurrentStep}
                disabled={progressEntries.length === 0 && habits.length === 0}
                className="brand-orange"
              >
                Continue to Collaboration
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
