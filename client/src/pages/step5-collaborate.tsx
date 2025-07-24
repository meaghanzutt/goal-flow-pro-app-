import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { StepHeader } from "@/components/shared/step-header";
import { ProgressIndicator } from "@/components/shared/progress-indicator";
import { useWorkflow } from "@/hooks/use-workflow";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { insertCollaborationSchema } from "@shared/schema";
import type { Goal, Collaboration, Category } from "@shared/schema";
import { 
  Users, 
  ArrowRight, 
  ArrowLeft, 
  Plus,
  Share,
  MessageCircle,
  UserPlus,
  Mail,
  AlertCircle,
  Crown,
  Eye,
  Edit,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  goalId: z.number(),
  role: z.enum(["collaborator", "viewer"]),
  canEdit: z.boolean(),
  message: z.string().optional(),
});

type InviteForm = z.infer<typeof inviteSchema>;

// Mock collaboration data for demonstration
const mockCollaborations = [
  {
    id: 1,
    goalId: 1,
    userEmail: "sarah@example.com",
    userName: "Sarah Johnson",
    role: "collaborator",
    canEdit: true,
    joinedAt: new Date("2024-01-15"),
  },
  {
    id: 2,
    goalId: 1,
    userEmail: "mike@example.com",
    userName: "Mike Chen",
    role: "viewer",
    canEdit: false,
    joinedAt: new Date("2024-01-20"),
  },
];

const mockComments = [
  {
    id: 1,
    goalId: 1,
    author: "Sarah Johnson",
    content: "Great progress on this goal! The task breakdown looks solid.",
    timestamp: new Date("2024-01-25T10:30:00"),
  },
  {
    id: 2,
    goalId: 1,
    author: "Mike Chen",
    content: "I think we should consider adding a milestone for the mid-point review.",
    timestamp: new Date("2024-01-26T14:15:00"),
  },
];

