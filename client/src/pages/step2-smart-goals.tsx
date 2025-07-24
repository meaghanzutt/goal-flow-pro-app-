import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Header } from "@/components/layout/header";
import { StepHeader } from "@/components/shared/step-header";
import { ProgressIndicator } from "@/components/shared/progress-indicator";
import { useWorkflow } from "@/hooks/use-workflow";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { PRIORITIES } from "@/lib/constants";
import { insertGoalSchema } from "@shared/schema";
import type { Category, Idea, Goal } from "@shared/schema";
import { 
  Target, 
  ArrowRight, 
  ArrowLeft, 
  Plus,
  Calendar,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const smartGoalSchema = insertGoalSchema.extend({
  deadlineString: z.string().min(1, "Deadline is required"),
}).refine((data) => {
  console.log("Form validation data:", data);
  return true; // Allow all data for now to debug
}, {
  message: "Form validation debug",
});

type SmartGoalForm = z.infer<typeof smartGoalSchema>;

export default function Step2SmartGoals() {
  const { currentStep, isStepUnlocked, goToStep, completeCurrentStep } = useWorkflow();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [showForm, setShowForm] = useState(false);

  const form = useForm<SmartGoalForm>({
    resolver: zodResolver(smartGoalSchema),
    defaultValues: {
      userId: user?.id || "",
      ideaId: undefined,
      title: "",
      description: "",
      categoryId: 0,
      priority: "medium",
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timebound: "",
      deadline: new Date(), // Add actual deadline field
      deadlineString: "",
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: ideas = [] } = useQuery<Idea[]>({
    queryKey: ["/api/ideas"],
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: SmartGoalForm) => {
      console.log("Creating goal with data:", goalData);
      const { deadlineString, deadline: formDeadline, ...goal } = goalData;
      
      // Convert deadlineString to proper Date object
      let deadline: Date;
      if (deadlineString) {
        deadline = new Date(deadlineString);
      } else if (formDeadline) {
        deadline = new Date(formDeadline);
      } else {
        deadline = new Date(); // fallback to current date
      }
      
      const payload = { ...goal, deadline };
      console.log("API payload:", payload);
      console.log("Deadline type:", typeof payload.deadline);
      console.log("Deadline value:", payload.deadline);
      
      const response = await apiRequest("POST", "/api/goals", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "SMART Goal Created!",
        description: "Your goal has been created successfully.",
      });
      setShowForm(false);
      form.reset();
      setSelectedIdea(null);
    },
  });

  if (!user?.id) {
    return <div>Please log in to access this page.</div>;
  }

  const promotedIdeas = ideas.filter(idea => idea.isPromoted);
  const progress = Math.min(Math.round((goals.length / 3) * 100), 100);
  
  console.log("All ideas:", ideas);
  console.log("Promoted ideas:", promotedIdeas);
  console.log("Goals:", goals);

  const handleSelectIdea = (idea: Idea) => {
    console.log("Selecting idea:", idea);
    setSelectedIdea(idea);
    const category = categories.find(cat => cat.id === idea.categoryId);
    const formData = {
      userId: user?.id || "",
      ideaId: idea.id,
      title: idea.text,
      description: "",
      categoryId: idea.categoryId,
      priority: "medium" as const,
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timebound: "",
      deadline: new Date(), // Add actual deadline field
      deadlineString: "",
    };
    console.log("Form data being set:", formData);
    form.reset(formData);
    setShowForm(true);
  };

  const handleCreateFromScratch = () => {
    setSelectedIdea(null);
    form.reset({
      userId: user?.id || "",
      ideaId: undefined,
      title: "",
      description: "",
      categoryId: categories[0]?.id || 0,
      priority: "medium",
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timebound: "",
      deadline: new Date(), // Add actual deadline field
      deadlineString: "",
    });
    setShowForm(true);
  };

  const onSubmit = (data: SmartGoalForm) => {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form data:", data);
    console.log("Form errors:", form.formState.errors);
    
    createGoalMutation.mutate(data, {
      onError: (error) => {
        console.error("Goal creation error:", error);
        toast({
          title: "Error Creating Goal",
          description: "Please check all required fields and try again.",
          variant: "destructive",
        });
      }
    });
  };

  const smartCriteria = [
    {
      key: "specific",
      title: "Specific",
      description: "What exactly do you want to achieve?",
      placeholder: "Clearly define what you want to accomplish..."
    },
    {
      key: "measurable",
      title: "Measurable", 
      description: "How will you measure progress?",
      placeholder: "Define metrics to track your progress..."
    },
    {
      key: "achievable",
      title: "Achievable",
      description: "Is this goal realistic given your resources?",
      placeholder: "Explain how this goal is attainable..."
    },
    {
      key: "relevant",
      title: "Relevant",
      description: "Why is this goal important to you?",
      placeholder: "Describe why this goal matters..."
    },
    {
      key: "timebound",
      title: "Time-bound",
      description: "When will you achieve this goal?",
      placeholder: "Set a clear timeline for completion..."
    },
  ];

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
            stepNumber={2}
            title="Create SMART Goals"
            description="Transform your best ideas into structured goals"
            progress={progress}
          />

          <CardContent className="p-6">
            {!showForm ? (
              <>
                {/* Goal Selection */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <div className="w-6 h-6 step-gradient-2 rounded mr-2 flex items-center justify-center">
                      <Target className="text-white" size={16} />
                    </div>
                    Select Ideas to Transform into Goals
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Found {promotedIdeas.length} promoted ideas ready to become SMART goals.
                  </p>
                  
                  {promotedIdeas.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600 mb-4">No promoted ideas available. Complete Step 1 first!</p>
                      <Button onClick={() => goToStep(1)} variant="outline">
                        Go to Step 1
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-6">
                      {promotedIdeas.map((idea) => {
                        const category = categories.find(cat => cat.id === idea.categoryId);
                        return (
                          <div key={idea.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-3 flex-1">
                              <CheckCircle className="text-green-500" size={20} />
                              <span className="text-gray-800 flex-1">{idea.text}</span>
                              {category && (
                                <Badge variant="secondary" className="text-xs">
                                  {category.name}
                                </Badge>
                              )}
                            </div>
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("=== CREATE GOAL BUTTON CLICKED ===");
                                console.log("Button clicked for idea:", idea);
                                handleSelectIdea(idea);
                              }}
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 text-white ml-4"
                              type="button"
                            >
                              Create Goal
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="text-center">
                    <Button onClick={handleCreateFromScratch} variant="outline" className="mb-4">
                      <Plus className="mr-2" size={16} />
                      Create Goal from Scratch
                    </Button>
                  </div>
                </div>

                {/* Existing Goals */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your SMART Goals</h3>
                  {goals.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Target className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600">No goals created yet. Transform an idea into your first SMART goal!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {goals.map((goal) => {
                        const category = categories.find(cat => cat.id === goal.categoryId);
                        return (
                          <Card key={goal.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={goal.priority === "high" ? "destructive" : goal.priority === "medium" ? "default" : "secondary"}>
                                    {goal.priority}
                                  </Badge>
                                  {category && (
                                    <Badge variant="outline">{category.name}</Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-gray-600 text-sm mb-2">{goal.description}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="mr-1" size={14} />
                                Due: {new Date(goal.deadline).toLocaleDateString()}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* SMART Goal Form */
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {selectedIdea ? `Create Goal from: "${selectedIdea.text}"` : "Create New SMART Goal"}
                    </h3>
                  </div>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goal Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter goal title..." {...field} />
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deadlineString"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deadline</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
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
                          <Textarea placeholder="Provide a detailed description of your goal..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* SMART Criteria */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">SMART Criteria</h4>
                    {smartCriteria.map((criteria) => (
                      <FormField
                        key={criteria.key}
                        control={form.control}
                        name={criteria.key as keyof SmartGoalForm}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-brand-orange font-semibold">
                              {criteria.title}
                            </FormLabel>
                            <p className="text-sm text-gray-600 mb-2">{criteria.description}</p>
                            <FormControl>
                              <Textarea 
                                placeholder={criteria.placeholder} 
                                value={field.value as string || ""} 
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between pt-6 border-t border-gray-200">
                    <Button type="button" onClick={() => setShowForm(false)} variant="outline">
                      <ArrowLeft className="mr-2" size={16} />
                      Back to Ideas
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createGoalMutation.isPending}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={(e) => {
                        console.log("=== CREATE SMART GOAL BUTTON CLICKED ===");
                        console.log("Button clicked, form should submit");
                        console.log("Form valid:", form.formState.isValid);
                        console.log("Form errors:", form.formState.errors);
                        console.log("Form values:", form.getValues());
                        // Let the form handle the submit naturally
                      }}
                    >
                      {createGoalMutation.isPending ? "Creating..." : "Create SMART Goal"}
                      <CheckCircle className="ml-2" size={16} />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {!showForm && (
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <Button onClick={() => goToStep(1)} variant="outline">
                  <ArrowLeft className="mr-2" size={16} />
                  Previous Step
                </Button>
                <Button 
                  onClick={completeCurrentStep}
                  disabled={goals.length === 0}
                  className="brand-orange"
                >
                  Continue to Tasks
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
