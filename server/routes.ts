import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateMotivationalQuote, generateGoalSuggestions, generateProgressInsight, generateTaskSuggestions } from "./openai";
import { CalendarService } from "./calendarService";
import { handleStripeWebhook } from "./webhooks";
import Stripe from "stripe";
import { 
  insertIdeaSchema, insertGoalSchema, insertTaskSchema,
  insertProgressEntrySchema, insertHabitSchema, insertHabitEntrySchema,
  insertAchievementSchema, insertReviewSchema, insertCategorySchema,
  insertIntegrationSchema, insertFitnessPlanSchema, insertGroceryListSchema,
  insertJournalEntrySchema, insertCoreValueSchema
} from "@shared/schema";
import { generateJournalPrompts, generateCoreValuesExercise, generateFitnessRecommendations, generateWellnessSuggestions } from "./openai-wellness";

// Make Stripe optional during startup to prevent crash loops
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/auth/step', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { step } = req.body;
      
      if (typeof step !== 'number' || step < 1 || step > 6) {
        return res.status(400).json({ message: "Invalid step number" });
      }
      
      const updatedUser = await storage.updateUserStep(userId, step);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user step:", error);
      res.status(500).json({ message: "Failed to update step" });
    }
  });

  // Stripe Subscription Routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      // Check if Stripe is configured
      if (!stripe) {
        return res.status(503).json({ 
          error: 'Stripe integration not configured',
          message: 'STRIPE_SECRET_KEY environment variable is required'
        });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has premium status
      if (user.subscriptionStatus === 'active') {
        // User already has active subscription, create a new payment intent for renewal
        const renewalIntent = await stripe.paymentIntents.create({
          amount: 2900,
          currency: 'usd',
          customer: user.stripeCustomerId || undefined,
          description: 'Goal Flow Pro Premium - Subscription Renewal',
          metadata: {
            userId: userId,
            type: 'subscription_renewal'
          }
        });
        
        return res.json({
          subscriptionId: renewalIntent.id,
          clientSecret: renewalIntent.client_secret,
          status: 'active'
        });
      }

      if (!user.email) {
        return res.status(400).json({ message: 'User email is required for subscription' });
      }

      let customerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          metadata: {
            userId: userId
          }
        });
        customerId = customer.id;
      }

      // Create subscription using payment intents for one-time setup
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 2900, // $29.00 in cents
        currency: 'usd',
        customer: customerId,
        setup_future_usage: 'off_session',
        description: 'Goal Flow Pro Premium Subscription - First Month',
        metadata: {
          userId: userId,
          type: 'subscription_setup'
        }
      });

      // Update user with Stripe info (using payment intent ID as subscription placeholder)
      await storage.updateUserStripeInfo(userId, customerId, paymentIntent.id);

      res.json({
        subscriptionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      });

    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/subscription-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.json({ status: 'free' });
      }

      // Return the stored subscription status
      const status = user.subscriptionStatus || 'free';
      
      res.json({
        status: status,
        currentPeriodEnd: user.subscriptionEndsAt ? Math.floor(user.subscriptionEndsAt.getTime() / 1000) : null,
        cancelAtPeriodEnd: false
      });

    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ message: 'Failed to get subscription status' });
    }
  });

  app.post('/api/cancel-subscription', isAuthenticated, async (req: any, res) => {
    try {
      // Check if Stripe is configured
      if (!stripe) {
        return res.status(503).json({ 
          error: 'Stripe integration not configured',
          message: 'STRIPE_SECRET_KEY environment variable is required'
        });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      await storage.updateSubscriptionStatus(userId, 'cancel_at_period_end');

      res.json({ message: 'Subscription will be canceled at the end of the current period' });

    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  });

  // Stripe Webhook
  app.post('/api/stripe-webhook', handleStripeWebhook);

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      let categories = await storage.getAllCategories();
      
      // Seed default categories if none exist
      if (categories.length === 0) {
        const defaultCategories = [
          { name: "Health & Fitness", icon: "💪", color: "#10b981" },
          { name: "Career & Education", icon: "🎯", color: "#3b82f6" },
          { name: "Personal Development", icon: "🌱", color: "#8b5cf6" },
          { name: "Relationships", icon: "❤️", color: "#ef4444" },
          { name: "Finance", icon: "💰", color: "#f59e0b" },
          { name: "Hobbies & Creativity", icon: "🎨", color: "#ec4899" },
        ];

        for (const category of defaultCategories) {
          await storage.createCategory(category);
        }
        
        categories = await storage.getAllCategories();
      }
      
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  // Ideas  
  app.get("/api/ideas", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ideas = await storage.getIdeasByUser(userId);
      res.json(ideas);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/ideas", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ideaData = insertIdeaSchema.parse({ ...req.body, userId });
      const idea = await storage.createIdea(ideaData);
      res.status(201).json(idea);
    } catch (error) {
      res.status(400).json({ message: "Invalid idea data" });
    }
  });

  app.patch("/api/ideas/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const idea = await storage.updateIdea(id, req.body);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      res.json(idea);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/ideas/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteIdea(id);
      if (!deleted) {
        return res.status(404).json({ message: "Idea not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Goals
  app.get("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getGoalsByUser(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const goal = await storage.getGoal(id);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("=== SERVER GOAL CREATION ===");
      console.log("User ID:", userId);
      console.log("Request body:", req.body);
      
      // Convert deadline string back to Date object if needed
      const bodyWithDate = {
        ...req.body,
        deadline: req.body.deadline ? new Date(req.body.deadline) : new Date(),
        userId
      };
      const goalData = insertGoalSchema.parse(bodyWithDate);
      console.log("Parsed goal data:", goalData);
      
      const goal = await storage.createGoal(goalData);
      console.log("Created goal:", goal);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Goal creation server error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (error && typeof error === 'object' && 'issues' in error) {
        console.error("Validation issues:", (error as any).issues);
      }
      res.status(400).json({ message: "Invalid goal data", error: errorMessage });
    }
  });

  app.patch("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const goal = await storage.updateGoal(id, req.body);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGoal(id);
      if (!deleted) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tasks
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getTasksByUser(userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/goals/:goalId/tasks", isAuthenticated, async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const tasks = await storage.getTasksByGoal(goalId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.updateTask(id, req.body);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTask(id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Progress Entries
  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getProgressByUser(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/goals/:goalId/progress", isAuthenticated, async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const progress = await storage.getProgressByGoal(goalId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Progress endpoint - raw request body:", req.body);
      console.log("Progress endpoint - userId:", userId);
      
      // Transform dateString to date if present
      const { dateString, ...rest } = req.body;
      const transformedData = {
        ...rest,
        userId,
        date: dateString ? new Date(dateString) : new Date()
      };
      
      console.log("Progress endpoint - transformed data:", transformedData);
      const progressData = insertProgressEntrySchema.parse(transformedData);
      console.log("Progress endpoint - parsed data:", progressData);
      
      const entry = await storage.createProgressEntry(progressData);
      console.log("Progress endpoint - created entry:", entry);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Progress endpoint error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (error && typeof error === 'object' && 'issues' in error) {
        console.error("Progress endpoint validation issues:", (error as any).issues);
      }
      res.status(400).json({ message: "Invalid progress data", error: errorMessage });
    }
  });

  // Habits
  app.get("/api/habits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const habits = await storage.getHabitsByUser(userId);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/habits", isAuthenticated, async (req: any, res) => {
    try {
      const requestedUserId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      
      // Only allow users to access their own habits
      if (requestedUserId !== currentUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      console.log("Habits endpoint - fetching habits for userId:", requestedUserId);
      const habits = await storage.getHabitsByUser(requestedUserId);
      console.log("Habits endpoint - found habits:", habits);
      res.json(habits);
    } catch (error) {
      console.error("Habits endpoint error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/habits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const habitData = insertHabitSchema.parse({ ...req.body, userId });
      const habit = await storage.createHabit(habitData);
      res.status(201).json(habit);
    } catch (error) {
      res.status(400).json({ message: "Invalid habit data" });
    }
  });

  app.patch("/api/habits/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const habit = await storage.updateHabit(id, req.body);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      res.json(habit);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Habit Entries
  app.get("/api/habits/:habitId/entries", isAuthenticated, async (req, res) => {
    try {
      const habitId = parseInt(req.params.habitId);
      const entries = await storage.getHabitEntriesByHabit(habitId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/habit-entries", isAuthenticated, async (req, res) => {
    try {
      console.log("Habit entry endpoint - raw request body:", req.body);
      
      // Transform ISO string to Date object if needed
      const transformedData = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : new Date()
      };
      
      console.log("Habit entry endpoint - transformed data:", transformedData);
      const entryData = insertHabitEntrySchema.parse(transformedData);
      console.log("Habit entry endpoint - parsed data:", entryData);
      
      const entry = await storage.createHabitEntry(entryData);
      console.log("Habit entry endpoint - created entry:", entry);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Habit entry endpoint error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (error && typeof error === 'object' && 'issues' in error) {
        console.error("Habit entry endpoint validation issues:", (error as any).issues);
      }
      res.status(400).json({ message: "Invalid habit entry data", error: errorMessage });
    }
  });

  // Achievements
  app.get("/api/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getAchievementsByUser(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievementData = insertAchievementSchema.parse({ ...req.body, userId });
      const achievement = await storage.createAchievement(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      res.status(400).json({ message: "Invalid achievement data" });
    }
  });

  // Reviews
  app.get("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviews = await storage.getReviewsByUser(userId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({ ...req.body, userId });
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  // AI-powered features
  app.get("/api/ai/motivation", async (req, res) => {
    try {
      const { goalTitle } = req.query;
      const quote = await generateMotivationalQuote(goalTitle as string);
      res.json({ quote });
    } catch (error) {
      console.error("Error generating motivational quote:", error);
      res.status(500).json({ message: "Failed to generate motivational quote" });
    }
  });

  app.post("/api/ai/goal-suggestions", async (req, res) => {
    try {
      const { idea } = req.body;
      if (!idea) {
        return res.status(400).json({ message: "Idea is required" });
      }
      const suggestions = await generateGoalSuggestions(idea);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating goal suggestions:", error);
      res.status(500).json({ message: "Failed to generate goal suggestions" });
    }
  });

  // AI task suggestions
  app.post("/api/goals/:goalId/ai-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goalId = parseInt(req.params.goalId);
      
      const goal = await storage.getGoal(goalId);
      if (!goal || goal.userId !== userId) {
        return res.status(404).json({ message: "Goal not found" });
      }

      const suggestions = await generateTaskSuggestions(goal.title, goal.description);
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating task suggestions:", error);
      res.status(500).json({ message: "Failed to generate task suggestions" });
    }
  });

  app.post("/api/ai/progress-insight", async (req, res) => {
    try {
      const { goalTitle, progressPercentage } = req.body;
      if (!goalTitle || typeof progressPercentage !== 'number') {
        return res.status(400).json({ message: "Goal title and progress percentage are required" });
      }
      const insight = await generateProgressInsight(goalTitle, progressPercentage);
      res.json({ insight });
    } catch (error) {
      console.error("Error generating progress insight:", error);
      res.status(500).json({ message: "Failed to generate progress insight" });
    }
  });

  // Integration routes
  app.get("/api/integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const integrations = await storage.getIntegrationsByUser(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post("/api/integrations/connect/:provider", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const provider = req.params.provider;
      
      // Generate OAuth URL for the provider
      const oauthUrl = CalendarService.generateOAuthUrl(provider, userId);
      res.json({ url: oauthUrl });
    } catch (error) {
      console.error("Error generating OAuth URL:", error);
      res.status(500).json({ message: "Failed to generate OAuth URL" });
    }
  });

  app.get("/api/integrations/callback/:provider", async (req, res) => {
    try {
      const provider = req.params.provider;
      const code = req.query.code as string;
      const userId = req.query.state as string; // User ID passed in state parameter
      
      if (!code || !userId) {
        return res.status(400).json({ message: "Missing authorization code or user ID" });
      }

      // Exchange code for tokens
      const tokenData = await CalendarService.exchangeCodeForToken(provider, code);
      
      // Save integration to database
      const integration = await storage.createIntegration({
        userId,
        provider,
        providerType: Object.values(CalendarService.PROVIDERS).includes(provider as any) ? 'calendar' : 'task_manager',
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
        isActive: true,
        settings: {},
      });

      // Redirect back to the app with success
      res.redirect(`/?integration=success&provider=${provider}`);
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.redirect(`/?integration=error&message=${encodeURIComponent(errorMessage)}`);
    }
  });

  app.delete("/api/integrations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteIntegration(id);
      
      if (success) {
        res.json({ message: "Integration deleted successfully" });
      } else {
        res.status(404).json({ message: "Integration not found" });
      }
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });

  app.post("/api/integrations/:id/sync", isAuthenticated, async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const integration = await storage.getIntegration(integrationId);
      
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      // Test connection
      const isConnected = await CalendarService.testConnection(integration);
      
      if (!isConnected) {
        return res.status(400).json({ message: "Integration connection failed" });
      }

      // Update last sync time
      await storage.updateIntegration(integrationId, {
        lastSyncAt: new Date()
      });

      res.json({ message: "Sync completed successfully" });
    } catch (error) {
      console.error("Error syncing integration:", error);
      res.status(500).json({ message: "Failed to sync integration" });
    }
  });

  // Analytics and ML Routes
  app.get("/api/analytics/insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const insights = await storage.getMlInsightsByUserId(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching ML insights:", error);
      res.status(500).json({ message: "Failed to fetch analytics insights" });
    }
  });

  app.post("/api/analytics/generate-insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { mlAnalytics } = await import("./mlAnalytics");
      const insights = await mlAnalytics.generateInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating ML insights:", error);
      res.status(500).json({ message: "Failed to generate analytics insights" });
    }
  });

  app.get("/api/analytics/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { mlAnalytics } = await import("./mlAnalytics");
      const recommendations = await mlAnalytics.generateRecommendations(userId);
      res.json({ recommendations });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.post("/api/analytics/track-event", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventType, entityId, entityType, metadata } = req.body;
      const { mlAnalytics } = await import("./mlAnalytics");
      await mlAnalytics.trackEvent(userId, eventType, entityId, entityType, metadata);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking analytics event:", error);
      res.status(500).json({ message: "Failed to track analytics event" });
    }
  });

  // Fitness Plans routes
  app.get('/api/fitness-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const plans = await storage.getFitnessPlansByUser(userId);
      res.json(plans);
    } catch (error) {
      console.error('Error fetching fitness plans:', error);
      res.status(500).json({ message: 'Failed to fetch fitness plans' });
    }
  });

  app.post('/api/fitness-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const planData = insertFitnessPlanSchema.parse({
        ...req.body,
        userId
      });
      
      const plan = await storage.createFitnessPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      console.error('Error creating fitness plan:', error);
      res.status(500).json({ message: 'Failed to create fitness plan' });
    }
  });

  app.put('/api/fitness-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const existingPlan = await storage.getFitnessPlan(id);
      if (!existingPlan || existingPlan.userId !== userId) {
        return res.status(404).json({ message: 'Fitness plan not found' });
      }
      
      const updatedPlan = await storage.updateFitnessPlan(id, req.body);
      res.json(updatedPlan);
    } catch (error) {
      console.error('Error updating fitness plan:', error);
      res.status(500).json({ message: 'Failed to update fitness plan' });
    }
  });

  app.delete('/api/fitness-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const existingPlan = await storage.getFitnessPlan(id);
      if (!existingPlan || existingPlan.userId !== userId) {
        return res.status(404).json({ message: 'Fitness plan not found' });
      }
      
      await storage.deleteFitnessPlan(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting fitness plan:', error);
      res.status(500).json({ message: 'Failed to delete fitness plan' });
    }
  });

  // AI Fitness recommendations
  app.post('/api/ai/fitness-recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const { fitnessLevel, goals, timeAvailable } = req.body;
      const recommendations = await generateFitnessRecommendations(fitnessLevel, goals, timeAvailable);
      res.json(recommendations);
    } catch (error) {
      console.error('Error generating fitness recommendations:', error);
      res.status(500).json({ message: 'Failed to generate fitness recommendations' });
    }
  });

  // Grocery Lists routes
  app.get('/api/grocery-lists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lists = await storage.getGroceryListsByUser(userId);
      res.json(lists);
    } catch (error) {
      console.error('Error fetching grocery lists:', error);
      res.status(500).json({ message: 'Failed to fetch grocery lists' });
    }
  });

  app.post('/api/grocery-lists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listData = insertGroceryListSchema.parse({
        ...req.body,
        userId
      });
      
      const list = await storage.createGroceryList(listData);
      res.status(201).json(list);
    } catch (error) {
      console.error('Error creating grocery list:', error);
      res.status(500).json({ message: 'Failed to create grocery list' });
    }
  });

  app.put('/api/grocery-lists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const existingList = await storage.getGroceryList(id);
      if (!existingList || existingList.userId !== userId) {
        return res.status(404).json({ message: 'Grocery list not found' });
      }
      
      const updatedList = await storage.updateGroceryList(id, req.body);
      res.json(updatedList);
    } catch (error) {
      console.error('Error updating grocery list:', error);
      res.status(500).json({ message: 'Failed to update grocery list' });
    }
  });

  app.delete('/api/grocery-lists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const existingList = await storage.getGroceryList(id);
      if (!existingList || existingList.userId !== userId) {
        return res.status(404).json({ message: 'Grocery list not found' });
      }
      
      await storage.deleteGroceryList(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting grocery list:', error);
      res.status(500).json({ message: 'Failed to delete grocery list' });
    }
  });

  // Journal Entries routes
  app.get('/api/journal-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getJournalEntriesByUser(userId);
      res.json(entries);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      res.status(500).json({ message: 'Failed to fetch journal entries' });
    }
  });

  app.post('/api/journal-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryData = insertJournalEntrySchema.parse({
        ...req.body,
        userId,
        wordCount: req.body.content ? req.body.content.split(' ').length : 0
      });
      
      const entry = await storage.createJournalEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      console.error('Error creating journal entry:', error);
      res.status(500).json({ message: 'Failed to create journal entry' });
    }
  });

  app.put('/api/journal-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const existingEntry = await storage.getJournalEntry(id);
      if (!existingEntry || existingEntry.userId !== userId) {
        return res.status(404).json({ message: 'Journal entry not found' });
      }
      
      const updateData = {
        ...req.body,
        wordCount: req.body.content ? req.body.content.split(' ').length : existingEntry.wordCount
      };
      
      const updatedEntry = await storage.updateJournalEntry(id, updateData);
      res.json(updatedEntry);
    } catch (error) {
      console.error('Error updating journal entry:', error);
      res.status(500).json({ message: 'Failed to update journal entry' });
    }
  });

  app.delete('/api/journal-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const existingEntry = await storage.getJournalEntry(id);
      if (!existingEntry || existingEntry.userId !== userId) {
        return res.status(404).json({ message: 'Journal entry not found' });
      }
      
      await storage.deleteJournalEntry(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      res.status(500).json({ message: 'Failed to delete journal entry' });
    }
  });

  // AI Journal prompts
  app.get('/api/ai/journal-prompts', isAuthenticated, async (req: any, res) => {
    try {
      const { goalType, mood } = req.query;
      const prompts = await generateJournalPrompts(goalType as string, mood as string);
      res.json({ prompts });
    } catch (error) {
      console.error('Error generating journal prompts:', error);
      res.status(500).json({ message: 'Failed to generate journal prompts' });
    }
  });

  // Core Values routes
  app.get('/api/core-values', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const values = await storage.getCoreValuesByUser(userId);
      res.json(values);
    } catch (error) {
      console.error('Error fetching core values:', error);
      res.status(500).json({ message: 'Failed to fetch core values' });
    }
  });

  app.post('/api/core-values', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const valueData = insertCoreValueSchema.parse({
        ...req.body,
        userId
      });
      
      const value = await storage.createCoreValue(valueData);
      res.status(201).json(value);
    } catch (error) {
      console.error('Error creating core value:', error);
      res.status(500).json({ message: 'Failed to create core value' });
    }
  });

  app.put('/api/core-values/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const existingValue = await storage.getCoreValue(id);
      if (!existingValue || existingValue.userId !== userId) {
        return res.status(404).json({ message: 'Core value not found' });
      }
      
      const updatedValue = await storage.updateCoreValue(id, req.body);
      res.json(updatedValue);
    } catch (error) {
      console.error('Error updating core value:', error);
      res.status(500).json({ message: 'Failed to update core value' });
    }
  });

  app.delete('/api/core-values/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const existingValue = await storage.getCoreValue(id);
      if (!existingValue || existingValue.userId !== userId) {
        return res.status(404).json({ message: 'Core value not found' });
      }
      
      await storage.deleteCoreValue(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting core value:', error);
      res.status(500).json({ message: 'Failed to delete core value' });
    }
  });

  // AI Core values exercise
  app.get('/api/ai/core-values-exercise', isAuthenticated, async (req: any, res) => {
    try {
      const exercise = await generateCoreValuesExercise();
      res.json(exercise);
    } catch (error) {
      console.error('Error generating core values exercise:', error);
      res.status(500).json({ message: 'Failed to generate core values exercise' });
    }
  });

  // AI Wellness suggestions (one-click generator)
  app.post('/api/ai/wellness-suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const { includeCategories = ['fitness', 'nutrition', 'mindfulness', 'productivity', 'goals'] } = req.body;
      const suggestions = await generateWellnessSuggestions(includeCategories);
      res.json(suggestions);
    } catch (error) {
      console.error('Error generating wellness suggestions:', error);
      res.status(500).json({ message: 'Failed to generate wellness suggestions' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}