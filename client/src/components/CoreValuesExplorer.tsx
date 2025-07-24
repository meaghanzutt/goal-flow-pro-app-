import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Plus, Heart, Star, Lightbulb, Trash2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { type CoreValue } from "@shared/schema";

interface CoreValueFormData {
  value: string;
  description: string;
  importance: number;
  examples: string[];
  relatedGoals: number[];
}

interface ValuesExercise {
  exercise: string;
  questions: string[];
  values: string[];
}

export function CoreValuesExplorer() {
  const [selectedValue, setSelectedValue] = useState<CoreValue | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExerciseOpen, setIsExerciseOpen] = useState(false);
  const [formData, setFormData] = useState<CoreValueFormData>({
    value: "",
    description: "",
    importance: 5,
    examples: [],
    relatedGoals: []
  });
  const [valuesExercise, setValuesExercise] = useState<ValuesExercise | null>(null);
  const [isLoadingExercise, setIsLoadingExercise] = useState(false);
  const [exampleInput, setExampleInput] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coreValues = [], isLoading } = useQuery<CoreValue[]>({
    queryKey: ['/api/core-values'],
  });

  const createValueMutation = useMutation({
    mutationFn: async (data: CoreValueFormData) => {
      const response = await fetch('/api/core-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create core value');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/core-values'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Success", description: "Core value created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create core value", variant: "destructive" });
    }
  });

  const updateValueMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<CoreValue> }) => {
      const response = await fetch(`/api/core-values/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update core value');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/core-values'] });
      setSelectedValue(null);
      toast({ title: "Success", description: "Core value updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update core value", variant: "destructive" });
    }
  });

  const deleteValueMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/core-values/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete core value');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/core-values'] });
      setSelectedValue(null);
      toast({ title: "Success", description: "Core value deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete core value", variant: "destructive" });
    }
  });

  const generateValuesExercise = async () => {
    setIsLoadingExercise(true);
    try {
      const response = await fetch('/api/ai/core-values-exercise', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to generate exercise');
      const data = await response.json();
      setValuesExercise(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate values exercise", variant: "destructive" });
    } finally {
      setIsLoadingExercise(false);
    }
  };

  const resetForm = () => {
    setFormData({
      value: "",
      description: "",
      importance: 5,
      examples: [],
      relatedGoals: []
    });
    setExampleInput("");
  };

  const addExample = () => {
    if (exampleInput.trim() && !formData.examples.includes(exampleInput.trim())) {
      setFormData(prev => ({
        ...prev,
        examples: [...prev.examples, exampleInput.trim()]
      }));
      setExampleInput("");
    }
  };

  const removeExample = (example: string) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter(e => e !== example)
    }));
  };

  const addValueFromSuggestion = (value: string) => {
    setFormData(prev => ({ ...prev, value }));
    setIsCreateOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.value.trim()) {
      toast({ title: "Error", description: "Value name is required", variant: "destructive" });
      return;
    }

    createValueMutation.mutate(formData);
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return 'text-red-600';
    if (importance >= 6) return 'text-orange-600';
    if (importance >= 4) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getImportanceLabel = (importance: number) => {
    if (importance >= 8) return 'Critical';
    if (importance >= 6) return 'Important';
    if (importance >= 4) return 'Moderate';
    return 'Low';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Heart className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Core Values Explorer</h2>
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
          <Heart className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Core Values Explorer</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsExerciseOpen(true)}>
            <Lightbulb className="w-4 h-4 mr-2" />
            Values Exercise
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Value
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Core Value</DialogTitle>
                <DialogDescription>
                  Define what matters most to you and guides your decisions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="value">Value Name</Label>
                  <Input
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="e.g., Authenticity, Growth, Family"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this value mean to you?"
                  />
                </div>

                <div>
                  <Label>Importance (1-10)</Label>
                  <div className="px-2 py-4">
                    <Slider
                      value={[formData.importance]}
                      onValueChange={(value) => setFormData({ ...formData, importance: value[0] })}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span className={`font-semibold ${getImportanceColor(formData.importance)}`}>
                        {formData.importance} - {getImportanceLabel(formData.importance)}
                      </span>
                      <span>Critical</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Examples</Label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={exampleInput}
                      onChange={(e) => setExampleInput(e.target.value)}
                      placeholder="How this value shows up in your life"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExample())}
                    />
                    <Button type="button" size="sm" onClick={addExample}>
                      Add
                    </Button>
                  </div>
                  {formData.examples.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {formData.examples.map((example, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <span>{example}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeExample(example)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
                    disabled={createValueMutation.isPending}
                  >
                    {createValueMutation.isPending ? "Saving..." : "Save Value"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coreValues.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No core values defined yet</h3>
              <p className="text-gray-500 dark:text-gray-500 text-center mb-4">
                Discover and define your core values to guide your goal-setting and decision-making.
              </p>
              <Button onClick={() => setIsExerciseOpen(true)}>
                <Lightbulb className="w-4 h-4 mr-2" />
                Start Values Exercise
              </Button>
            </CardContent>
          </Card>
        ) : (
          coreValues.map((value: CoreValue) => (
            <Card key={value.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedValue(value)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <Star className={`w-5 h-5 mr-2 ${getImportanceColor(value.importance || 5)}`} />
                      {value.value}
                    </CardTitle>
                    <CardDescription className="mt-1 text-gray-700 dark:text-gray-300 font-medium">{value.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className={getImportanceColor(value.importance || 5)}>
                      {value.importance}/10
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteValueMutation.mutate(value.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {value.examples && Array.isArray(value.examples) && value.examples.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Examples:</Label>
                    {value.examples.slice(0, 2).map((example, index) => (
                      <p key={index} className="text-sm text-gray-700 dark:text-gray-300">• {example}</p>
                    ))}
                    {value.examples.length > 2 && (
                      <p className="text-xs text-gray-500">+{value.examples.length - 2} more examples</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Values Exercise Dialog */}
      <Dialog open={isExerciseOpen} onOpenChange={setIsExerciseOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Core Values Discovery Exercise</DialogTitle>
            <DialogDescription>
              Explore and discover your core values with AI-guided reflection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={generateValuesExercise}
              disabled={isLoadingExercise}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isLoadingExercise ? "Generating Exercise..." : "Generate Values Exercise"}
            </Button>

            {valuesExercise && (
              <Tabs defaultValue="exercise">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="exercise">Exercise</TabsTrigger>
                  <TabsTrigger value="questions">Reflection</TabsTrigger>
                  <TabsTrigger value="values">Value List</TabsTrigger>
                </TabsList>
                <TabsContent value="exercise" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Values Discovery Exercise</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300">{valuesExercise.exercise}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="questions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reflection Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {valuesExercise.questions.map((question, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-gray-700 dark:text-gray-300 font-medium">{index + 1}. {question}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="values" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Common Core Values</CardTitle>
                      <CardDescription>
                        Click on any value to add it to your personal list
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        {valuesExercise.values.map((value, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => addValueFromSuggestion(value)}
                            className="justify-start"
                          >
                            {value}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Value Detail Dialog */}
      {selectedValue && (
        <Dialog open={!!selectedValue} onOpenChange={() => setSelectedValue(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Star className={`w-5 h-5 mr-2 ${getImportanceColor(selectedValue.importance || 5)}`} />
                {selectedValue.value}
              </DialogTitle>
              <DialogDescription>
                Importance: {selectedValue.importance}/10 - {getImportanceLabel(selectedValue.importance || 5)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedValue.description && (
                <div>
                  <Label className="text-sm font-medium">Description:</Label>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">{selectedValue.description}</p>
                </div>
              )}
              {selectedValue.examples && Array.isArray(selectedValue.examples) && selectedValue.examples.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">How this value shows up in your life:</Label>
                  <div className="space-y-2 mt-2">
                    {selectedValue.examples.map((example, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <p className="text-gray-700 dark:text-gray-300">{example}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Created: {new Date(selectedValue.createdAt || new Date()).toLocaleDateString()}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}