import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SuggestedTask {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  urgency: "urgent" | "not_urgent";
  importance: "important" | "not_important";
  estimatedHours: number;
}

export async function generateMotivationalQuote(goalTitle?: string): Promise<string> {
  try {
    const prompt = goalTitle 
      ? `Generate an inspiring and motivational quote related to achieving the goal: "${goalTitle}". Make it personal, encouraging, and actionable. Keep it under 100 characters.`
      : `Generate a short, inspiring motivational quote about goal achievement and personal growth. Keep it under 100 characters.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });

    return response.choices[0].message.content?.trim() || "Every step forward is progress toward your dreams.";
  } catch (error) {
    console.error("Error generating motivational quote:", error);
    return "Every step forward is progress toward your dreams.";
  }
}

export async function generateGoalSuggestions(idea: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a goal-setting expert. Generate 3 SMART goal suggestions based on the user's idea. Each goal should be Specific, Measurable, Achievable, Relevant, and Time-bound. Respond with JSON in this format: { 'suggestions': ['goal1', 'goal2', 'goal3'] }"
        },
        {
          role: "user",
          content: `Based on this idea: "${idea}", suggest 3 SMART goals that would help achieve it.`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    return result.suggestions || [];
  } catch (error) {
    console.error("Error generating goal suggestions:", error);
    return [];
  }
}

export async function generateProgressInsight(goalTitle: string, progressPercentage: number): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a supportive goal coach. Provide encouraging and actionable insights based on goal progress."
        },
        {
          role: "user",
          content: `Goal: "${goalTitle}" is ${progressPercentage}% complete. Provide a brief, encouraging insight or next step suggestion (max 150 characters).`
        }
      ],
      max_tokens: 80,
    });

    return response.choices[0].message.content?.trim() || "Keep going! You're making great progress.";
  } catch (error) {
    console.error("Error generating progress insight:", error);
    return "Keep going! You're making great progress.";
  }
}

function generateFallbackTasks(goalTitle: string): SuggestedTask[] {
  // Create intelligent fallback tasks based on common goal patterns
  const isInvestmentGoal = goalTitle.toLowerCase().includes('invest') || goalTitle.toLowerCase().includes('retirement');
  const isHealthGoal = goalTitle.toLowerCase().includes('health') || goalTitle.toLowerCase().includes('fitness');
  const isCareerGoal = goalTitle.toLowerCase().includes('career') || goalTitle.toLowerCase().includes('job');
  
  if (isInvestmentGoal) {
    return [
      {
        title: "Calculate current financial position",
        description: "Review bank statements, debts, and current investments to establish baseline",
        priority: "high",
        urgency: "urgent",
        importance: "important",
        estimatedHours: 2
      },
      {
        title: "Research investment account options",
        description: "Compare 401k, IRA, Roth IRA options and employer matching programs",
        priority: "medium",
        urgency: "not_urgent",
        importance: "important",
        estimatedHours: 3
      },
      {
        title: "Set up automatic transfers",
        description: "Configure monthly automatic transfers to retirement accounts",
        priority: "medium",
        urgency: "urgent",
        importance: "not_important",
        estimatedHours: 1
      },
      {
        title: "Meet with financial advisor",
        description: "Schedule consultation to review investment strategy and allocations",
        priority: "medium",
        urgency: "not_urgent",
        importance: "important",
        estimatedHours: 2
      },
      {
        title: "Create monthly budget tracker",
        description: "Set up spreadsheet or app to track income and expenses",
        priority: "medium",
        urgency: "not_urgent",
        importance: "important",
        estimatedHours: 1
      },
      {
        title: "Read investment newsletter",
        description: "Subscribe to and read financial newsletters for market updates",
        priority: "low",
        urgency: "not_urgent",
        importance: "not_important",
        estimatedHours: 0.5
      }
    ];
  }
  
  // Default generic tasks for any goal
  return [
    {
      title: "Define specific milestones",
      description: "Break down the main goal into smaller, measurable milestones",
      priority: "high",
      urgency: "urgent",
      importance: "important",
      estimatedHours: 1
    },
    {
      title: "Research best practices",
      description: "Study successful strategies and methods related to your goal",
      priority: "medium",
      urgency: "not_urgent",
      importance: "important",
      estimatedHours: 2
    },
    {
      title: "Create action timeline",
      description: "Set up a detailed timeline with deadlines for each milestone",
      priority: "medium",
      urgency: "urgent",
      importance: "not_important",
      estimatedHours: 1
    },
    {
      title: "Find accountability partner",
      description: "Identify someone to help keep you motivated and on track",
      priority: "medium",
      urgency: "not_urgent",
      importance: "important",
      estimatedHours: 1
    },
    {
      title: "Set up progress tracking",
      description: "Choose tools or methods to monitor your progress regularly",
      priority: "medium",
      urgency: "not_urgent",
      importance: "important",
      estimatedHours: 1
    },
    {
      title: "Join online community",
      description: "Find forums or groups related to your goal for support and tips",
      priority: "low",
      urgency: "not_urgent",
      importance: "not_important",
      estimatedHours: 0.5
    }
  ];
}

export async function generateTaskSuggestions(goalTitle: string, goalDescription: string): Promise<SuggestedTask[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a productivity expert specializing in task management and the Eisenhower Matrix. Break down goals into actionable tasks categorized by urgency and importance.

          Urgency levels:
          - "urgent": Needs immediate attention, time-sensitive, has deadlines
          - "not_urgent": Important for long-term success but no immediate deadline
          
          Importance levels:
          - "important": Directly contributes to the goal, high impact on success
          - "not_important": Nice to have but doesn't directly impact goal achievement
          
          Priority levels:
          - "high": Important + Urgent (Do First)
          - "medium": Important + Not Urgent (Schedule) OR Not Important + Urgent (Delegate)
          - "low": Not Important + Not Urgent (Eliminate)
          
          Respond with JSON in this exact format:
          {
            "tasks": [
              {
                "title": "Task title",
                "description": "Brief description of what to do",
                "priority": "high|medium|low",
                "urgency": "urgent|not_urgent", 
                "importance": "important|not_important",
                "estimatedHours": number
              }
            ]
          }`
        },
        {
          role: "user",
          content: `Goal: "${goalTitle}"
          Description: "${goalDescription}"
          
          Generate 6-8 specific, actionable tasks to achieve this goal. Include a mix of urgent/important, important/not-urgent, and other combinations to demonstrate the Eisenhower Matrix.`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"tasks": []}');
    return result.tasks || [];
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    
    // Return intelligent fallback tasks instead of empty array
    return generateFallbackTasks(goalTitle);
  }
}