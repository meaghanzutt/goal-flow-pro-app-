import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Dumbbell, 
  ShoppingCart, 
  BookOpen, 
  Heart,
  Target,
  Clock,
  TrendingUp,
  Lightbulb
} from "lucide-react";

interface WellnessSuggestion {
  category: 'fitness' | 'nutrition' | 'mindfulness' | 'productivity' | 'goals';
  title: string;
  description: string;
  actionSteps: string[];
  priority: 'high' | 'medium' | 'low';
  timeToComplete?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface SuggestionResponse {
  suggestions: WellnessSuggestion[];
  personalizedMessage: string;
  focusArea: string;
}

export function AIWellnessSuggestionGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionResponse | null>(null);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/wellness-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          includeCategories: ['fitness', 'nutrition', 'mindfulness', 'productivity', 'goals'],
          personalizedFor: 'general_wellness'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI wellness suggestions error:', errorText);
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      console.log('AI wellness suggestions received:', data);
      setSuggestions(data);
      toast({ 
        title: "Success", 
        description: "Generated personalized wellness suggestions for you!" 
      });
    } catch (error) {
      console.error('AI wellness suggestions error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to generate wellness suggestions", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fitness': return <Dumbbell className="w-5 h-5" />;
      case 'nutrition': return <ShoppingCart className="w-5 h-5" />;
      case 'mindfulness': return <BookOpen className="w-5 h-5" />;
      case 'productivity': return <TrendingUp className="w-5 h-5" />;
      case 'goals': return <Target className="w-5 h-5" />;
      default: return <Heart className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fitness': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'nutrition': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'mindfulness': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'productivity': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'goals': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center space-x-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span>AI Wellness Suggestion Generator</span>
          </CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-300 font-medium">
            Get personalized wellness recommendations across fitness, nutrition, mindfulness, and productivity in one click
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={generateSuggestions}
            disabled={isGenerating}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                Generating Suggestions...
              </>
            ) : (
              <>
                <Lightbulb className="w-5 h-5 mr-2" />
                Generate My Wellness Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isGenerating && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-6 h-6 rounded" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {suggestions && !isGenerating && (
        <div className="space-y-6">
          {/* Personalized Message */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <Target className="w-5 h-5" />
                <span>Your Personalized Plan</span>
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300 font-medium">
                Focus Area: <strong>{suggestions.focusArea}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                {suggestions.personalizedMessage}
              </p>
            </CardContent>
          </Card>

          {/* Suggestions Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {suggestions.suggestions.map((suggestion, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${getCategoryColor(suggestion.category)}`}>
                        {getCategoryIcon(suggestion.category)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getCategoryColor(suggestion.category)}>
                            {suggestion.category}
                          </Badge>
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority} priority
                          </Badge>
                          {suggestion.difficulty && (
                            <Badge variant="outline" className={getDifficultyColor(suggestion.difficulty)}>
                              {suggestion.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {suggestion.timeToComplete && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {suggestion.timeToComplete}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-4">
                    {suggestion.description}
                  </p>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Action Steps:</h4>
                    <ul className="space-y-1">
                      {suggestion.actionSteps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start space-x-2 text-sm">
                          <span className="w-5 h-5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                            {stepIndex + 1}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Regenerate Button */}
          <div className="text-center">
            <Button 
              onClick={generateSuggestions}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New Suggestions
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}