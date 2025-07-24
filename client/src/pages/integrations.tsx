import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle, Settings, Trash2, RefreshCw, ExternalLink, Mail, ArrowLeft } from "lucide-react";
import { SiGooglecalendar, SiTodoist, SiAsana, SiTrello, SiNotion } from "react-icons/si";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Integration } from "@shared/schema";

interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  type: 'calendar' | 'task_manager';
  color: string;
}

const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync your goal deadlines and important milestones with Google Calendar',
    icon: SiGooglecalendar,
    type: 'calendar',
    color: 'bg-blue-500'
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Connect with Outlook Calendar for seamless scheduling',
    icon: Mail,
    type: 'calendar',
    color: 'bg-blue-600'
  },
  {
    id: 'todoist',
    name: 'Todoist',
    description: 'Create and manage tasks in Todoist from your goals',
    icon: SiTodoist,
    type: 'task_manager',
    color: 'bg-red-500'
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Sync tasks and projects with your Asana workspace',
    icon: SiAsana,
    type: 'task_manager',
    color: 'bg-pink-500'
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Create Trello cards from your goal tasks',
    icon: SiTrello,
    type: 'task_manager',
    color: 'bg-blue-400'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync your goals and progress with Notion databases',
    icon: SiNotion,
    type: 'task_manager',
    color: 'bg-gray-700'
  }
];

export default function Integrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState<string | null>(null);

  // Fetch user's integrations
  const { data: integrations = [], isLoading } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
    retry: false,
  });

  // Connect integration mutation
  const connectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest(`/api/integrations/connect/${provider}`, "POST");
      return response;
    },
    onSuccess: (data, provider) => {
      // Open OAuth URL in a new window
      window.open(data.url, 'oauth', 'width=600,height=600');
    },
    onError: (error, provider) => {
      setConnecting(null);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${provider}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  // Delete integration mutation
  const deleteMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      await apiRequest(`/api/integrations/${integrationId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Integration Disconnected",
        description: "The integration has been successfully removed.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to disconnect integration. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sync integration mutation
  const syncMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      await apiRequest(`/api/integrations/${integrationId}/sync`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Sync Complete",
        description: "Integration sync completed successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Sync Failed",
        description: "Failed to sync integration. Please check your connection.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (provider: string) => {
    setConnecting(provider);
    connectMutation.mutate(provider);
  };

  const getProviderInfo = (providerId: string) => {
    return INTEGRATION_PROVIDERS.find(p => p.id === providerId);
  };

  const getConnectedIntegration = (providerId: string) => {
    return integrations.find(integration => integration.provider === providerId);
  };

  const formatLastSync = (lastSyncAt: Date | string | null) => {
    if (!lastSyncAt) return 'Never';
    return new Date(lastSyncAt).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Link href="/dashboard">
              <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 font-semibold">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 text-shadow-strong">
            External Integrations
          </h1>
          <p className="text-xl text-white/90 text-shadow-medium max-w-3xl mx-auto">
            Connect Goal Flow Pro with your favorite calendar and productivity tools to sync your goals, tasks, and deadlines seamlessly.
          </p>
        </div>

        {/* Connected Integrations */}
        {integrations.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-shadow-medium">
              Connected Integrations
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => {
                const provider = getProviderInfo(integration.provider);
                if (!provider) return null;

                const IconComponent = provider.icon;
                return (
                  <Card key={integration.id} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur border border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${provider.color}`}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-gray-900 dark:text-white text-lg font-bold">
                              {provider.name}
                            </CardTitle>
                            <Badge 
                              variant={integration.isActive ? "default" : "secondary"}
                              className="mt-1 bg-emerald-600 text-white border-0"
                            >
                              {integration.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-800 dark:text-white text-sm mb-4 font-semibold">
                        Last sync: {formatLastSync(integration.lastSyncAt)}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncMutation.mutate(integration.id)}
                          disabled={syncMutation.isPending}
                          className="border-gray-300 dark:border-white/30 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 font-semibold"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(integration.id)}
                          disabled={deleteMutation.isPending}
                          className="text-white font-semibold"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Integrations */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 text-shadow-medium">
            Available Integrations
          </h2>
          
          {/* Calendar Integrations */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center text-shadow-medium">
              <Calendar className="h-5 w-5 mr-2" />
              Calendar Apps
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {INTEGRATION_PROVIDERS.filter(p => p.type === 'calendar').map((provider) => {
                const isConnected = getConnectedIntegration(provider.id);
                const IconComponent = provider.icon;

                return (
                  <Card key={provider.id} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur border border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${provider.color}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-gray-900 dark:text-white text-lg font-semibold">
                            {provider.name}
                          </CardTitle>
                          {isConnected && (
                            <Badge className="mt-1 bg-green-500 text-white">
                              Connected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-700 dark:text-gray-300 mb-4 font-medium">
                        {provider.description}
                      </CardDescription>
                      <Button
                        onClick={() => handleConnect(provider.id)}
                        disabled={!!isConnected || connecting === provider.id || connectMutation.isPending}
                        className="w-full step-gradient-3 text-white font-semibold"
                      >
                        {connecting === provider.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : isConnected ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Connected
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Task Management Integrations */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center text-shadow-medium">
              <Settings className="h-5 w-5 mr-2" />
              Task Management Tools
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {INTEGRATION_PROVIDERS.filter(p => p.type === 'task_manager').map((provider) => {
                const isConnected = getConnectedIntegration(provider.id);
                const IconComponent = provider.icon;

                return (
                  <Card key={provider.id} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur border border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${provider.color}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-gray-900 dark:text-white text-lg font-semibold">
                            {provider.name}
                          </CardTitle>
                          {isConnected && (
                            <Badge className="mt-1 bg-green-500 text-white">
                              Connected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-700 dark:text-gray-300 mb-4 font-medium">
                        {provider.description}
                      </CardDescription>
                      <Button
                        onClick={() => handleConnect(provider.id)}
                        disabled={!!isConnected || connecting === provider.id || connectMutation.isPending}
                        className="w-full step-gradient-5 text-white font-semibold"
                      >
                        {connecting === provider.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : isConnected ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Connected
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-12">
          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                How Integrations Work
              </h4>
              <div className="text-gray-700 dark:text-gray-300 space-y-2 text-left">
                <p className="font-medium">• <strong className="text-gray-900 dark:text-white">Calendar Apps:</strong> Automatically create events for goal deadlines and important milestones</p>
                <p className="font-medium">• <strong className="text-gray-900 dark:text-white">Task Managers:</strong> Sync your goal tasks with your preferred productivity tools</p>
                <p className="font-medium">• <strong className="text-gray-900 dark:text-white">Real-time Sync:</strong> Changes in Goal Flow Pro are reflected in connected apps</p>
                <p className="font-medium">• <strong className="text-gray-900 dark:text-white">Secure:</strong> We use OAuth 2.0 for secure, encrypted connections</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}