import OpenAI from "openai";
import { storage } from "./storage";
import type { AnalyticsEvent, MlInsight, UserPattern, PredictionModel } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class MLAnalyticsService {
  // Track user actions for analytics
  async trackEvent(userId: string, eventType: string, entityId?: number, entityType?: string, metadata?: any) {
    try {
      await storage.createAnalyticsEvent({
        userId,
        eventType,
        entityId,
        entityType,
        metadata
      });
    } catch (error) {
      console.error("Error tracking analytics event:", error);
    }
  }

  // Generate comprehensive ML insights for a user
  async generateInsights(userId: string): Promise<MlInsight[]> {
    try {
      const insights: MlInsight[] = [];
      
      // Get user data for analysis
      const goals = await storage.getGoalsByUserId(userId);
      const tasks = await storage.getTasksByUserId(userId);
      const progressEntries = await storage.getProgressEntriesByUserId(userId);
      const habits = await storage.getHabitsByUserId(userId);
      const analyticsEvents = await storage.getAnalyticsEventsByUserId(userId);

      // 1. Goal Completion Prediction
      const completionPrediction = await this.predictGoalCompletion(userId, goals, tasks, progressEntries);
      if (completionPrediction) insights.push(completionPrediction);

      // 2. Productivity Pattern Analysis
      const productivityPattern = await this.analyzeProductivityPatterns(userId, analyticsEvents, progressEntries);
      if (productivityPattern) insights.push(productivityPattern);

      // 3. Task Velocity Analysis
      const velocityInsight = await this.analyzeTaskVelocity(userId, tasks, analyticsEvents);
      if (velocityInsight) insights.push(velocityInsight);

      // 4. Habit Consistency Analysis
      const habitInsight = await this.analyzeHabitConsistency(userId, habits);
      if (habitInsight) insights.push(habitInsight);

      // 5. Goal Success Factors
      const successFactors = await this.identifySuccessFactors(userId, goals, tasks, habits);
      if (successFactors) insights.push(successFactors);

      // Store insights in database
      for (const insight of insights) {
        await storage.createMlInsight(insight);
      }

      return insights;
    } catch (error) {
      console.error("Error generating ML insights:", error);
      return [];
    }
  }

  // Predict goal completion likelihood using AI
  private async predictGoalCompletion(userId: string, goals: any[], tasks: any[], progressEntries: any[]): Promise<MlInsight | null> {
    try {
      const activeGoals = goals.filter(g => g.status === 'active');
      if (activeGoals.length === 0) return null;

      const analysisData = {
        totalGoals: goals.length,
        activeGoals: activeGoals.length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        avgProgress: activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        recentProgress: progressEntries.filter(p => 
          new Date(p.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length
      };

      const prompt = `Analyze the following goal achievement data and provide insights:

User Data:
- Total Goals: ${analysisData.totalGoals}
- Active Goals: ${analysisData.activeGoals} 
- Completed Goals: ${analysisData.completedGoals}
- Average Progress: ${analysisData.avgProgress.toFixed(1)}%
- Total Tasks: ${analysisData.totalTasks}
- Completed Tasks: ${analysisData.completedTasks}
- Recent Progress Entries: ${analysisData.recentProgress}

Provide a JSON response with:
1. completion_likelihood (0-100): Likelihood of completing current goals
2. confidence (0-100): Confidence in this prediction
3. key_factors: Array of factors affecting completion
4. recommendations: Array of specific actionable recommendations
5. risk_areas: Areas where the user might struggle

Focus on data-driven insights and practical recommendations.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const aiAnalysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        userId,
        insightType: 'completion_prediction',
        title: `Goal Completion Forecast: ${aiAnalysis.completion_likelihood}% Success Rate`,
        description: `Based on your current progress patterns, you have a ${aiAnalysis.completion_likelihood}% likelihood of completing your active goals on time.`,
        confidence: aiAnalysis.confidence || 75,
        priority: aiAnalysis.completion_likelihood < 60 ? 'high' : aiAnalysis.completion_likelihood < 80 ? 'medium' : 'low',
        actionItems: aiAnalysis.recommendations || [],
        data: {
          prediction: aiAnalysis.completion_likelihood,
          keyFactors: aiAnalysis.key_factors || [],
          riskAreas: aiAnalysis.risk_areas || [],
          analysisData
        }
      };
    } catch (error) {
      console.error("Error in goal completion prediction:", error);
      return null;
    }
  }

  // Analyze user productivity patterns
  private async analyzeProductivityPatterns(userId: string, events: any[], progressEntries: any[]): Promise<MlInsight | null> {
    try {
      if (events.length < 10) return null; // Need sufficient data

      // Group events by hour and day of week
      const hourlyActivity = new Array(24).fill(0);
      const dailyActivity = new Array(7).fill(0);
      const weeklyProgress = {};

      events.forEach(event => {
        const date = new Date(event.timestamp);
        hourlyActivity[date.getHours()]++;
        dailyActivity[date.getDay()]++;
        
        const week = this.getWeekKey(date);
        weeklyProgress[week] = (weeklyProgress[week] || 0) + 1;
      });

      // Find peak productivity hours
      const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
      const peakDay = dailyActivity.indexOf(Math.max(...dailyActivity));
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      // Calculate productivity score
      const recentWeeks = Object.keys(weeklyProgress).slice(-4);
      const weeklyTrend = recentWeeks.map(week => weeklyProgress[week] || 0);
      const trendDirection = weeklyTrend.length >= 2 ? 
        (weeklyTrend[weeklyTrend.length - 1] > weeklyTrend[0] ? 'increasing' : 'decreasing') : 'stable';

      return {
        userId,
        insightType: 'productivity_pattern',
        title: `Peak Productivity: ${peakHour}:00 on ${dayNames[peakDay]}s`,
        description: `Your most productive time is ${peakHour}:00 on ${dayNames[peakDay]}s. Your activity trend is ${trendDirection} over the past month.`,
        confidence: 85,
        priority: 'medium',
        actionItems: [
          `Schedule important tasks around ${peakHour}:00 when you're most active`,
          `Block ${dayNames[peakDay]} mornings for high-priority goal work`,
          `${trendDirection === 'decreasing' ? 'Consider adjusting your schedule to boost productivity' : 'Keep up the great momentum!'}`
        ],
        data: {
          peakHour,
          peakDay: dayNames[peakDay],
          hourlyPattern: hourlyActivity,
          weeklyTrend: weeklyTrend,
          trendDirection
        }
      };
    } catch (error) {
      console.error("Error analyzing productivity patterns:", error);
      return null;
    }
  }

  // Analyze task completion velocity
  private async analyzeTaskVelocity(userId: string, tasks: any[], events: any[]): Promise<MlInsight | null> {
    try {
      const completedTasks = tasks.filter(t => t.completed);
      if (completedTasks.length < 5) return null;

      // Calculate completion velocity (tasks per week)
      const completionEvents = events.filter(e => e.eventType === 'task_completed');
      const recentCompletions = completionEvents.filter(e => 
        new Date(e.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );

      const velocityPerWeek = (recentCompletions.length / 4).toFixed(1);
      const totalVelocity = (completedTasks.length / (Date.now() - new Date(tasks[0]?.createdAt || Date.now()).getTime()) * 7 * 24 * 60 * 60 * 1000).toFixed(1);

      // Estimate time to goal completion
      const activeTasks = tasks.filter(t => !t.completed);
      const estimatedWeeksToCompletion = activeTasks.length / parseFloat(velocityPerWeek);

      let priority = 'medium';
      let recommendations = [];

      if (parseFloat(velocityPerWeek) < 2) {
        priority = 'high';
        recommendations = [
          'Your task completion rate is below optimal. Consider breaking larger tasks into smaller ones.',
          'Set daily task completion goals to improve velocity.',
          'Review and remove any blocked or unnecessary tasks.'
        ];
      } else if (parseFloat(velocityPerWeek) > 5) {
        recommendations = [
          'Excellent task completion velocity! Consider taking on more challenging goals.',
          'Maintain your momentum by celebrating small wins.',
          'Share your productivity techniques with others.'
        ];
      } else {
        recommendations = [
          'Good task completion pace. Consider optimizing your workflow.',
          'Track time spent on tasks to identify efficiency improvements.',
          'Batch similar tasks together for better focus.'
        ];
      }

      return {
        userId,
        insightType: 'task_velocity',
        title: `Task Velocity: ${velocityPerWeek} tasks/week`,
        description: `You complete an average of ${velocityPerWeek} tasks per week. At this pace, you'll finish your current tasks in ${estimatedWeeksToCompletion.toFixed(1)} weeks.`,
        confidence: 80,
        priority,
        actionItems: recommendations,
        data: {
          currentVelocity: parseFloat(velocityPerWeek),
          totalCompletedTasks: completedTasks.length,
          activeTasks: activeTasks.length,
          estimatedCompletion: estimatedWeeksToCompletion
        }
      };
    } catch (error) {
      console.error("Error analyzing task velocity:", error);
      return null;
    }
  }

  // Analyze habit consistency
  private async analyzeHabitConsistency(userId: string, habits: any[]): Promise<MlInsight | null> {
    try {
      if (habits.length === 0) return null;

      // Get habit entries for analysis
      const habitEntries = await storage.getHabitEntriesByUserId(userId);
      const consistencyScores = habits.map(habit => {
        const entries = habitEntries.filter(e => e.habitId === habit.id);
        const recentEntries = entries.filter(e => 
          new Date(e.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );
        const completionRate = recentEntries.length > 0 ? 
          recentEntries.filter(e => e.completed).length / recentEntries.length : 0;
        
        return {
          habit: habit.name,
          completionRate: completionRate * 100,
          streak: habit.currentStreak || 0
        };
      });

      const avgConsistency = consistencyScores.reduce((sum, h) => sum + h.completionRate, 0) / consistencyScores.length;
      const strongHabits = consistencyScores.filter(h => h.completionRate > 80);
      const weakHabits = consistencyScores.filter(h => h.completionRate < 50);

      let title = `Habit Consistency: ${avgConsistency.toFixed(0)}% Average`;
      let description = `Your overall habit consistency is ${avgConsistency.toFixed(0)}%. `;
      let priority = 'medium';
      let recommendations = [];

      if (avgConsistency > 80) {
        description += "Excellent consistency across your habits!";
        recommendations = [
          'Outstanding habit consistency! Consider adding new challenging habits.',
          'Share your success strategies with others.',
          'Use your strong habits as anchors for new ones.'
        ];
      } else if (avgConsistency < 50) {
        priority = 'high';
        description += "There's room for improvement in your habit consistency.";
        recommendations = [
          'Focus on building one habit at a time to improve consistency.',
          'Set up environmental cues to trigger habit execution.',
          'Start with smaller, easier versions of your habits.',
          'Track your habits daily to maintain awareness.'
        ];
      } else {
        recommendations = [
          'Good habit consistency overall. Focus on strengthening weaker habits.',
          'Consider habit stacking - linking new habits to existing strong ones.',
          'Review and adjust habits that consistently fall below 70%.'
        ];
      }

      return {
        userId,
        insightType: 'habit_consistency',
        title,
        description,
        confidence: 90,
        priority,
        actionItems: recommendations,
        data: {
          averageConsistency: avgConsistency,
          habitScores: consistencyScores,
          strongHabits: strongHabits.length,
          weakHabits: weakHabits.length
        }
      };
    } catch (error) {
      console.error("Error analyzing habit consistency:", error);
      return null;
    }
  }

  // Identify success factors using AI analysis
  private async identifySuccessFactors(userId: string, goals: any[], tasks: any[], habits: any[]): Promise<MlInsight | null> {
    try {
      const completedGoals = goals.filter(g => g.status === 'completed');
      if (completedGoals.length < 2) return null;

      const successData = {
        completedGoals: completedGoals.length,
        totalGoals: goals.length,
        completionRate: (completedGoals.length / goals.length * 100).toFixed(1),
        avgTimeToComplete: this.calculateAvgCompletionTime(completedGoals),
        topCategories: this.getTopCategories(completedGoals),
        taskCompletionRate: tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length * 100).toFixed(1) : 0,
        activeHabits: habits.length
      };

      const prompt = `Analyze this user's goal achievement data to identify success factors:

Success Metrics:
- Goal Completion Rate: ${successData.completionRate}%
- Completed Goals: ${successData.completedGoals}
- Task Completion Rate: ${successData.taskCompletionRate}%
- Active Habits: ${successData.activeHabits}
- Top Goal Categories: ${successData.topCategories.join(', ')}

Provide a JSON response with:
1. key_success_factors: Top 3-5 factors contributing to success
2. strengths: User's main strengths in goal achievement
3. optimization_areas: Areas for improvement
4. strategic_recommendations: High-level strategic advice
5. confidence: Confidence in this analysis (0-100)

Focus on actionable insights based on the data patterns.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        userId,
        insightType: 'success_factors',
        title: `Success Analysis: ${successData.completionRate}% Goal Completion Rate`,
        description: `Analysis of your ${completedGoals.length} completed goals reveals key patterns for continued success.`,
        confidence: analysis.confidence || 85,
        priority: 'medium',
        actionItems: analysis.strategic_recommendations || [],
        data: {
          successFactors: analysis.key_success_factors || [],
          strengths: analysis.strengths || [],
          optimizationAreas: analysis.optimization_areas || [],
          metrics: successData
        }
      };
    } catch (error) {
      console.error("Error identifying success factors:", error);
      return null;
    }
  }

  // Helper methods
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  }

  private calculateAvgCompletionTime(completedGoals: any[]): number {
    const times = completedGoals
      .filter(g => g.completedAt && g.createdAt)
      .map(g => new Date(g.completedAt).getTime() - new Date(g.createdAt).getTime());
    
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length / (24 * 60 * 60 * 1000) : 0;
  }

  private getTopCategories(goals: any[]): string[] {
    const categoryCounts = {};
    goals.forEach(goal => {
      const category = goal.categoryId || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  }

  // Generate personalized recommendations
  async generateRecommendations(userId: string): Promise<string[]> {
    try {
      const insights = await storage.getMlInsightsByUserId(userId);
      const highPriorityInsights = insights.filter(i => i.priority === 'high' && i.isActive);
      
      if (highPriorityInsights.length === 0) {
        return [
          "Keep up the great work on your goals!",
          "Consider setting a new challenging goal to maintain momentum.",
          "Review your completed goals to identify successful patterns."
        ];
      }

      const recommendations = [];
      highPriorityInsights.forEach(insight => {
        if (insight.actionItems && Array.isArray(insight.actionItems)) {
          recommendations.push(...insight.actionItems.slice(0, 2)); // Top 2 from each insight
        }
      });

      return recommendations.slice(0, 5); // Return top 5 recommendations
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return [];
    }
  }
}

export const mlAnalytics = new MLAnalyticsService();