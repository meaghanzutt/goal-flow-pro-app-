import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, TrendingUp, Target, Brain, Lightbulb, AlertTriangle, CheckCircle } from "lucide-react";

interface MlInsight {
  id: number;
  insightType: string;
  title: string;
  description: string;
  confidence: number;
  actionItems?: string[];
  data?: any;
  priority: "high" | "medium" | "low";
  isActive: boolean;
  createdAt: string;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export function MLInsightsDashboard({ className }: AnalyticsDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInsight, setSelectedInsight] = useState<MlInsight | null>(null);

  // Fetch existing insights
  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/analytics/insights"],
    retry: false,
  });

  // Fetch recommendations
  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: ["/api/analytics/recommendations"],
    retry: false,
  });

  const recommendations = (recommendationsData as { recommendations?: string[] })?.recommendations || [];

  // Generate new insights mutation
  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/analytics/generate-insights");
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/insights"] });
      toast({
        title: "Insights Generated",
        description: `Generated ${Array.isArray(data) ? data.length : 'new'} ML insights from your data.`,
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate new insights. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Track analytics event for user interactions
  const trackEvent = async (eventType: string, metadata?: any) => {
    try {
      await apiRequest("POST", "/api/analytics/track-event", {
        eventType,
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to track analytics event:", error);
    }
  };

  const handleGenerateInsights = () => {
    trackEvent("ml_insights_generated");
    generateInsightsMutation.mutate();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "medium":
        return <Target className="h-4 w-4" />;
      case "low":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case "completion_prediction":
        return <Target className="h-5 w-5" />;
      case "productivity_pattern":
        return <TrendingUp className="h-5 w-5" />;
      case "task_velocity":
        return <Sparkles className="h-5 w-5" />;
      case "habit_consistency":
        return <CheckCircle className="h-5 w-5" />;
      case "success_factors":
        return <Brain className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getInsightTypeLabel = (type: string) => {
    switch (type) {
      case "completion_prediction":
        return "Goal Completion Forecast";
      case "productivity_pattern":
        return "Productivity Analysis";
      case "task_velocity":
        return "Task Velocity";
      case "habit_consistency":
        return "Habit Consistency";
      case "success_factors":
        return "Success Factors";
      default:
        return "ML Insight";
    }
  };

  if (insightsLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Analytics & Insights
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Machine learning powered insights from your goal achievement data
          </p>
        </div>
        <Button 
          onClick={handleGenerateInsights}
          disabled={generateInsightsMutation.isPending}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Brain className="h-4 w-4 mr-2" />
          {generateInsightsMutation.isPending ? "Generating..." : "Generate New Insights"}
        </Button>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insights">ML Insights ({(insights as MlInsight[]).length})</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations ({recommendations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {(insights as MlInsight[]).length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No ML insights available yet. Generate insights from your goal data to get personalized recommendations.
                  </p>
                  <Button onClick={handleGenerateInsights} disabled={generateInsightsMutation.isPending}>
                    Generate First Insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(insights as MlInsight[]).map((insight: MlInsight) => (
                <Card 
                  key={insight.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedInsight(insight);
                    trackEvent("ml_insight_viewed", { insightType: insight.insightType });
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {getInsightTypeIcon(insight.insightType)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {getInsightTypeLabel(insight.insightType)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                          {getPriorityIcon(insight.priority)}
                          <span className="ml-1 capitalize">{insight.priority}</span>
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Confidence</div>
                          <div className="font-semibold">{insight.confidence}%</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {insight.description}
                    </p>
                    <Progress value={insight.confidence} className="mb-3" />
                    {insight.actionItems && insight.actionItems.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                          Recommended Actions:
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {insight.actionItems.slice(0, 2).map((action, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {action}
                            </li>
                          ))}
                          {insight.actionItems.length > 2 && (
                            <li className="text-gray-500 italic">
                              +{insight.actionItems.length - 2} more actions...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendationsLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No personalized recommendations available yet. Complete more goals and track progress to receive AI-powered suggestions.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recommendations.map((recommendation: string, index: number) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 dark:text-gray-200">{recommendation}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detailed Insight Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{selectedInsight.title}</h3>
                <Button variant="ghost" onClick={() => setSelectedInsight(null)}>
                  ×
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Badge className={getPriorityColor(selectedInsight.priority)}>
                    {selectedInsight.priority.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {selectedInsight.confidence}% Confidence
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {selectedInsight.description}
                </p>
                {selectedInsight.actionItems && (
                  <div>
                    <h4 className="font-medium mb-2">Recommended Actions:</h4>
                    <ul className="space-y-2">
                      {selectedInsight.actionItems.map((action, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedInsight.data && (
                  <div>
                    <h4 className="font-medium mb-2">Supporting Data:</h4>
                    <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedInsight.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}