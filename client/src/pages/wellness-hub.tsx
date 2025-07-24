import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, ShoppingCart, BookOpen, Heart, ArrowLeft, Sparkles, Camera } from "lucide-react";
import { Link } from "wouter";
import { FitnessPlanner } from "@/components/FitnessPlanner";
import { GroceryPlanner } from "@/components/GroceryPlanner";
import { JournalHub } from "@/components/JournalHub";
import { CoreValuesExplorer } from "@/components/CoreValuesExplorer";
import { AIWellnessSuggestionGenerator } from "@/components/AIWellnessSuggestionGenerator";
import { VisionBoard } from "@/components/VisionBoard";

export function WellnessHub() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Wellness & Growth Hub
        </h1>
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          Comprehensive tools for fitness planning, mindful nutrition, reflective journaling, values discovery, and vision board creation.
        </p>
      </div>

      <Tabs defaultValue="ai-suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="ai-suggestions" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-700 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>AI Suggestions</span>
          </TabsTrigger>
          <TabsTrigger value="fitness" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-700 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white font-semibold">
            <Dumbbell className="w-4 h-4" />
            <span>Fitness</span>
          </TabsTrigger>
          <TabsTrigger value="grocery" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-700 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white font-semibold">
            <ShoppingCart className="w-4 h-4" />
            <span>Grocery</span>
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-700 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>Journal</span>
          </TabsTrigger>
          <TabsTrigger value="values" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-700 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white font-semibold">
            <Heart className="w-4 h-4" />
            <span>Values</span>
          </TabsTrigger>
          <TabsTrigger value="vision" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-700 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white font-semibold">
            <Camera className="w-4 h-4" />
            <span>Vision Board</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-suggestions" className="mt-6">
          <AIWellnessSuggestionGenerator />
        </TabsContent>

        <TabsContent value="fitness" className="mt-6">
          <FitnessPlanner />
        </TabsContent>

        <TabsContent value="grocery" className="mt-6">
          <GroceryPlanner />
        </TabsContent>

        <TabsContent value="journal" className="mt-6">
          <JournalHub />
        </TabsContent>

        <TabsContent value="values" className="mt-6">
          <CoreValuesExplorer />
        </TabsContent>

        <TabsContent value="vision" className="mt-6">
          <VisionBoard />
        </TabsContent>
      </Tabs>
    </div>
  );
}