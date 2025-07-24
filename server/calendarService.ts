import { Integration, Goal, Task } from "@shared/schema";

// Calendar integration service for managing external calendar connections
export class CalendarService {
  
  // Supported calendar providers
  static readonly PROVIDERS = {
    GOOGLE_CALENDAR: 'google_calendar',
    OUTLOOK: 'outlook', 
    APPLE_CALENDAR: 'apple_calendar',
    CALDAV: 'caldav'
  } as const;

  // Productivity tool providers
  static readonly PRODUCTIVITY_PROVIDERS = {
    TODOIST: 'todoist',
    ASANA: 'asana',
    TRELLO: 'trello',
    NOTION: 'notion',
    MONDAY: 'monday',
    CLICKUP: 'clickup'
  } as const;

  /**
   * Generate OAuth URL for calendar provider authentication
   */
  static generateOAuthUrl(provider: string, userId: string): string {
    const baseUrls = {
      [this.PROVIDERS.GOOGLE_CALENDAR]: 'https://accounts.google.com/o/oauth2/v2/auth',
      [this.PROVIDERS.OUTLOOK]: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      [this.PRODUCTIVITY_PROVIDERS.TODOIST]: 'https://todoist.com/oauth/authorize',
      [this.PRODUCTIVITY_PROVIDERS.ASANA]: 'https://app.asana.com/-/oauth_authorize',
    };

    const clientIds = {
      [this.PROVIDERS.GOOGLE_CALENDAR]: process.env.GOOGLE_CLIENT_ID,
      [this.PROVIDERS.OUTLOOK]: process.env.MICROSOFT_CLIENT_ID,
      [this.PRODUCTIVITY_PROVIDERS.TODOIST]: process.env.TODOIST_CLIENT_ID,
      [this.PRODUCTIVITY_PROVIDERS.ASANA]: process.env.ASANA_CLIENT_ID,
    };

    const scopes = {
      [this.PROVIDERS.GOOGLE_CALENDAR]: 'https://www.googleapis.com/auth/calendar',
      [this.PROVIDERS.OUTLOOK]: 'https://graph.microsoft.com/calendars.readwrite',
      [this.PRODUCTIVITY_PROVIDERS.TODOIST]: 'data:read_write',
      [this.PRODUCTIVITY_PROVIDERS.ASANA]: 'default',
    };

    const redirectUri = `${process.env.APP_URL}/api/integrations/callback/${provider}`;
    const baseUrl = baseUrls[provider];
    const clientId = clientIds[provider];
    const scope = scopes[provider];

    if (!baseUrl || !clientId) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
      response_type: 'code',
      state: userId, // Include user ID for security
      access_type: 'offline', // For refresh tokens
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(provider: string, code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }> {
    const tokenUrls = {
      [this.PROVIDERS.GOOGLE_CALENDAR]: 'https://oauth2.googleapis.com/token',
      [this.PROVIDERS.OUTLOOK]: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      [this.PRODUCTIVITY_PROVIDERS.TODOIST]: 'https://todoist.com/oauth/access_token',
      [this.PRODUCTIVITY_PROVIDERS.ASANA]: 'https://app.asana.com/-/oauth_token',
    };

    const clientSecrets = {
      [this.PROVIDERS.GOOGLE_CALENDAR]: process.env.GOOGLE_CLIENT_SECRET,
      [this.PROVIDERS.OUTLOOK]: process.env.MICROSOFT_CLIENT_SECRET,
      [this.PRODUCTIVITY_PROVIDERS.TODOIST]: process.env.TODOIST_CLIENT_SECRET,
      [this.PRODUCTIVITY_PROVIDERS.ASANA]: process.env.ASANA_CLIENT_SECRET,
    };

    const tokenUrl = tokenUrls[provider];
    const clientSecret = clientSecrets[provider];

    if (!tokenUrl || !clientSecret) {
      throw new Error(`Token exchange not supported for provider: ${provider}`);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`] || '',
        client_secret: clientSecret,
        redirect_uri: `${process.env.APP_URL}/api/integrations/callback/${provider}`,
      }),
    });

    const tokenData = await response.json();
    
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`);
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
    };
  }

  /**
   * Create calendar event for a goal deadline
   */
  static async createCalendarEvent(integration: Integration, goal: Goal): Promise<string | null> {
    try {
      if (integration.provider === this.PROVIDERS.GOOGLE_CALENDAR) {
        return await this.createGoogleCalendarEvent(integration, goal);
      } else if (integration.provider === this.PROVIDERS.OUTLOOK) {
        return await this.createOutlookEvent(integration, goal);
      }
      return null;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      return null;
    }
  }

