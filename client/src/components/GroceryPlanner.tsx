import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ShoppingCart, DollarSign, Check, X, Trash2, Package } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { type GroceryList } from "@shared/schema";

interface GroceryItem {
  name: string;
  quantity: string;
  category: string;
  estimatedPrice?: number;
  purchased: boolean;
}

interface GroceryFormData {
  name: string;
  category: string;
  items: GroceryItem[];
  goalId?: number;
}

export function GroceryPlanner() {
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<GroceryFormData>({
    name: "",
    category: "general",
    items: []
  });
  const [newItem, setNewItem] = useState<Partial<GroceryItem>>({
    name: "",
    quantity: "1",
    category: "produce",
    purchased: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groceryLists = [], isLoading } = useQuery<GroceryList[]>({
    queryKey: ['/api/grocery-lists'],
  });

  const createListMutation = useMutation({
    mutationFn: async (data: GroceryFormData) => {
      const response = await fetch('/api/grocery-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create grocery list');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grocery-lists'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Success", description: "Grocery list created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create grocery list", variant: "destructive" });
    }
  });

  const updateListMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<GroceryList> }) => {
      const response = await fetch(`/api/grocery-lists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update grocery list');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grocery-lists'] });
      toast({ title: "Success", description: "Grocery list updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update grocery list", variant: "destructive" });
    }
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/grocery-lists/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete grocery list');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grocery-lists'] });
      setSelectedList(null);
      toast({ title: "Success", description: "Grocery list deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete grocery list", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "general",
      items: []
    });
    setNewItem({
      name: "",
      quantity: "1",
      category: "produce",
      purchased: false
    });
  };

  const addItem = () => {
    if (!newItem.name?.trim()) {
      toast({ title: "Error", description: "Item name is required", variant: "destructive" });
      return;
    }

    const item: GroceryItem = {
      name: newItem.name,
      quantity: newItem.quantity || "1",
      category: newItem.category || "produce",
      purchased: false
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({
      name: "",
      quantity: "1",
      category: "produce",
      purchased: false
    });
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const toggleItemPurchased = (listId: number, itemIndex: number) => {
    const list = groceryLists.find((l: GroceryList) => l.id === listId);
    if (!list || !Array.isArray(list.items)) return;

    const updatedItems = [...list.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      purchased: !updatedItems[itemIndex].purchased
    };

    const purchasedCount = updatedItems.filter(item => item.purchased).length;
    const isCompleted = purchasedCount === updatedItems.length;

    updateListMutation.mutate({
      id: listId,
      data: {
        items: updatedItems,
        isCompleted
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "List name is required", variant: "destructive" });
      return;
    }

    if (formData.items.length === 0) {
      toast({ title: "Error", description: "At least one item is required", variant: "destructive" });
      return;
    }

    createListMutation.mutate(formData);
  };

  const getListProgress = (list: GroceryList) => {
    if (!Array.isArray(list.items) || list.items.length === 0) return 0;
    const purchasedCount = list.items.filter((item: any) => item.purchased).length;
    return Math.round((purchasedCount / list.items.length) * 100);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health': return '🥗';
      case 'fitness': return '💪';
      case 'meal_prep': return '🥘';
      default: return '🛒';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <ShoppingCart className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Grocery Planner</h2>
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
          <ShoppingCart className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Grocery Planner</h2>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create List
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Grocery List</DialogTitle>
              <DialogDescription>
                Organize your shopping with a smart grocery list.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">List Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Weekly Groceries"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="health">Health & Wellness</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="meal_prep">Meal Prep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Items</Label>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <Input
                      value={newItem.name || ""}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Item name"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={newItem.quantity || ""}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                      placeholder="Qty"
                    />
                  </div>
                  <div className="col-span-4">
                    <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="produce">Produce</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                        <SelectItem value="meat">Meat & Seafood</SelectItem>
                        <SelectItem value="pantry">Pantry</SelectItem>
                        <SelectItem value="frozen">Frozen</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button type="button" size="sm" onClick={addItem}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {formData.items.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                          <span>{item.name}</span>
                          <span className="text-sm text-gray-500">({item.quantity})</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                        >
                          <X className="w-4 h-4" />
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
                  disabled={createListMutation.isPending}
                >
                  {createListMutation.isPending ? "Creating..." : "Create List"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groceryLists.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No grocery lists yet</h3>
              <p className="text-gray-500 dark:text-gray-500 text-center mb-4">
                Create your first grocery list to stay organized while shopping.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First List
              </Button>
            </CardContent>
          </Card>
        ) : (
          groceryLists.map((list: GroceryList) => {
            const progress = getListProgress(list);
            const itemCount = Array.isArray(list.items) ? list.items.length : 0;
            const purchasedCount = Array.isArray(list.items) ? list.items.filter((item: any) => item.purchased).length : 0;

            return (
              <Card key={list.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedList(list)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <span className="mr-2">{getCategoryIcon(list.category)}</span>
                        {list.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-gray-700 dark:text-gray-300 font-medium">
                        {itemCount} items • {purchasedCount} purchased
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      {list.isCompleted && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteListMutation.mutate(list.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    {list.totalEstimatedCost && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Est. ${(list.totalEstimatedCost / 100).toFixed(2)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {selectedList && (
        <Dialog open={!!selectedList} onOpenChange={() => setSelectedList(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <span className="mr-2">{getCategoryIcon(selectedList.category)}</span>
                {selectedList.name}
              </DialogTitle>
              <DialogDescription>
                {Array.isArray(selectedList.items) ? selectedList.items.length : 0} items in your shopping list
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Array.isArray(selectedList.items) && selectedList.items.length > 0 ? (
                selectedList.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={item.purchased}
                      onCheckedChange={() => toggleItemPurchased(selectedList.id, index)}
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${item.purchased ? 'line-through text-gray-500' : ''}`}>
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.quantity} • {item.category}
                      </div>
                    </div>
                    {item.estimatedPrice && (
                      <div className="text-sm font-medium">
                        ${(item.estimatedPrice / 100).toFixed(2)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No items in this list</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}