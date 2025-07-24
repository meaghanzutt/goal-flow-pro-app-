import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  currentStep: integer("current_step").notNull().default(1),
  // Calendar integration settings
  calendarSettings: jsonb("calendar_settings"), // Store calendar preferences and sync settings
  // Subscription fields
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"), // free, active, canceled, past_due
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  text: text("text").notNull(),
  categoryId: integer("category_id").notNull(),
  isPromoted: boolean("is_promoted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  ideaId: integer("idea_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull(),
  priority: text("priority").notNull(), // high, medium, low
  // SMART criteria
  specific: text("specific").notNull(),
  measurable: text("measurable").notNull(),
  achievable: text("achievable").notNull(),
  relevant: text("relevant").notNull(),
  timebound: text("timebound").notNull(),
  deadline: timestamp("deadline").notNull(),
  status: text("status").notNull().default("active"), // active, completed, paused
  progress: integer("progress").notNull().default(0), // 0-100
  // Calendar integration
  calendarEventId: text("calendar_event_id"), // External calendar event ID
  calendarProvider: text("calendar_provider"), // google, outlook, apple, etc.
  syncEnabled: boolean("sync_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull(), // high, medium, low
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  deadline: timestamp("deadline"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  dependencies: text("dependencies").array(),
  // Calendar and productivity tool integration
  calendarEventId: text("calendar_event_id"), // External calendar event ID
  calendarProvider: text("calendar_provider"), // google, outlook, apple, etc.
  externalTaskId: text("external_task_id"), // Todoist, Asana, Trello, etc.
  externalProvider: text("external_provider"), // todoist, asana, trello, etc.
  syncEnabled: boolean("sync_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const progressEntries = pgTable("progress_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  goalId: integer("goal_id").notNull(),
  date: timestamp("date").notNull(),
  progressPercent: integer("progress_percent").notNull(),
  mood: integer("mood"), // 1-10 scale
  notes: text("notes"),
  hoursWorked: integer("hours_worked"),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  goalId: integer("goal_id").notNull(),
  name: text("name").notNull(),
  frequency: text("frequency").notNull(), // daily, weekly, monthly
  target: integer("target").notNull(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const habitEntries = pgTable("habit_entries", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull(),
  date: timestamp("date").notNull(),
  completed: boolean("completed").notNull(),
  value: integer("value"), // for quantifiable habits
});

export const collaborations = pgTable("collaborations", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull(), // owner, collaborator, viewer
  canEdit: boolean("can_edit").notNull().default(false),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // goal_completed, streak, milestone, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  goalId: integer("goal_id").notNull(),
  quarter: text("quarter").notNull(), // Q1-2024, Q2-2024, etc.
  rating: integer("rating").notNull(), // 1-5 scale
  whatWorked: text("what_worked"),
  whatDidntWork: text("what_didnt_work"),
  keyLearnings: text("key_learnings"),
  improvements: text("improvements"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// External integrations table for managing connections to calendars and productivity tools
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  provider: text("provider").notNull(), // google_calendar, outlook, apple_calendar, todoist, asana, trello, notion, etc.
  providerType: text("provider_type").notNull(), // calendar, task_manager, note_taking
  accessToken: text("access_token"), // Encrypted access token
  refreshToken: text("refresh_token"), // Encrypted refresh token
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  settings: jsonb("settings"), // Provider-specific settings and preferences
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sync events table for tracking synchronization history
export const syncEvents = pgTable("sync_events", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").notNull(),
  eventType: text("event_type").notNull(), // create, update, delete, sync
  resourceType: text("resource_type").notNull(), // goal, task, event
  resourceId: integer("resource_id").notNull(),
  externalId: text("external_id"), // ID in the external system
  status: text("status").notNull(), // success, failed, pending
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Additional sync details
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Analytics and ML Insights Tables
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  eventType: text("event_type").notNull(), // goal_created, task_completed, progress_updated, habit_completed, etc.
  entityId: integer("entity_id"), // ID of goal, task, etc.
  entityType: text("entity_type"), // goal, task, habit, etc.
  metadata: jsonb("metadata"), // Additional event data
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const mlInsights = pgTable("ml_insights", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  insightType: text("insight_type").notNull(), // completion_prediction, pattern_analysis, recommendation, productivity_trend, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  actionItems: jsonb("action_items"), // Array of suggested actions
  data: jsonb("data"), // Supporting data/charts/metrics
  priority: text("priority").notNull().default("medium"), // high, medium, low
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration date
});

export const userPatterns = pgTable("user_patterns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  patternType: text("pattern_type").notNull(), // productivity_hours, goal_completion_rate, task_velocity, etc.
  patternData: jsonb("pattern_data").notNull(), // Pattern analysis results
  confidence: integer("confidence").notNull(), // 0-100
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const predictionModels = pgTable("prediction_models", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  modelType: text("model_type").notNull(), // goal_completion, task_duration, productivity_score, etc.
  modelData: jsonb("model_data").notNull(), // Model parameters and weights
  accuracy: integer("accuracy").notNull(), // 0-100
  lastTrained: timestamp("last_trained").notNull().defaultNow(),
  predictions: jsonb("predictions"), // Recent predictions made by this model
});

// Fitness Plans
export const fitnessPlans = pgTable("fitness_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  goalId: integer("goal_id").references(() => goals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  fitnessLevel: text("fitness_level").notNull(), // beginner, intermediate, advanced
  duration: integer("duration"), // weeks
  workoutsPerWeek: integer("workouts_per_week"),
  exercises: jsonb("exercises"), // JSON array of exercises with sets, reps, etc.
  nutritionGuidelines: text("nutrition_guidelines"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grocery Shopping Lists
export const groceryLists = pgTable("grocery_lists", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  goalId: integer("goal_id").references(() => goals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"), // health, fitness, general, meal_prep
  items: jsonb("items"), // JSON array of grocery items with quantities, prices
  isCompleted: boolean("is_completed").default(false),
  totalEstimatedCost: integer("total_estimated_cost"), // in cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Journal Entries
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  goalId: integer("goal_id").references(() => goals.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull(),
  aiPrompt: text("ai_prompt"), // The AI-suggested topic
  mood: text("mood"), // happy, neutral, stressed, motivated, anxious, excited
  tags: text("tags").array(),
  isPrivate: boolean("is_private").default(true),
  wordCount: integer("word_count"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Core Values
export const coreValues = pgTable("core_values", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  value: text("value").notNull(),
  description: text("description"),
  importance: integer("importance"), // 1-10 scale
  examples: text("examples").array(), // How this value shows up in life
  relatedGoals: integer("related_goals").array(), // Goal IDs
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertIdeaSchema = createInsertSchema(ideas).omit({
  id: true,
  createdAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertProgressEntrySchema = createInsertSchema(progressEntries).omit({
  id: true,
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
});

export const insertHabitEntrySchema = createInsertSchema(habitEntries).omit({
  id: true,
});

export const insertCollaborationSchema = createInsertSchema(collaborations).omit({
  id: true,
  invitedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSyncEventSchema = createInsertSchema(syncEvents).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  timestamp: true,
});

export const insertMlInsightSchema = createInsertSchema(mlInsights).omit({
  id: true,
  createdAt: true,
});

export const insertUserPatternSchema = createInsertSchema(userPatterns).omit({
  id: true,
  lastUpdated: true,
});

export const insertPredictionModelSchema = createInsertSchema(predictionModels).omit({
  id: true,
  lastTrained: true,
});

// Types for Replit Auth
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Idea = typeof ideas.$inferSelect;
export type InsertIdea = z.infer<typeof insertIdeaSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type ProgressEntry = typeof progressEntries.$inferSelect;
export type InsertProgressEntry = z.infer<typeof insertProgressEntrySchema>;

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;

export type HabitEntry = typeof habitEntries.$inferSelect;
export type InsertHabitEntry = z.infer<typeof insertHabitEntrySchema>;

export type Collaboration = typeof collaborations.$inferSelect;
export type InsertCollaboration = z.infer<typeof insertCollaborationSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;

export type SyncEvent = typeof syncEvents.$inferSelect;
export type InsertSyncEvent = z.infer<typeof insertSyncEventSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type MlInsight = typeof mlInsights.$inferSelect;
export type InsertMlInsight = z.infer<typeof insertMlInsightSchema>;

export type UserPattern = typeof userPatterns.$inferSelect;
export type InsertUserPattern = z.infer<typeof insertUserPatternSchema>;

export type PredictionModel = typeof predictionModels.$inferSelect;
export type InsertPredictionModel = z.infer<typeof insertPredictionModelSchema>;

export const insertFitnessPlanSchema = createInsertSchema(fitnessPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroceryListSchema = createInsertSchema(groceryLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCoreValueSchema = createInsertSchema(coreValues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type FitnessPlan = typeof fitnessPlans.$inferSelect;
export type InsertFitnessPlan = z.infer<typeof insertFitnessPlanSchema>;

export type GroceryList = typeof groceryLists.$inferSelect;
export type InsertGroceryList = z.infer<typeof insertGroceryListSchema>;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

export type CoreValue = typeof coreValues.$inferSelect;
export type InsertCoreValue = z.infer<typeof insertCoreValueSchema>;