  /**
   * Create task in external productivity tool
   */
  static async createExternalTask(integration: Integration, task: Task, goal: Goal): Promise<string | null> {
    try {
      if (integration.provider === this.PRODUCTIVITY_PROVIDERS.TODOIST) {
        return await this.createTodoistTask(integration, task, goal);
      } else if (integration.provider === this.PRODUCTIVITY_PROVIDERS.ASANA) {
        return await this.createAsanaTask(integration, task, goal);
      }
      return null;
    } catch (error) {
      console.error('Failed to create external task:', error);
      return null;
    }
  }

  /**
   * Google Calendar API integration
   */
  private static async createGoogleCalendarEvent(integration: Integration, goal: Goal): Promise<string> {
    const event = {
      summary: `Goal Deadline: ${goal.title}`,
      description: `${goal.description}\n\nPriority: ${goal.priority}\nProgress: ${goal.progress}%`,
      start: {
        dateTime: goal.deadline.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(goal.deadline.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${data.error?.message}`);
    }

    return data.id;
  }

  /**
   * Microsoft Outlook Calendar API integration
   */
  private static async createOutlookEvent(integration: Integration, goal: Goal): Promise<string> {
    const event = {
      subject: `Goal Deadline: ${goal.title}`,
      body: {
        contentType: 'Text',
        content: `${goal.description}\n\nPriority: ${goal.priority}\nProgress: ${goal.progress}%`,
      },
      start: {
        dateTime: goal.deadline.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(goal.deadline.getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'UTC',
      },
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Outlook API error: ${data.error?.message}`);
    }

    return data.id;
  }

  /**
   * Todoist API integration
   */
  private static async createTodoistTask(integration: Integration, task: Task, goal: Goal): Promise<string> {
    const todoistTask = {
      content: task.title,
      description: `${task.description}\n\nGoal: ${goal.title}\nPriority: ${task.priority}`,
      due_date: task.deadline?.toISOString().split('T')[0], // YYYY-MM-DD format
      priority: this.mapPriorityToTodoist(task.priority),
      labels: ['goal-flow-pro'],
    };

    const response = await fetch('https://api.todoist.com/rest/v2/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(todoistTask),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Todoist API error: ${data.error}`);
    }

    return data.id;
  }

  /**
   * Asana API integration
   */
  private static async createAsanaTask(integration: Integration, task: Task, goal: Goal): Promise<string> {
    const asanaTask = {
      data: {
        name: task.title,
        notes: `${task.description}\n\nGoal: ${goal.title}\nPriority: ${task.priority}`,
        due_on: task.deadline?.toISOString().split('T')[0],
        projects: [], // Could be configured in integration settings
      },
    };

    const response = await fetch('https://app.asana.com/api/1.0/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asanaTask),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Asana API error: ${data.errors?.[0]?.message}`);
    }

    return data.data.gid;
  }

  /**
   * Map internal priority to Todoist priority system
   */
  private static mapPriorityToTodoist(priority: string): number {
    switch (priority.toLowerCase()) {
      case 'high': return 4;
      case 'medium': return 3;
      case 'low': return 2;
      default: return 1;
    }
  }

  /**
   * Refresh expired access token
   */
  static async refreshAccessToken(integration: Integration): Promise<string> {
    if (!integration.refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokenUrls = {
      [this.PROVIDERS.GOOGLE_CALENDAR]: 'https://oauth2.googleapis.com/token',
      [this.PROVIDERS.OUTLOOK]: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    };

    const tokenUrl = tokenUrls[integration.provider];
    if (!tokenUrl) {
      throw new Error(`Token refresh not supported for provider: ${integration.provider}`);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: integration.refreshToken,
        client_id: process.env[`${integration.provider.toUpperCase()}_CLIENT_ID`] || '',
        client_secret: process.env[`${integration.provider.toUpperCase()}_CLIENT_SECRET`] || '',
      }),
    });

    const tokenData = await response.json();
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${tokenData.error_description || tokenData.error}`);
    }

    return tokenData.access_token;
  }

  /**
   * Test integration connection
   */
  static async testConnection(integration: Integration): Promise<boolean> {
    try {
      if (integration.provider === this.PROVIDERS.GOOGLE_CALENDAR) {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
          headers: { 'Authorization': `Bearer ${integration.accessToken}` },
        });
        return response.ok;
      } else if (integration.provider === this.PROVIDERS.OUTLOOK) {
        const response = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
          headers: { 'Authorization': `Bearer ${integration.accessToken}` },
        });
        return response.ok;
      }
      return false;
    } catch {
      return false;
    }
  }
}