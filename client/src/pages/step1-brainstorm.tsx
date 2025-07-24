import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { StepHeader } from "@/components/shared/step-header";
import { ProgressIndicator } from "@/components/shared/progress-indicator";
import { useWorkflow } from "@/hooks/use-workflow";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { insertIdeaSchema } from "@shared/schema";
import type { Category, Idea } from "@shared/schema";
import { 
  Lightbulb, 
  Plus, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle, 
  Briefcase, 
  Heart, 
  DollarSign, 
  User,
  GraduationCap,
  Users,
  Plane,
  Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categoryIcons = {
  "fas fa-briefcase": Briefcase,
  "fas fa-heart": Heart,
  "fas fa-dollar-sign": DollarSign,
  "fas fa-user": User,
  "fas fa-graduation-cap": GraduationCap,
  "fas fa-users": Users,
  "fas fa-plane": Plane,
  "fas fa-palette": Palette,
};

const aiSuggestions: Record<string, string[]> = {
  "Career & Education": [
    "Get promoted to senior management within 18 months",
    "Learn a new programming language and build 3 projects",
    "Start a side business generating $5,000/month",
    "Complete professional certification in my field",
    "Build a network of 50+ industry professionals"
  ],
  "Health & Fitness": [
    "Lose 20 pounds and maintain it for 6 months",
    "Run a half marathon within 12 months",
    "Establish a daily meditation practice",
    "Cook healthy meals at home 5 days a week",
    "Get 8 hours of sleep consistently for 30 days"
  ],
  "Finance": [
    "Save $10,000 for emergency fund",
    "Invest 15% of income in retirement accounts",
    "Pay off all credit card debt within 2 years",
    "Create 3 different income streams",
    "Track expenses and create a monthly budget"
  ],
  "Personal Development": [
    "Read 24 books in one year",
    "Learn to speak Spanish conversationally",
    "Practice guitar for 30 minutes daily",
    "Write in a journal every day for 3 months",
    "Learn a new hobby and practice weekly"
  ],
  "Relationships": [
    "Schedule weekly quality time with family",
    "Join a social club or group to meet new people",
    "Improve communication skills through active listening",
    "Plan monthly date nights with partner",
    "Reconnect with 5 old friends over the next 3 months"
  ],
  "Hobbies & Creativity": [
    "Learn to paint watercolors and complete 12 paintings",
    "Take a photography course and build a portfolio",
    "Learn to cook 3 cuisines from different cultures",
    "Start a garden and grow 5 different vegetables",
    "Write and record 3 original songs"
  ]
};

export default function Step1Brainstorm() {
  const { currentStep, isStepUnlocked, goToStep, completeCurrentStep } = useWorkflow();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customIdea, setCustomIdea] = useState("");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: ideas = [] } = useQuery<Idea[]>({
    queryKey: ["/api/ideas"],
  });

  if (!user?.id) {
    return <div>Please log in to access this page.</div>;
  }

  const createIdeaMutation = useMutation({
    mutationFn: async (ideaData: typeof insertIdeaSchema._type) => {
      const response = await apiRequest("POST", "/api/ideas", ideaData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({
        title: "Idea Added!",
        description: "Your idea has been captured successfully.",
      });
    },
  });

  const updateIdeaMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Idea> }) => {
      const response = await apiRequest("PATCH", `/api/ideas/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
    },
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ideas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({
        title: "Idea Removed",
        description: "The idea has been removed from your list.",
      });
    },
  });

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  const handleAddSuggestion = (suggestion: string) => {
    const category = categories.find(cat => cat.name === selectedCategory);
    if (!category) return;

    createIdeaMutation.mutate({
      userId: user.id,
      text: suggestion,
      categoryId: category.id,
      isPromoted: false,
    });
  };

  const handleAddCustomIdea = () => {
    if (!customIdea.trim() || !selectedCategory) return;

    const category = categories.find(cat => cat.name === selectedCategory);
    if (!category) return;

    createIdeaMutation.mutate({
      userId: user.id,
      text: customIdea.trim(),
      categoryId: category.id,
      isPromoted: false,
    });

    setCustomIdea("");
  };

  const handlePromoteIdea = (ideaId: number) => {
    updateIdeaMutation.mutate({
      id: ideaId,
      updates: { isPromoted: true }
    }, {
      onSuccess: () => {
        toast({
          title: "Idea Promoted!",
          description: "This idea is ready to become a SMART goal in Step 2.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to promote idea. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleRemoveIdea = (ideaId: number) => {
    deleteIdeaMutation.mutate(ideaId);
  };

  const progress = Math.min(Math.round((ideas.length / 5) * 100), 100);
  const canProceed = ideas.length > 0 && ideas.some(idea => idea.isPromoted);
  
  const handleCompleteStep = () => {
    if (canProceed) {
      completeCurrentStep();
    }
  };

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
            stepNumber={1}
            title="Brainstorm Ideas"
            description="Explore possibilities and capture your aspirations"
            progress={progress}
          />

          <CardContent className="p-6">
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-6 h-6 step-gradient-1 rounded mr-2 flex items-center justify-center">
                  <Lightbulb className="text-white" size={16} />
                </div>
                AI-Powered Idea Generation
              </h3>
              <p className="text-gray-600 mb-6">Choose a life category to explore goals and get AI-powered suggestions tailored to your interests.</p>
              
              {/* Category Selection */}
              <div className="mobile-grid mb-4 sm:mb-6">
                {categories.map((category) => {
                  const IconComponent = categoryIcons[category.icon as keyof typeof categoryIcons] || User;
                  const isSelected = selectedCategory === category.name;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.name)}
                      className={`p-4 rounded-lg transition-all ${
                        isSelected
                          ? "brand-orange text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <IconComponent className="mx-auto mb-2" size={24} />
                      <div className="font-medium text-sm">{category.name}</div>
                    </button>
                  );
                })}
              </div>

              {/* AI Suggestions */}
              {selectedCategory && (
                <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <div className="w-6 h-6 brand-orange rounded text-white flex items-center justify-center mr-2">
                      AI
                    </div>
                    AI Suggestions for {selectedCategory} Goals
                  </h4>
                  <div className="space-y-3">
                    {aiSuggestions[selectedCategory]?.map((suggestion, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                        <span className="text-gray-800 flex-1">{suggestion}</span>
                        <Button
                          onClick={() => handleAddSuggestion(suggestion)}
                          disabled={createIdeaMutation.isPending}
                          size="sm"
                          variant="outline"
                          className="ml-3 text-brand-orange hover:text-brand-orange-dark"
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Idea Input */}
              <div className="mt-6">
                <Label htmlFor="customIdea" className="block text-sm font-medium text-gray-700 mb-2">
                  Add Your Own Idea
                </Label>
                <div className="flex space-x-3">
                  <Input
                    id="customIdea"
                    type="text"
                    placeholder="Describe your goal or aspiration..."
                    value={customIdea}
                    onChange={(e) => setCustomIdea(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddCustomIdea()}
                    className="flex-1"
                    disabled={!selectedCategory}
                  />
                  <Button 
                    onClick={handleAddCustomIdea}
                    disabled={!customIdea.trim() || !selectedCategory || createIdeaMutation.isPending}
                    className="brand-orange"
                  >
                    Add Idea
                  </Button>
                </div>
                {!selectedCategory && (
                  <p className="text-sm text-gray-500 mt-1">Select a category first to add your own ideas</p>
                )}
              </div>
            </div>

            {/* Captured Ideas */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Captured Ideas</h3>
              {ideas.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Lightbulb className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No ideas captured yet. Start by selecting a category above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ideas.map((idea) => {
                    const category = categories.find(cat => cat.id === idea.categoryId);
                    return (
                      <div key={idea.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`w-3 h-3 rounded-full ${idea.isPromoted ? 'bg-green-500' : 'brand-orange'}`} />
                          <span className="text-gray-800 flex-1">{idea.text}</span>
                          {category && (
                            <Badge variant="secondary" className="text-xs">
                              {category.name}
                            </Badge>
                          )}
                          {idea.isPromoted && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              Ready for Goals
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          {!idea.isPromoted && (
                            <Button
                              onClick={() => handlePromoteIdea(idea.id)}
                              disabled={updateIdeaMutation.isPending}
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => handleRemoveIdea(idea.id)}
                            disabled={deleteIdeaMutation.isPending}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button variant="outline" disabled>
                <ArrowLeft className="mr-2" size={16} />
                Previous Step
              </Button>
              <Button 
                onClick={handleCompleteStep}
                disabled={!canProceed}
                className="brand-orange"
              >
                Continue to SMART Goals
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
