import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BookOpen, Sparkles, Calendar, Trash2, Edit, Heart, Smile, Meh, Frown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { type JournalEntry } from "@shared/schema";
import { format } from "date-fns";

interface JournalFormData {
  title: string;
  content: string;
  mood: string;
  tags: string[];
  aiPrompt?: string;
  goalId?: number;
}

export function JournalHub() {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<JournalFormData>({
    title: "",
    content: "",
    mood: "neutral",
    tags: []
  });
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: journalEntries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['/api/journal-entries'],
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: JournalFormData) => {
      const response = await fetch('/api/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create journal entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Success", description: "Journal entry created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create journal entry", variant: "destructive" });
    }
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<JournalEntry> }) => {
      const response = await fetch(`/api/journal-entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update journal entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
      setSelectedEntry(null);
      toast({ title: "Success", description: "Journal entry updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update journal entry", variant: "destructive" });
    }
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/journal-entries/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete journal entry');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
      setSelectedEntry(null);
      toast({ title: "Success", description: "Journal entry deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete journal entry", variant: "destructive" });
    }
  });

  const generateAIPrompts = async () => {
    setIsLoadingPrompts(true);
    try {
      const response = await fetch('/api/ai/journal-prompts?goalType=personal_development&mood=' + formData.mood, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI prompts error:', errorText);
        throw new Error('Failed to generate prompts');
      }
      const data = await response.json();
      console.log('AI prompts received:', data);
      // Handle both direct prompts array and nested prompts object
      const prompts = data.prompts?.prompts || data.prompts || [];
      setAiPrompts(prompts);
    } catch (error) {
      console.error('AI prompts error:', error);
      // Provide fallback prompts if API fails
      const fallbackPrompts = [
        "What small action can I take today to move closer to my goals?",
        "What am I most grateful for in my journey so far?",
        "What challenge am I currently facing, and how can I approach it differently?",
        "What would I tell my past self about pursuing goals?",
        "What success, no matter how small, can I celebrate today?"
      ];
      setAiPrompts(fallbackPrompts);
      toast({ 
        title: "Using Backup Prompts", 
        description: "AI service temporarily unavailable, showing curated prompts instead" 
      });
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      mood: "neutral",
      tags: []
    });
    setAiPrompts([]);
    setTagInput("");
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const usePrompt = (prompt: string) => {
    setFormData(prev => ({
      ...prev,
      content: prompt,
      aiPrompt: prompt
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast({ title: "Error", description: "Journal content is required", variant: "destructive" });
      return;
    }

    createEntryMutation.mutate(formData);
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy':
      case 'excited':
        return <Smile className="w-4 h-4 text-yellow-500" />;
      case 'motivated':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'stressed':
      case 'anxious':
        return <Frown className="w-4 h-4 text-blue-500" />;
      default:
        return <Meh className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy':
      case 'excited':
        return 'bg-yellow-100 text-yellow-800';
      case 'motivated':
        return 'bg-red-100 text-red-800';
      case 'stressed':
      case 'anxious':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <BookOpen className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Journal Hub</h2>
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
          <BookOpen className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Journal Hub</h2>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Create Journal Entry</DialogTitle>
              <DialogDescription>
                Reflect on your goals and personal growth with AI-suggested prompts.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter a title for your entry"
                  />
                </div>
                <div>
                  <Label htmlFor="mood">Current Mood</Label>
                  <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="happy">😊 Happy</SelectItem>
                      <SelectItem value="excited">🤗 Excited</SelectItem>
                      <SelectItem value="motivated">💪 Motivated</SelectItem>
                      <SelectItem value="neutral">😐 Neutral</SelectItem>
                      <SelectItem value="stressed">😰 Stressed</SelectItem>
                      <SelectItem value="anxious">😟 Anxious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>AI Writing Prompts</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAIPrompts}
                    disabled={isLoadingPrompts}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isLoadingPrompts ? "Generating..." : "Get Prompts"}
                  </Button>
                </div>
                {aiPrompts.length > 0 && (
                  <div className="space-y-2 border rounded-lg p-3 bg-purple-50 dark:bg-purple-900/20 max-h-32 overflow-y-auto">
                    {aiPrompts.map((prompt, index) => (
                      <div key={index} className="flex items-start justify-between text-sm">
                        <span className="flex-1 text-purple-900 dark:text-purple-100">{prompt}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => usePrompt(prompt)}
                          className="ml-2 text-xs"
                        >
                          Use
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="content">Journal Entry</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="What's on your mind? How are you progressing toward your goals?"
                  className="min-h-[120px]"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.content.split(' ').filter(word => word.length > 0).length} words
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" size="sm" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
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
                  disabled={createEntryMutation.isPending}
                >
                  {createEntryMutation.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        {journalEntries.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No journal entries yet</h3>
              <p className="text-gray-500 dark:text-gray-500 text-center mb-4">
                Start journaling to reflect on your goals and track your personal growth.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Write Your First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          journalEntries.map((entry: JournalEntry) => (
            <Card key={entry.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedEntry(entry)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {entry.title || `Entry from ${format(new Date(entry.createdAt || new Date()), 'MMM d, yyyy')}`}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center space-x-2 text-gray-700 dark:text-gray-300 font-medium">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(entry.createdAt || new Date()), 'MMM d, yyyy h:mm a')}</span>
                      <span className="mx-2">•</span>
                      <span>{entry.wordCount || 0} words</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className={getMoodColor(entry.mood || 'neutral')}>
                      {getMoodIcon(entry.mood || 'neutral')}
                      <span className="ml-1 capitalize">{entry.mood || 'neutral'}</span>
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEntryMutation.mutate(entry.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                  {entry.content.length > 150 ? `${entry.content.substring(0, 150)}...` : entry.content}
                </p>
                {entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {entry.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {entry.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{entry.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                {selectedEntry.title || `Entry from ${format(new Date(selectedEntry.createdAt), 'MMM d, yyyy')}`}
              </DialogTitle>
              <DialogDescription className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(selectedEntry.createdAt || new Date()), 'MMMM d, yyyy h:mm a')}</span>
                <span className="mx-2">•</span>
                <Badge variant="secondary" className={getMoodColor(selectedEntry.mood || 'neutral')}>
                  {getMoodIcon(selectedEntry.mood || 'neutral')}
                  <span className="ml-1 capitalize">{selectedEntry.mood || 'neutral'}</span>
                </Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedEntry.aiPrompt && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Label className="text-sm font-medium text-purple-900 dark:text-purple-100">AI Prompt Used:</Label>
                  <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">{selectedEntry.aiPrompt}</p>
                </div>
              )}
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{selectedEntry.content}</p>
              </div>
              {selectedEntry.tags && Array.isArray(selectedEntry.tags) && selectedEntry.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Tags:</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedEntry.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t">
                <span>Word count: {selectedEntry.wordCount || 0}</span>
                <span>Created: {format(new Date(selectedEntry.createdAt || new Date()), 'MMM d, yyyy h:mm a')}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}