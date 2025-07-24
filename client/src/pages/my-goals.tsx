import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/useAuth";
import { Target, Calendar, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import type { Goal, Category } from "@shared/schema";

export default function MyGoals() {
  const { user } = useAuth();
  
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const activeGoals = goals.filter(goal => goal.status === "active");
  const completedGoals = goals.filter(goal => goal.status === "completed");

  const getCategoryName = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId)?.name || "Uncategorized";
  };

  const getStatusIcon = (status: string, progress: number) => {
    if (status === "completed") return <CheckCircle className="text-green-500" size={20} />;
    if (progress >= 90) return <TrendingUp className="text-orange-500" size={20} />;
    return <Target className="text-blue-500" size={20} />;
  };

  const getStatusColor = (status: string, progress: number) => {
    if (status === "completed") return "border-l-green-500 bg-green-50";
    if (progress >= 90) return "border-l-orange-500 bg-orange-50";
    return "border-l-blue-500 bg-blue-50";
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 header-with-backdrop">
          <h1 className="text-3xl font-bold text-white mb-2">My Goals</h1>
          <p className="text-white">Track and manage all your goals in one place</p>
        </div>

        {/* Goal Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white">
            <CardContent className="p-6 text-center">
              <Target className="mx-auto mb-3" size={40} />
              <div className="text-3xl font-bold mb-1">{activeGoals.length}</div>
              <div className="text-sm font-semibold uppercase tracking-wide">Active Goals</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-green-400 text-white">
            <CardContent className="p-6 text-center">
              <CheckCircle className="mx-auto mb-3" size={40} />
              <div className="text-3xl font-bold mb-1">{completedGoals.length}</div>
              <div className="text-sm font-semibold uppercase tracking-wide">Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-purple-400 text-white">
            <CardContent className="p-6 text-center">
              <TrendingUp className="mx-auto mb-3" size={40} />
              <div className="text-3xl font-bold mb-1">{goals.length}</div>
              <div className="text-sm font-semibold uppercase tracking-wide">Total Goals</div>
            </CardContent>
          </Card>
        </div>

        {/* Goals List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Goals */}
          <div>
            <h2 className="text-xl font-bold text-white text-shadow-medium mb-4">Active Goals</h2>
            <div className="space-y-4">
              {activeGoals.length === 0 ? (
                <Card className="border border-gray-300">
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">No active goals yet!</p>
                    <p className="text-gray-500 text-sm mt-2">Start your journey by creating some goals.</p>
                  </CardContent>
                </Card>
              ) : (
                activeGoals.map((goal) => (
                  <Card key={goal.id} className={`border-l-4 ${getStatusColor(goal.status, goal.progress)}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          {getStatusIcon(goal.status, goal.progress)}
                          <span className="ml-2">{goal.title}</span>
                        </CardTitle>
                        <Badge variant="outline">{getCategoryName(goal.categoryId)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-3">{goal.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Progress</span>
                          <span className="font-bold">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                        
                        <div className="flex justify-between text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="mr-1" size={14} />
                            Due: {new Date(goal.deadline).toLocaleDateString()}
                          </span>
                          <Badge variant="secondary">{goal.priority}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Completed Goals */}
          <div>
            <h2 className="text-xl font-bold text-white text-shadow-medium mb-4">Completed Goals</h2>
            <div className="space-y-4">
              {completedGoals.length === 0 ? (
                <Card className="border border-gray-300">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">No completed goals yet!</p>
                    <p className="text-gray-500 text-sm mt-2">Complete your first goal to see it here.</p>
                  </CardContent>
                </Card>
              ) : (
                completedGoals.map((goal) => (
                  <Card key={goal.id} className={`border-l-4 ${getStatusColor(goal.status, goal.progress)}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          {getStatusIcon(goal.status, goal.progress)}
                          <span className="ml-2">{goal.title}</span>
                        </CardTitle>
                        <Badge variant="outline">{getCategoryName(goal.categoryId)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-3">{goal.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Progress</span>
                          <span className="font-bold text-green-600">100%</span>
                        </div>
                        <Progress value={100} className="h-2" />
                        
                        <div className="flex justify-between text-sm text-gray-500">
                          <span className="flex items-center">
                            <CheckCircle className="mr-1 text-green-500" size={14} />
                            Completed: Recently
                          </span>
                          <Badge className="bg-green-500 text-white">DONE</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}