import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  Plus, 
  Trash2, 
  Edit3, 
  Save,
  X,
  Image as ImageIcon,
  Target,
  Heart,
  Star,
  Calendar,
  Download
} from "lucide-react";

interface VisionBoardItem {
  id: string;
  type: 'text' | 'image';
  content: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  category: 'career' | 'health' | 'relationships' | 'personal' | 'financial' | 'travel';
  deadline?: string;
}

export function VisionBoard() {
  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    content: '',
    category: 'personal' as VisionBoardItem['category'],
    deadline: ''
  });
  const [isAddingItem, setIsAddingItem] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const categories = {
    career: { label: 'Career', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Target },
    health: { label: 'Health', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: Heart },
    relationships: { label: 'Relationships', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200', icon: Heart },
    personal: { label: 'Personal Growth', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: Star },
    financial: { label: 'Financial', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Target },
    travel: { label: 'Travel & Adventure', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: Calendar }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addTextItem = () => {
    if (!newItem.title.trim() || !newItem.content.trim()) {
      toast({ title: "Error", description: "Please fill in both title and description", variant: "destructive" });
      return;
    }

    const item: VisionBoardItem = {
      id: generateId(),
      type: 'text',
      title: newItem.title,
      content: newItem.content,
      category: newItem.category,
      deadline: newItem.deadline || undefined,
      position: { 
        x: Math.random() * 400 + 50, 
        y: Math.random() * 300 + 50 
      },
      size: { width: 250, height: 180 }
    };

    setItems([...items, item]);
    setNewItem({ title: '', content: '', category: 'personal', deadline: '' });
    setIsAddingItem(false);
    toast({ title: "Success", description: "Vision item added to your board!" });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const item: VisionBoardItem = {
        id: generateId(),
        type: 'image',
        title: file.name.split('.')[0],
        content: imageUrl,
        category: 'personal',
        position: { 
          x: Math.random() * 400 + 50, 
          y: Math.random() * 300 + 50 
        },
        size: { width: 200, height: 200 }
      };

      setItems([...items, item]);
      toast({ title: "Success", description: "Image added to your vision board!" });
    };
    reader.readAsDataURL(file);
  };

  const updateItem = (id: string, updates: Partial<VisionBoardItem>) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast({ title: "Success", description: "Item removed from vision board" });
  };

  const saveBoard = () => {
    // In a real app, this would save to a database
    localStorage.setItem('visionBoard', JSON.stringify(items));
    toast({ title: "Success", description: "Vision board saved!" });
  };

  const loadBoard = () => {
    const saved = localStorage.getItem('visionBoard');
    if (saved) {
      setItems(JSON.parse(saved));
      toast({ title: "Success", description: "Vision board loaded!" });
    }
  };

  // Load saved board on component mount
  useState(() => {
    loadBoard();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center space-x-2">
            <Camera className="w-6 h-6 text-purple-600" />
            <span>Vision Board</span>
          </CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-300 font-medium">
            Create a visual representation of your goals and dreams. Add images, quotes, and aspirations to manifest your future.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 justify-center">
          <Button 
            onClick={() => setIsAddingItem(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Text Goal
          </Button>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Add Image
          </Button>
          <Button 
            onClick={saveBoard}
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Board
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Add New Item Modal */}
      {isAddingItem && (
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Add New Vision Item</span>
              <Button variant="ghost" size="sm" onClick={() => setIsAddingItem(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="e.g., Dream Home, Career Promotion"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value as VisionBoardItem['category'] })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  {Object.entries(categories).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="content">Description / Affirmation</Label>
              <Textarea
                id="content"
                value={newItem.content}
                onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                placeholder="Describe your vision or write an affirmation..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="deadline">Target Date (Optional)</Label>
              <Input
                id="deadline"
                type="date"
                value={newItem.deadline}
                onChange={(e) => setNewItem({ ...newItem, deadline: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addTextItem} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add to Board
              </Button>
              <Button variant="outline" onClick={() => setIsAddingItem(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vision Board Canvas */}
      <Card className="min-h-[600px] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950">
        <CardHeader>
          <CardTitle className="text-center text-gray-800 dark:text-gray-200">
            My Vision Board
          </CardTitle>
          {items.length === 0 && (
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              Start building your vision by adding your first goal or inspiration image
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="relative h-[500px] overflow-hidden">
          {items.map((item) => (
            <div
              key={item.id}
              className="absolute cursor-move group"
              style={{
                left: `${item.position.x}px`,
                top: `${item.position.y}px`,
                width: `${item.size.width}px`,
                height: `${item.size.height}px`,
              }}
            >
              <Card className="h-full shadow-lg hover:shadow-xl transition-shadow bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">
                        {item.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={categories[item.category].color} variant="secondary">
                          {categories[item.category].label}
                        </Badge>
                        {item.deadline && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(item.deadline).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setIsEditing(item.id)}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 h-full overflow-hidden">
                  {item.type === 'image' ? (
                    <img
                      src={item.content}
                      alt={item.title}
                      className="w-full h-full object-cover rounded border"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed overflow-hidden">
                      {item.content}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(categories).map(([key, cat]) => {
            const count = items.filter(item => item.category === key).length;
            const Icon = cat.icon;
            return (
              <Card key={key} className="text-center">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{cat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}