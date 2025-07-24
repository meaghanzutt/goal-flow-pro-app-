import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, Dumbbell, Target, Clock, Calendar, Trash2, Edit, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { type FitnessPlan } from "@shared/schema";

interface FitnessFormData {
  name: string;
  description: string;
  fitnessLevel: string;
  duration: number;
  workoutsPerWeek: number;
  nutritionGuidelines: string;
  goalId?: number;
}

export function FitnessPlanner() {
  const [selectedPlan, setSelectedPlan] = useState<FitnessPlan | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<FitnessFormData>({
    name: "",
    description: "",
    fitnessLevel: "beginner",
    duration: 12,
    workoutsPerWeek: 3,
    nutritionGuidelines: ""
  });
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fitnessPlans = [], isLoading } = useQuery<FitnessPlan[]>({
    queryKey: ['/api/fitness-plans'],
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: FitnessFormData) => {
      const response = await fetch('/api/fitness-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create fitness plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fitness-plans'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Success", description: "Fitness plan created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create fitness plan", variant: "destructive" });
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/fitness-plans/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete fitness plan');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fitness-plans'] });
      setSelectedPlan(null);
      toast({ title: "Success", description: "Fitness plan deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete fitness plan", variant: "destructive" });
    }
  });

  const generateAIRecommendations = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/fitness-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fitnessLevel: formData.fitnessLevel,
          goals: [formData.name],
          timeAvailable: 45
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI recommendations error:', errorText);
        throw new Error('Failed to generate recommendations');
      }
      const data = await response.json();
      console.log('AI recommendations received:', data);
      setAiRecommendations(data);
    } catch (error) {
      console.error('AI recommendations error:', error);
      toast({ title: "Error", description: "Failed to generate AI recommendations", variant: "destructive" });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      fitnessLevel: "beginner",
      duration: 12,
      workoutsPerWeek: 3,
      nutritionGuidelines: ""
    });
    setAiRecommendations(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Plan name is required", variant: "destructive" });
      return;
    }

    const planData = {
      ...formData,
      exercises: aiRecommendations?.workoutPlan || []
    };

    createPlanMutation.mutate(planData);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Dumbbell className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fitness Planner</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Dumbbell className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fitness Planner</h2>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Fitness Plan</DialogTitle>
              <DialogDescription>
                Design a personalized fitness plan with AI-powered recommendations.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Weight Loss Journey"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fitnessLevel">Fitness Level</Label>
                  <Select value={formData.fitnessLevel} onValueChange={(value) => setFormData({ ...formData, fitnessLevel: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (weeks)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="52"
                  />
                </div>
                <div>
                  <Label htmlFor="workoutsPerWeek">Workouts per Week</Label>
                  <Input
                    id="workoutsPerWeek"
                    type="number"
                    value={formData.workoutsPerWeek}
                    onChange={(e) => setFormData({ ...formData, workoutsPerWeek: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="7"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your fitness goals..."
                />
              </div>

              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateAIRecommendations}
                  disabled={isGeneratingAI}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGeneratingAI ? "Generating..." : "Get AI Recommendations"}
                </Button>
              </div>

              {aiRecommendations && (
                <div className="space-y-4 border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">AI Recommendations</h4>
                  <Tabs defaultValue="workout">
                    <TabsList>
                      <TabsTrigger value="workout">Workout Plan</TabsTrigger>
                      <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                    </TabsList>
                    <TabsContent value="workout" className="space-y-2">
                      {aiRecommendations.workoutPlan?.map((day: any, index: number) => (
                        <Card key={index} className="p-3">
                          <div className="font-medium">{day.day} - {day.focus}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {day.exercises?.map((ex: any, i: number) => (
                              <div key={i}>{ex.name} - {ex.sets ? `${ex.sets} sets of ${ex.reps}` : ex.duration}</div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </TabsContent>
                    <TabsContent value="nutrition" className="space-y-2">
                      {aiRecommendations.nutritionTips?.map((tip: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Target className="w-4 h-4 mt-1 text-green-600" />
                          <span className="text-sm">{tip}</span>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                  <div>
                    <Label htmlFor="nutritionGuidelines">Additional Nutrition Notes</Label>
                    <Textarea
                      id="nutritionGuidelines"
                      value={formData.nutritionGuidelines}
                      onChange={(e) => setFormData({ ...formData, nutritionGuidelines: e.target.value })}
                      placeholder="Add personal nutrition preferences..."
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPlanMutation.isPending}
                >
                  {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fitnessPlans.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No fitness plans yet</h3>
              <p className="text-gray-500 dark:text-gray-500 text-center mb-4">
                Create your first fitness plan to start your journey toward better health.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          fitnessPlans.map((plan: FitnessPlan) => (
            <Card key={plan.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedPlan(plan)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="mt-1 text-gray-700 dark:text-gray-300 font-medium">{plan.description}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlanMutation.mutate(plan.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">
                    <Target className="w-3 h-3 mr-1" />
                    {plan.fitnessLevel}
                  </Badge>
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    {plan.duration} weeks
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {plan.workoutsPerWeek}x/week
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>Week 1 of {plan.duration}</span>
                  </div>
                  <Progress value={8} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedPlan && (
        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{selectedPlan.name}</DialogTitle>
              <DialogDescription>{selectedPlan.description}</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="workouts">
              <TabsList>
                <TabsTrigger value="workouts">Workouts</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>
              <TabsContent value="workouts" className="space-y-4">
                {selectedPlan.exercises && Array.isArray(selectedPlan.exercises) && selectedPlan.exercises.length > 0 ? (
                  selectedPlan.exercises.map((workout: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{workout.day || `Workout ${index + 1}`}</CardTitle>
                        <CardDescription>{workout.focus}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {workout.exercises?.map((exercise: any, i: number) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <span className="font-medium">{exercise.name}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {exercise.sets ? `${exercise.sets} sets of ${exercise.reps}` : exercise.duration}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No workout details available for this plan.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="nutrition">
                <Card>
                  <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap">{selectedPlan.nutritionGuidelines || "No nutrition guidelines provided."}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="progress">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Overall Progress</span>
                          <span>Week 1 of {selectedPlan.duration}</span>
                        </div>
                        <Progress value={8} className="h-3" />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">1</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Weeks Completed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{selectedPlan.workoutsPerWeek}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Workouts/Week</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{(selectedPlan.duration || 0) - 1}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Weeks Remaining</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}