export default function Step5Collaborate() {
  const { currentStep, isStepUnlocked, goToStep, completeCurrentStep } = useWorkflow();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newComment, setNewComment] = useState("");

  const inviteForm = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      goalId: 0,
      role: "collaborator",
      canEdit: true,
      message: "",
    },
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    enabled: !!user?.id,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // For now, we'll use mock data for collaborations since this requires user management
  const collaborations = mockCollaborations;
  const comments = mockComments;

  const handleInviteCollaborator = (goalId: number) => {
    setSelectedGoalId(goalId);
    inviteForm.reset({
      email: "",
      goalId,
      role: "collaborator",
      canEdit: true,
      message: "",
    });
    setShowInviteForm(true);
  };

  const onInviteSubmit = (data: InviteForm) => {
    // In a real implementation, this would send an invitation
    toast({
      title: "Invitation Sent!",
      description: `Collaboration invitation sent to ${data.email}`,
    });
    setShowInviteForm(false);
    inviteForm.reset();
  };

  const handleShareGoal = (goalId: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      // In a real implementation, this would generate a shareable link
      const shareText = `Check out my goal: ${goal.title}`;
      if (navigator.share) {
        navigator.share({
          title: 'Goal Flow Pro - Goal Share',
          text: shareText,
          url: window.location.origin + `/goals/${goalId}`,
        });
      } else {
        navigator.clipboard.writeText(`${shareText} - ${window.location.origin}/goals/${goalId}`);
        toast({
          title: "Link Copied!",
          description: "Goal share link copied to clipboard",
        });
      }
    }
  };

  const handleAddComment = (goalId: number) => {
    if (!newComment.trim()) return;
    
    // In a real implementation, this would save the comment
    toast({
      title: "Comment Added!",
      description: "Your comment has been posted",
    });
    setNewComment("");
  };

  const getGoalCollaborators = (goalId: number) => {
    return collaborations.filter(collab => collab.goalId === goalId);
  };

  const getGoalComments = (goalId: number) => {
    return comments.filter(comment => comment.goalId === goalId);
  };

  const progress = Math.min(Math.round((collaborations.length / 3) * 100), 100);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressIndicator 
          currentStep={currentStep} 
          isStepUnlocked={isStepUnlocked}
          onStepClick={goToStep}
        />

        <Card className="shadow-lg overflow-hidden">
          <StepHeader
            stepNumber={5}
            title="Collaborate & Share"
            description="Share goals and get accountability support"
            progress={progress}
          />

          <CardContent className="p-6">
            <Tabs defaultValue="share" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="share">Share Goals</TabsTrigger>
                <TabsTrigger value="collaborators">Team Members</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
              </TabsList>

              <TabsContent value="share" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-6 h-6 step-gradient-5 rounded mr-2 flex items-center justify-center">
                      <Share className="text-white" size={16} />
                    </div>
                    Share Your Goals
                  </h3>
                </div>

                {goals.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 mb-4">No goals available to share.</p>
                    <Button onClick={() => goToStep(2)} variant="outline">
                      Create Goals First
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => {
                      const category = categories.find(cat => cat.id === goal.categoryId);
                      const goalCollaborators = getGoalCollaborators(goal.id);
                      
                      return (
                        <Card key={goal.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 flex items-center">
                                  <Target className="mr-2 text-brand-orange" size={20} />
                                  {goal.title}
                                </h4>
                                <div className="flex items-center space-x-2 mt-2">
                                  {category && (
                                    <Badge variant="outline">{category.name}</Badge>
                                  )}
                                  <Badge variant="secondary">{goal.priority}</Badge>
                                  <span className="text-sm text-gray-500">
                                    {goalCollaborators.length} collaborator{goalCollaborators.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleInviteCollaborator(goal.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-brand-orange border-brand-orange hover:bg-brand-orange hover:text-white"
                                >
                                  <UserPlus className="mr-1" size={16} />
                                  Invite
                                </Button>
                                <Button
                                  onClick={() => handleShareGoal(goal.id)}
                                  size="sm"
                                  className="brand-orange"
                                >
                                  <Share className="mr-1" size={16} />
                                  Share
                                </Button>
                              </div>
                            </div>

                            {goalCollaborators.length > 0 && (
                              <div className="flex items-center space-x-2 mt-3">
                                <span className="text-sm text-gray-600">Team:</span>
                                <div className="flex -space-x-2">
                                  {goalCollaborators.slice(0, 3).map((collab) => (
                                    <Avatar key={collab.id} className="border-2 border-white w-8 h-8">
                                      <AvatarFallback className="text-xs">
                                        {collab.userName.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {goalCollaborators.length > 3 && (
                                    <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                                      <span className="text-xs text-gray-600">+{goalCollaborators.length - 3}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {showInviteForm && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Mail className="mr-2 text-brand-orange" />
                        Invite Collaborator
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...inviteForm}>
                        <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                          <FormField
                            control={inviteForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="colleague@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={inviteForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Role</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="collaborator">Collaborator</SelectItem>
                                      <SelectItem value="viewer">Viewer</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex items-center space-x-2 pt-8">
                              <FormField
                                control={inviteForm.control}
                                name="canEdit"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="rounded"
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm">Can edit tasks</FormLabel>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <FormField
                            control={inviteForm.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Personal Message (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Add a personal message to the invitation..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-between pt-4">
                            <Button type="button" onClick={() => setShowInviteForm(false)} variant="outline">
                              Cancel
                            </Button>
                            <Button type="submit" className="brand-orange">
                              <Mail className="mr-2" size={16} />
                              Send Invitation
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="collaborators" className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="mr-2 text-brand-orange" />
                  Team Members
                </h3>

                <div className="space-y-4">
                  {goals.map((goal) => {
                    const goalCollaborators = getGoalCollaborators(goal.id);
                    if (goalCollaborators.length === 0) return null;

                    return (
                      <Card key={goal.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{goal.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {goalCollaborators.map((collab) => (
                              <div key={collab.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <Avatar>
                                    <AvatarFallback>
                                      {collab.userName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-gray-900">{collab.userName}</div>
                                    <div className="text-sm text-gray-600">{collab.userEmail}</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={collab.role === "collaborator" ? "default" : "secondary"}>
                                    {collab.role === "collaborator" ? (
                                      <><Edit className="mr-1" size={12} /> Collaborator</>
                                    ) : (
                                      <><Eye className="mr-1" size={12} /> Viewer</>
                                    )}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    Joined {collab.joinedAt.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {collaborations.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Users className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600">No team members yet. Start by inviting collaborators to your goals!</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="communication" className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="mr-2 text-brand-orange" />
                  Team Communication
                </h3>

                <div className="space-y-4">
                  {goals.map((goal) => {
                    const goalComments = getGoalComments(goal.id);
                    const goalCollaborators = getGoalCollaborators(goal.id);
                    
                    if (goalCollaborators.length === 0) return null;

                    return (
                      <Card key={goal.id}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <Target className="mr-2 text-brand-orange" size={20} />
                            {goal.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {goalComments.length > 0 && (
                              <div className="space-y-3">
                                {goalComments.map((comment) => (
                                  <div key={comment.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="text-xs">
                                        {comment.author.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-sm text-gray-900">{comment.author}</span>
                                        <span className="text-xs text-gray-500">
                                          {comment.timestamp.toLocaleDateString()} at {comment.timestamp.toLocaleTimeString()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">JD</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-2">
                                <Textarea
                                  placeholder="Add a comment..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="min-h-[80px]"
                                />
                                <Button
                                  onClick={() => handleAddComment(goal.id)}
                                  disabled={!newComment.trim()}
                                  size="sm"
                                  className="brand-orange"
                                >
                                  <MessageCircle className="mr-2" size={16} />
                                  Post Comment
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {collaborations.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <MessageCircle className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600">No team communications yet. Invite collaborators to start discussing your goals!</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button onClick={() => goToStep(4)} variant="outline">
                <ArrowLeft className="mr-2" size={16} />
                Previous Step
              </Button>
              <Button 
                onClick={completeCurrentStep}
                className="brand-orange"
              >
                Continue to Achievement
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
