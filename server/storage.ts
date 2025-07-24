import {
  users, categories, ideas, goals, tasks, progressEntries, habits, habitEntries,
  collaborations, achievements, reviews, integrations, syncEvents,
  analyticsEvents, mlInsights, userPatterns, predictionModels,
  fitnessPlans, groceryLists, journalEntries, coreValues,
  type User, type UpsertUser, type InsertUser, type Category, type InsertCategory,
  type Idea, type InsertIdea, type Goal, type InsertGoal, type Task, type InsertTask,
  type ProgressEntry, type InsertProgressEntry, type Habit, type InsertHabit,
  type HabitEntry, type InsertHabitEntry, type Collaboration, type InsertCollaboration,
  type Achievement, type InsertAchievement, type Review, type InsertReview,
  type Integration, type InsertIntegration, type SyncEvent, type InsertSyncEvent,
  type AnalyticsEvent, type InsertAnalyticsEvent, type MlInsight, type InsertMlInsight,
  type UserPattern, type InsertUserPattern, type PredictionModel, type InsertPredictionModel,
  type FitnessPlan, type InsertFitnessPlan, type GroceryList, type InsertGroceryList,
  type JournalEntry, type InsertJournalEntry, type CoreValue, type InsertCoreValue
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStep(userId: string, step: number): Promise<User | undefined>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined>;
  updateSubscriptionStatus(userId: string, status: string, endsAt?: Date): Promise<User | undefined>;

  // Categories
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Ideas
  getIdeasByUser(userId: string): Promise<Idea[]>;
  createIdea(idea: InsertIdea): Promise<Idea>;
  updateIdea(id: number, updates: Partial<Idea>): Promise<Idea | undefined>;
  deleteIdea(id: number): Promise<boolean>;

  // Goals
  getGoalsByUser(userId: string): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;

  // Tasks
  getTasksByGoal(goalId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Progress Entries
  getProgressByGoal(goalId: number): Promise<ProgressEntry[]>;
  getProgressByUser(userId: string): Promise<ProgressEntry[]>;
  createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry>;

  // Habits
  getHabitsByUser(userId: string): Promise<Habit[]>;
  getHabitsByGoal(goalId: number): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: number, updates: Partial<Habit>): Promise<Habit | undefined>;

  // Habit Entries
  getHabitEntriesByHabit(habitId: number): Promise<HabitEntry[]>;
  createHabitEntry(entry: InsertHabitEntry): Promise<HabitEntry>;

  // Collaborations
  getCollaborationsByGoal(goalId: number): Promise<Collaboration[]>;
  getCollaborationsByUser(userId: string): Promise<Collaboration[]>;
  createCollaboration(collaboration: InsertCollaboration): Promise<Collaboration>;

  // Achievements
  getAchievementsByUser(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;

  // Reviews
  getReviewsByUser(userId: string): Promise<Review[]>;
  getReviewsByGoal(goalId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Integrations
  getIntegrationsByUser(userId: string): Promise<Integration[]>;
  getIntegration(id: number): Promise<Integration | undefined>;
  getIntegrationByProvider(userId: string, provider: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration | undefined>;
  deleteIntegration(id: number): Promise<boolean>;

  // Sync Events
  getSyncEventsByIntegration(integrationId: number): Promise<SyncEvent[]>;
  createSyncEvent(event: InsertSyncEvent): Promise<SyncEvent>;

  // Analytics Events
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsEventsByUserId(userId: string): Promise<AnalyticsEvent[]>;
  getAnalyticsEventsByType(userId: string, eventType: string): Promise<AnalyticsEvent[]>;

  // ML Insights
  createMlInsight(insight: InsertMlInsight): Promise<MlInsight>;
  getMlInsightsByUserId(userId: string): Promise<MlInsight[]>;
  getMlInsightsByType(userId: string, insightType: string): Promise<MlInsight[]>;
  updateMlInsight(id: number, updates: Partial<MlInsight>): Promise<MlInsight | undefined>;

  // User Patterns
  createUserPattern(pattern: InsertUserPattern): Promise<UserPattern>;
  getUserPatternsByUserId(userId: string): Promise<UserPattern[]>;
  getUserPatternByType(userId: string, patternType: string): Promise<UserPattern | undefined>;
  updateUserPattern(id: number, updates: Partial<UserPattern>): Promise<UserPattern | undefined>;

  // Prediction Models
  createPredictionModel(model: InsertPredictionModel): Promise<PredictionModel>;
  getPredictionModelsByUserId(userId: string): Promise<PredictionModel[]>;
  getPredictionModelByType(userId: string, modelType: string): Promise<PredictionModel | undefined>;
  updatePredictionModel(id: number, updates: Partial<PredictionModel>): Promise<PredictionModel | undefined>;

  // Analytics helper methods
  getGoalsByUserId(userId: string): Promise<Goal[]>;
  getTasksByUserId(userId: string): Promise<Task[]>;
  getProgressEntriesByUserId(userId: string): Promise<ProgressEntry[]>;
  getHabitsByUserId(userId: string): Promise<Habit[]>;
  getHabitEntriesByUserId(userId: string): Promise<HabitEntry[]>;

  // Fitness Plans
  getFitnessPlansByUser(userId: string): Promise<FitnessPlan[]>;
  getFitnessPlan(id: number): Promise<FitnessPlan | undefined>;
  createFitnessPlan(plan: InsertFitnessPlan): Promise<FitnessPlan>;
  updateFitnessPlan(id: number, updates: Partial<FitnessPlan>): Promise<FitnessPlan | undefined>;
  deleteFitnessPlan(id: number): Promise<boolean>;

  // Grocery Lists
  getGroceryListsByUser(userId: string): Promise<GroceryList[]>;
  getGroceryList(id: number): Promise<GroceryList | undefined>;
  createGroceryList(list: InsertGroceryList): Promise<GroceryList>;
  updateGroceryList(id: number, updates: Partial<GroceryList>): Promise<GroceryList | undefined>;
  deleteGroceryList(id: number): Promise<boolean>;

  // Journal Entries
  getJournalEntriesByUser(userId: string): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: number): Promise<boolean>;

  // Core Values
  getCoreValuesByUser(userId: string): Promise<CoreValue[]>;
  getCoreValue(id: number): Promise<CoreValue | undefined>;
  createCoreValue(value: InsertCoreValue): Promise<CoreValue>;
  updateCoreValue(id: number, updates: Partial<CoreValue>): Promise<CoreValue | undefined>;
  deleteCoreValue(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStep(userId: string, step: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ currentStep: step })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus: 'active',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateSubscriptionStatus(userId: string, status: string, endsAt?: Date): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        subscriptionStatus: status,
        subscriptionEndsAt: endsAt,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Ideas
  async getIdeasByUser(userId: string): Promise<Idea[]> {
    return await db.select().from(ideas).where(eq(ideas.userId, userId));
  }

  async createIdea(idea: InsertIdea): Promise<Idea> {
    const [newIdea] = await db.insert(ideas).values(idea).returning();
    return newIdea;
  }

  async updateIdea(id: number, updates: Partial<Idea>): Promise<Idea | undefined> {
    const [updatedIdea] = await db
      .update(ideas)
      .set(updates)
      .where(eq(ideas.id, id))
      .returning();
    return updatedIdea || undefined;
  }

  async deleteIdea(id: number): Promise<boolean> {
    const result = await db.delete(ideas).where(eq(ideas.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Goals
  async getGoalsByUser(userId: string): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined> {
    const [updatedGoal] = await db
      .update(goals)
      .set(updates)
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal || undefined;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const result = await db.delete(goals).where(eq(goals.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Tasks
  async getTasksByUser(userId: string): Promise<Task[]> {
    return await db
      .select({
        id: tasks.id,
        goalId: tasks.goalId,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        status: tasks.status,
        deadline: tasks.deadline,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        dependencies: tasks.dependencies,
        calendarEventId: tasks.calendarEventId,
        calendarProvider: tasks.calendarProvider,
        externalTaskId: tasks.externalTaskId,
        externalProvider: tasks.externalProvider,
        syncEnabled: tasks.syncEnabled,
        createdAt: tasks.createdAt,
        completedAt: tasks.completedAt,
      })
      .from(tasks)
      .innerJoin(goals, eq(tasks.goalId, goals.id))
      .where(eq(goals.userId, userId));
  }

  async getTasksByGoal(goalId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.goalId, goalId));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Progress Entries
  async getProgressByGoal(goalId: number): Promise<ProgressEntry[]> {
    return await db.select().from(progressEntries).where(eq(progressEntries.goalId, goalId));
  }

  async getProgressByUser(userId: string): Promise<ProgressEntry[]> {
    return await db.select().from(progressEntries).where(eq(progressEntries.userId, userId));
  }

  async createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry> {
    const [newEntry] = await db.insert(progressEntries).values(entry).returning();
    
    // Update goal progress based on latest progress entry
    if (newEntry.goalId && newEntry.progressPercent !== undefined) {
      await db
        .update(goals)
        .set({ progress: newEntry.progressPercent })
        .where(eq(goals.id, newEntry.goalId));
    }
    
    return newEntry;
  }

  // Habits
  async getHabitsByUser(userId: string): Promise<Habit[]> {
    return await db.select().from(habits).where(eq(habits.userId, userId));
  }

  async getHabitsByGoal(goalId: number): Promise<Habit[]> {
    return await db.select().from(habits).where(eq(habits.goalId, goalId));
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db.insert(habits).values(habit).returning();
    return newHabit;
  }

  async updateHabit(id: number, updates: Partial<Habit>): Promise<Habit | undefined> {
    const [updatedHabit] = await db
      .update(habits)
      .set(updates)
      .where(eq(habits.id, id))
      .returning();
    return updatedHabit || undefined;
  }

  // Habit Entries
  async getHabitEntriesByHabit(habitId: number): Promise<HabitEntry[]> {
    return await db.select().from(habitEntries).where(eq(habitEntries.habitId, habitId));
  }

  async createHabitEntry(entry: InsertHabitEntry): Promise<HabitEntry> {
    const [newEntry] = await db.insert(habitEntries).values(entry).returning();
    
    // Update habit streaks when an entry is created
    if (newEntry.completed && newEntry.habitId) {
      await this.updateHabitStreaks(newEntry.habitId);
    }
    
    return newEntry;
  }

  async updateHabitStreaks(habitId: number): Promise<void> {
    // Get all entries for this habit, ordered by date desc
    const entries = await db
      .select()
      .from(habitEntries)
      .where(eq(habitEntries.habitId, habitId))
      .orderBy(desc(habitEntries.date));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate current streak (consecutive days from today backwards)
    for (let i = 0; i < entries.length; i++) {
      const entryDate = new Date(entries[i].date);
      entryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (entryDate.getTime() === expectedDate.getTime() && entries[i].completed) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculate longest streak ever
    for (const entry of entries) {
      if (entry.completed) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    // Update the habit record
    await db
      .update(habits)
      .set({
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak)
      })
      .where(eq(habits.id, habitId));
  }

  // Collaborations
  async getCollaborationsByGoal(goalId: number): Promise<Collaboration[]> {
    return await db.select().from(collaborations).where(eq(collaborations.goalId, goalId));
  }

  async getCollaborationsByUser(userId: string): Promise<Collaboration[]> {
    return await db.select().from(collaborations).where(eq(collaborations.userId, userId));
  }

  async createCollaboration(collaboration: InsertCollaboration): Promise<Collaboration> {
    const [newCollaboration] = await db.insert(collaborations).values(collaboration).returning();
    return newCollaboration;
  }

  // Achievements
  async getAchievementsByUser(userId: string): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  // Reviews
  async getReviewsByUser(userId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.userId, userId));
  }

  async getReviewsByGoal(goalId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.goalId, goalId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  // Integrations
  async getIntegrationsByUser(userId: string): Promise<Integration[]> {
    return await db.select().from(integrations).where(eq(integrations.userId, userId));
  }

  async getIntegration(id: number): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    return integration || undefined;
  }

  async getIntegrationByProvider(userId: string, provider: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider)));
    return integration || undefined;
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [newIntegration] = await db.insert(integrations).values(integration).returning();
    return newIntegration;
  }

  async updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration | undefined> {
    const [updatedIntegration] = await db
      .update(integrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return updatedIntegration || undefined;
  }

  async deleteIntegration(id: number): Promise<boolean> {
    const result = await db.delete(integrations).where(eq(integrations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Sync Events
  async getSyncEventsByIntegration(integrationId: number): Promise<SyncEvent[]> {
    return await db.select().from(syncEvents).where(eq(syncEvents.integrationId, integrationId));
  }

  async createSyncEvent(event: InsertSyncEvent): Promise<SyncEvent> {
    const [newEvent] = await db.insert(syncEvents).values(event).returning();
    return newEvent;
  }

  // Analytics Events Implementation
  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [analyticsEvent] = await db.insert(analyticsEvents).values(event).returning();
    return analyticsEvent;
  }

  async getAnalyticsEventsByUserId(userId: string): Promise<AnalyticsEvent[]> {
    return await db.select().from(analyticsEvents).where(eq(analyticsEvents.userId, userId)).orderBy(desc(analyticsEvents.timestamp));
  }

  async getAnalyticsEventsByType(userId: string, eventType: string): Promise<AnalyticsEvent[]> {
    return await db.select().from(analyticsEvents)
      .where(and(eq(analyticsEvents.userId, userId), eq(analyticsEvents.eventType, eventType)))
      .orderBy(desc(analyticsEvents.timestamp));
  }

  // ML Insights Implementation
  async createMlInsight(insight: InsertMlInsight): Promise<MlInsight> {
    const [mlInsight] = await db.insert(mlInsights).values(insight).returning();
    return mlInsight;
  }

  async getMlInsightsByUserId(userId: string): Promise<MlInsight[]> {
    return await db.select().from(mlInsights)
      .where(and(eq(mlInsights.userId, userId), eq(mlInsights.isActive, true)))
      .orderBy(desc(mlInsights.createdAt));
  }

  async getMlInsightsByType(userId: string, insightType: string): Promise<MlInsight[]> {
    return await db.select().from(mlInsights)
      .where(and(
        eq(mlInsights.userId, userId), 
        eq(mlInsights.insightType, insightType),
        eq(mlInsights.isActive, true)
      ))
      .orderBy(desc(mlInsights.createdAt));
  }

  async updateMlInsight(id: number, updates: Partial<MlInsight>): Promise<MlInsight | undefined> {
    const [updated] = await db.update(mlInsights)
      .set({ ...updates })
      .where(eq(mlInsights.id, id))
      .returning();
    return updated;
  }

  // User Patterns Implementation
  async createUserPattern(pattern: InsertUserPattern): Promise<UserPattern> {
    const [userPattern] = await db.insert(userPatterns).values(pattern).returning();
    return userPattern;
  }

  async getUserPatternsByUserId(userId: string): Promise<UserPattern[]> {
    return await db.select().from(userPatterns)
      .where(eq(userPatterns.userId, userId))
      .orderBy(desc(userPatterns.lastUpdated));
  }

  async getUserPatternByType(userId: string, patternType: string): Promise<UserPattern | undefined> {
    const [pattern] = await db.select().from(userPatterns)
      .where(and(eq(userPatterns.userId, userId), eq(userPatterns.patternType, patternType)));
    return pattern;
  }

  async updateUserPattern(id: number, updates: Partial<UserPattern>): Promise<UserPattern | undefined> {
    const [updated] = await db.update(userPatterns)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(userPatterns.id, id))
      .returning();
    return updated;
  }

  // Prediction Models Implementation
  async createPredictionModel(model: InsertPredictionModel): Promise<PredictionModel> {
    const [predictionModel] = await db.insert(predictionModels).values(model).returning();
    return predictionModel;
  }

  async getPredictionModelsByUserId(userId: string): Promise<PredictionModel[]> {
    return await db.select().from(predictionModels)
      .where(eq(predictionModels.userId, userId))
      .orderBy(desc(predictionModels.lastTrained));
  }

  async getPredictionModelByType(userId: string, modelType: string): Promise<PredictionModel | undefined> {
    const [model] = await db.select().from(predictionModels)
      .where(and(eq(predictionModels.userId, userId), eq(predictionModels.modelType, modelType)));
    return model;
  }

  async updatePredictionModel(id: number, updates: Partial<PredictionModel>): Promise<PredictionModel | undefined> {
    const [updated] = await db.update(predictionModels)
      .set({ ...updates, lastTrained: new Date() })
      .where(eq(predictionModels.id, id))
      .returning();
    return updated;
  }

  // Analytics helper methods
  async getGoalsByUserId(userId: string): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    const userGoals = await this.getGoalsByUserId(userId);
    const goalIds = userGoals.map(g => g.id);
    if (goalIds.length === 0) return [];
    
    return await db.select().from(tasks).where(inArray(tasks.goalId, goalIds));
  }

  async getProgressEntriesByUserId(userId: string): Promise<ProgressEntry[]> {
    const userGoals = await this.getGoalsByUserId(userId);
    const goalIds = userGoals.map(g => g.id);
    if (goalIds.length === 0) return [];
    
    return await db.select().from(progressEntries).where(inArray(progressEntries.goalId, goalIds));
  }

  async getHabitsByUserId(userId: string): Promise<Habit[]> {
    return await db.select().from(habits).where(eq(habits.userId, userId));
  }

  async getHabitEntriesByUserId(userId: string): Promise<HabitEntry[]> {
    const userHabits = await this.getHabitsByUserId(userId);
    const habitIds = userHabits.map(h => h.id);
    if (habitIds.length === 0) return [];
    
    return await db.select().from(habitEntries).where(inArray(habitEntries.habitId, habitIds));
  }

  // Fitness Plans
  async getFitnessPlansByUser(userId: string): Promise<FitnessPlan[]> {
    return await db.select().from(fitnessPlans).where(eq(fitnessPlans.userId, userId)).orderBy(desc(fitnessPlans.createdAt));
  }

  async getFitnessPlan(id: number): Promise<FitnessPlan | undefined> {
    const [plan] = await db.select().from(fitnessPlans).where(eq(fitnessPlans.id, id));
    return plan || undefined;
  }

  async createFitnessPlan(plan: InsertFitnessPlan): Promise<FitnessPlan> {
    const [newPlan] = await db.insert(fitnessPlans).values(plan).returning();
    return newPlan;
  }

  async updateFitnessPlan(id: number, updates: Partial<FitnessPlan>): Promise<FitnessPlan | undefined> {
    const [updatedPlan] = await db.update(fitnessPlans).set({ ...updates, updatedAt: new Date() }).where(eq(fitnessPlans.id, id)).returning();
    return updatedPlan || undefined;
  }

  async deleteFitnessPlan(id: number): Promise<boolean> {
    const result = await db.delete(fitnessPlans).where(eq(fitnessPlans.id, id));
    return result.rowCount > 0;
  }

  // Grocery Lists
  async getGroceryListsByUser(userId: string): Promise<GroceryList[]> {
    return await db.select().from(groceryLists).where(eq(groceryLists.userId, userId)).orderBy(desc(groceryLists.createdAt));
  }

  async getGroceryList(id: number): Promise<GroceryList | undefined> {
    const [list] = await db.select().from(groceryLists).where(eq(groceryLists.id, id));
    return list || undefined;
  }

  async createGroceryList(list: InsertGroceryList): Promise<GroceryList> {
    const [newList] = await db.insert(groceryLists).values(list).returning();
    return newList;
  }

  async updateGroceryList(id: number, updates: Partial<GroceryList>): Promise<GroceryList | undefined> {
    const [updatedList] = await db.update(groceryLists).set({ ...updates, updatedAt: new Date() }).where(eq(groceryLists.id, id)).returning();
    return updatedList || undefined;
  }

  async deleteGroceryList(id: number): Promise<boolean> {
    const result = await db.delete(groceryLists).where(eq(groceryLists.id, id));
    return result.rowCount > 0;
  }

  // Journal Entries
  async getJournalEntriesByUser(userId: string): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.createdAt));
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return entry || undefined;
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [newEntry] = await db.insert(journalEntries).values(entry).returning();
    return newEntry;
  }

  async updateJournalEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const [updatedEntry] = await db.update(journalEntries).set({ ...updates, updatedAt: new Date() }).where(eq(journalEntries.id, id)).returning();
    return updatedEntry || undefined;
  }

  async deleteJournalEntry(id: number): Promise<boolean> {
    const result = await db.delete(journalEntries).where(eq(journalEntries.id, id));
    return result.rowCount > 0;
  }

  // Core Values
  async getCoreValuesByUser(userId: string): Promise<CoreValue[]> {
    return await db.select().from(coreValues).where(eq(coreValues.userId, userId)).orderBy(desc(coreValues.createdAt));
  }

  async getCoreValue(id: number): Promise<CoreValue | undefined> {
    const [value] = await db.select().from(coreValues).where(eq(coreValues.id, id));
    return value || undefined;
  }

  async createCoreValue(value: InsertCoreValue): Promise<CoreValue> {
    const [newValue] = await db.insert(coreValues).values(value).returning();
    return newValue;
  }

  async updateCoreValue(id: number, updates: Partial<CoreValue>): Promise<CoreValue | undefined> {
    const [updatedValue] = await db.update(coreValues).set({ ...updates, updatedAt: new Date() }).where(eq(coreValues.id, id)).returning();
    return updatedValue || undefined;
  }

  async deleteCoreValue(id: number): Promise<boolean> {
    const result = await db.delete(coreValues).where(eq(coreValues.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();