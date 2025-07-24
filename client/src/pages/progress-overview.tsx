import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, Target, Calendar, Activity, Award, Clock } from "lucide-react";
import type { Goal, ProgressEntry, Habit } from "@shared/schema";

export default function ProgressOverview() {
  const { user } = useAuth();
  
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: progressEntries = [] } = useQuery<ProgressEntry[]>({
    queryKey: [`/api/users/${user?.id}/progress`],
    enabled: !!user?.id,
  });

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: [`/api/users/${user?.id}/habits`],
    enabled: !!user?.id,
  });

  const activeGoals = goals.filter(goal => goal.status === "active");
  const completedGoals = goals.filter(goal => goal.status === "completed");
  const averageProgress = goals.length > 0 ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0;
  
  const totalHabits = habits.length;
  const activeHabits = habits.filter(habit => habit.isActive).length;
  const averageStreak = habits.length > 0 ? Math.round(habits.reduce((sum, habit) => sum + habit.currentStreak, 0) / habits.length) : 0;

  const recentProgress = progressEntries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 header-with-backdrop">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Overview</h1>
          <p className="text-gray-700">Track your journey and celebrate your achievements</p>
        </div>

        {/* Progress Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-green-400 text-white">
            <CardContent className="p-6 text-center">
              <Target className="mx-auto mb-3" size={40} />
              <div className="text-3xl font-bold mb-1">{averageProgress}%</div>
              <div className="text-sm font-semibold uppercase tracking-wide">Avg Progress</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white">
            <CardContent className="p-6 text-center">
              <Activity className="mx-auto mb-3" size={40} />
              <div className="text-3xl font-bold mb-1">{activeGoals.length}</div>
              <div className="text-sm font-semibold uppercase tracking-wide">Active Goals</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-purple-400 text-white">
            <CardContent className="p-6 text-center">
              <Award className="mx-auto mb-3" size={40} />
              <div className="text-3xl font-bold mb-1">{completedGoals.length}</div>
              <div className="text-sm font-semibold uppercase tracking-wide">Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-orange-400 text-white">
            <CardContent className="p-6 text-center">
              <Clock className="mx-auto mb-3" size={40} />
              <div className="text-3xl font-bold mb-1">{averageStreak}</div>
              <div className="text-sm font-semibold uppercase tracking-wide">Avg Streak</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Goal Progress */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 text-green-600" />
                Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeGoals.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active goals to track</p>
                ) : (
                  activeGoals.map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{goal.title}</span>
                        <span className="text-sm font-bold text-gray-600">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <div className="text-sm text-gray-500">
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProgress.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent progress entries</p>
                ) : (
                  recentProgress.map((entry, index) => {
                    const goal = goals.find(g => g.id === entry.goalId);
                    return (
                      <div key={entry.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{goal?.title || 'Unknown Goal'}</div>
                          <div className="text-sm text-gray-600">{entry.notes || 'Progress update'}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">+{entry.progressPercent}%</div>
                          {entry.mood && (
                            <div className="text-xs text-gray-500">Mood: {entry.mood}/5</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Habit Tracking */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 text-purple-600" />
                Habit Streaks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {habits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No habits being tracked</p>
                ) : (
                  habits.map((habit) => (
                    <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{habit.name}</div>
                        <div className="text-sm text-gray-600">{habit.frequency}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-orange-600">
                          {habit.currentStreak} day streak
                        </div>
                        <div className="text-xs text-gray-500">
                          Best: {habit.longestStreak} days
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Summary */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 text-yellow-600" />
                This Week's Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="font-medium text-green-800">Goals Progress</div>
                  <div className="text-sm text-green-600">
                    {activeGoals.filter(goal => goal.progress >= 75).length} goals are almost complete!
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="font-medium text-blue-800">Habit Consistency</div>
                  <div className="text-sm text-blue-600">
                    {activeHabits} out of {totalHabits} habits are active
                  </div>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <div className="font-medium text-purple-800">Recent Activity</div>
                  <div className="text-sm text-purple-600">
                    {progressEntries.length} progress entries this week
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}