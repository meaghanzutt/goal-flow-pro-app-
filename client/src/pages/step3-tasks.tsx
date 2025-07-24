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
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Header } from "@/components/layout/header";
import { StepHeader } from "@/components/shared/step-header";
import { ProgressIndicator } from "@/components/shared/progress-indicator";
import { useWorkflow } from "@/hooks/use-workflow";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { insertTaskSchema } from "@shared/schema";
import type { Goal, Task, Category } from "@shared/schema";
import { 
  CheckSquare, 
  ArrowRight, 
  ArrowLeft, 
  Plus,
  Calendar,
  Clock,
  Target,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";
import { EisenhowerMatrix } from "@/components/EisenhowerMatrix";
import { useToast } from "@/hooks/use-toast";

const taskFormSchema = insertTaskSchema.extend({
  deadlineString: z.string().optional(),
});

type TaskForm = z.infer<typeof taskFormSchema>;

interface SuggestedTask {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  urgency: "urgent" | "not_urgent";
  importance: "important" | "not_important";
  estimatedHours: number;
}

export default function Step3Tasks() {
  const { currentStep, isStepUnlocked, goToStep, completeCurrentStep } = useWorkflow();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());
  const [showAISuggestions, setShowAISuggestions] = useState<Record<number, boolean>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<number, SuggestedTask[]>>({});
  const [loadingAI, setLoadingAI] = useState<Record<number, boolean>>({});

  const form = useForm<TaskForm>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      goalId: 0,
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      deadlineString: "",
      estimatedHours: undefined,
      actualHours: undefined,
      dependencies: [],
    },
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    enabled: !!user?.id,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Get all tasks for the user
  const { data: allUserTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: !!user?.id,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskForm) => {
      const { deadlineString, ...task } = taskData;
      const deadline = deadlineString ? new Date(deadlineString) : null;
      const payload = { ...task, deadline };
      const response = await apiRequest("POST", "/api/tasks", payload);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all tasks
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task Created!",
        description: "Your task has been added to the goal.",
      });
      setShowForm(false);
      form.reset();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Task> }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all tasks
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      // Invalidate all tasks
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task Deleted",
        description: "The task has been removed.",
      });
    },
  });

  const handleCreateTask = (goalId: number) => {
    setSelectedGoalId(goalId);
    form.reset({
      goalId,
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      deadlineString: "",
      estimatedHours: undefined,
      actualHours: undefined,
      dependencies: [],
    });
    setShowForm(true);
  };

  const fetchAISuggestions = async (goalId: number) => {
    setLoadingAI(prev => ({ ...prev, [goalId]: true }));
    try {
      const response = await apiRequest("POST", `/api/goals/${goalId}/ai-tasks`);
      const data = await response.json();
      setAiSuggestions(prev => ({ ...prev, [goalId]: data }));
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI task suggestions.",
        variant: "destructive",
      });
    } finally {
      setLoadingAI(prev => ({ ...prev, [goalId]: false }));
    }
  };

  const toggleAISuggestions = (goalId: number) => {
    const isCurrentlyShowing = showAISuggestions[goalId];
    setShowAISuggestions(prev => ({ ...prev, [goalId]: !isCurrentlyShowing }));
    
    // Fetch suggestions if not already loaded and we're showing them
    if (!isCurrentlyShowing && !aiSuggestions[goalId]) {
      fetchAISuggestions(goalId);
    }
  };

  const addTaskFromSuggestion = (suggestion: SuggestedTask, goalId: number) => {
    const taskData: TaskForm = {
      goalId,
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      status: "pending",
      estimatedHours: suggestion.estimatedHours,
      actualHours: undefined,
      dependencies: [],
      deadlineString: "",
    };

    createTaskMutation.mutate(taskData);
  };

  const onSubmit = (data: TaskForm) => {
    createTaskMutation.mutate(data);
  };

  const handleToggleTaskStatus = (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    updateTaskMutation.mutate({
      id: taskId,
      updates: { status: newStatus }
    });
  };

  const toggleGoalExpansion = (goalId: number) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  // Calculate total tasks across all goals
  const allTasks = allUserTasks;

  const progress = Math.min(Math.round((allTasks.length / 10) * 100), 100);

  console.log("Step 3 - Goals loaded:", goals);
  console.log("Step 3 - User:", user);
  console.log("Step 3 - All user tasks:", allUserTasks);
  console.log("Step 3 - Tasks query loading:", allUserTasks);

  if (!user?.id) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressIndicator 
          currentStep={currentStep} 
          isStepUnlocked={isStepUnlocked}
          onStepClick={goToStep}
        />

        <Card className="shadow-lg overflow-hidden">
          <StepHeader
            stepNumber={3}
            title="Break Into Tasks"
            description="Divide each goal into actionable tasks"
            progress={progress}
          />

          <CardContent className="p-6">
            {!showForm ? (
              <>
                {goals.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 mb-4">No goals available. Create SMART goals first!</p>
                    <Button onClick={() => goToStep(2)} variant="outline">
                      Go to Step 2
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-6 h-6 step-gradient-3 rounded mr-2 flex items-center justify-center">
                        <CheckSquare className="text-white" size={16} />
                      </div>
                      Break Down Your Goals into Tasks
                    </h3>

                    {goals.map((goal) => {
                      const category = categories.find(cat => cat.id === goal.categoryId);
                      const goalTasks = allUserTasks.filter(task => task.goalId === goal.id);
                      const isExpanded = expandedGoals.has(goal.id);
                      const completedTasks = goalTasks.filter(task => task.status === "completed").length;
                      const totalTasks = goalTasks.length;
                      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                      return (
                        <Card key={goal.id} className="border-l-4 border-l-primary">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg flex items-center">
                                  <Target className="mr-2 text-brand-orange" size={20} />
                                  {goal.title}
                                </CardTitle>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge variant={goal.priority === "high" ? "destructive" : goal.priority === "medium" ? "default" : "secondary"}>
                                    {goal.priority}
                                  </Badge>
                                  {category && (
                                    <Badge variant="outline">{category.name}</Badge>
                                  )}
                                  <span className="text-sm text-gray-500">
                                    {completedTasks}/{totalTasks} tasks completed
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  onClick={() => toggleAISuggestions(goal.id)}
                                  size="sm"
                                  variant="outline"
                                  className="border-brand-orange text-brand-orange hover:bg-orange-50"
                                >
                                  <Sparkles size={16} className="mr-1" />
                                  AI Suggestions
                                </Button>
                                <Button
                                  onClick={() => handleCreateTask(goal.id)}
                                  size="sm"
                                  className="brand-orange"
                                >
                                  <Plus size={16} className="mr-1" />
                                  Add Task
                                </Button>
                                <Button
                                  onClick={() => toggleGoalExpansion(goal.id)}
                                  variant="ghost"
                                  size="sm"
                                >
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </Button>
                              </div>
                            </div>
                            {totalTasks > 0 && (
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="brand-orange h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${completionRate}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </CardHeader>
                          
                          {/* AI Suggestions Section */}
                          {showAISuggestions[goal.id] && (
                            <CardContent className="border-t">
                              <EisenhowerMatrix
                                tasks={aiSuggestions[goal.id] || []}
                                onAddTask={(task) => addTaskFromSuggestion(task, goal.id)}
                                loading={loadingAI[goal.id]}
                              />
                            </CardContent>
                          )}
                          
                          {(isExpanded || goalTasks.length > 0) && (
                            <CardContent>
                              {goalTasks.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-lg">
                                  <CheckSquare className="mx-auto text-gray-400 mb-2" size={32} />
                                  <p className="text-gray-600 text-sm">No tasks created yet</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {goalTasks.map((task) => (
                                    <div key={task.id} className={`p-3 rounded-lg border transition-all ${
                                      task.status === "completed" 
                                        ? "bg-green-50 border-green-200" 
                                        : task.status === "in_progress"
                                        ? "bg-blue-50 border-blue-200"
                                        : "bg-gray-50 border-gray-200"
                                    }`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                          <Checkbox
                                            checked={task.status === "completed"}
                                            onCheckedChange={() => handleToggleTaskStatus(task.id, task.status)}
                                          />
                                          <div className="flex-1">
                                            <div className={`font-medium ${
                                              task.status === "completed" ? "text-gray-500 line-through" : "text-gray-900"
                                            }`}>
                                              {task.title}
                                            </div>
                                            {task.description && (
                                              <div className="text-sm text-gray-600 mt-1">
                                                {task.description}
                                              </div>
                                            )}
                                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                              <Badge 
                                                variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}
                                                className="text-xs"
                                              >
                                                {task.priority}
                                              </Badge>
                                              <Badge variant="outline" className="text-xs">
                                                {TASK_STATUSES.find(s => s.value === task.status)?.label}
                                              </Badge>
                                              {task.deadline && (
                                                <span className="flex items-center">
                                                  <Calendar className="mr-1" size={12} />
                                                  {new Date(task.deadline).toLocaleDateString()}
                                                </span>
                                              )}
                                              {task.estimatedHours && (
                                                <span className="flex items-center">
                                                  <Clock className="mr-1" size={12} />
                                                  {task.estimatedHours}h est.
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() => deleteTaskMutation.mutate(task.id)}
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700 ml-2"
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* Task Creation Form */
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Create New Task
                    </h3>
                    <p className="text-gray-600">
                      Adding task to: {goals.find(g => g.id === selectedGoalId)?.title}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter task title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRIORITIES.map((priority) => (
                                <SelectItem key={priority.value} value={priority.value}>
                                  {priority.label}
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
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe what needs to be done..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deadlineString"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deadline (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Hours</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Hours needed..."
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between pt-6 border-t border-gray-200">
                    <Button type="button" onClick={() => setShowForm(false)} variant="outline">
                      <ArrowLeft className="mr-2" size={16} />
                      Back to Goals
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTaskMutation.isPending}
                      className="brand-orange"
                    >
                      Create Task
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {!showForm && (
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <Button onClick={() => goToStep(2)} variant="outline">
                  <ArrowLeft className="mr-2" size={16} />
                  Previous Step
                </Button>
                <Button 
                  onClick={completeCurrentStep}
                  disabled={allTasks.length === 0}
                  className="brand-orange"
                >
                  Continue to Progress Tracking
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
