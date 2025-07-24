import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateFitnessRecommendations(fitnessLevel: string, goals: string[], timeAvailable: number) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a certified fitness trainer and nutrition expert. Create personalized workout plans and nutrition advice. Respond with JSON in the exact format: { \"workoutPlan\": [{\"day\": \"Day 1\", \"focus\": \"Upper Body\", \"exercises\": [{\"name\": \"Push-ups\", \"sets\": 3, \"reps\": \"10-12\"}]}], \"nutritionTips\": [\"tip1\", \"tip2\"] }"
        },
        {
          role: "user",
          content: `Create a fitness plan for someone with ${fitnessLevel} fitness level, goals: ${goals.join(', ')}, with ${timeAvailable} minutes available per workout. Include 5 workout days and 5 nutrition tips.`
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error generating fitness recommendations:', error);
    return {
      workoutPlan: [
        {
          day: "Day 1",
          focus: "Full Body",
          exercises: [
            { name: "Bodyweight squats", sets: 3, reps: "10-15" },
            { name: "Push-ups", sets: 3, reps: "8-12" },
            { name: "Planks", duration: "30-60 seconds" }
          ]
        }
      ],
      nutritionTips: [
        "Stay hydrated throughout the day",
        "Eat protein with every meal",
        "Include vegetables in every meal"
      ]
    };
  }
}

export async function generateJournalPrompts(goalType: string = 'personal_development', mood: string = 'neutral') {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a thoughtful journaling coach. Create inspiring, introspective prompts for goal-oriented individuals. Respond with JSON: { \"prompts\": [\"prompt1\", \"prompt2\", \"prompt3\", \"prompt4\", \"prompt5\"] }"
        },
        {
          role: "user",
          content: `Generate 5 journal prompts for someone focused on ${goalType} who is feeling ${mood}. Make them thought-provoking but not overwhelming.`
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error generating journal prompts:', error);
    // Return different fallback prompts based on mood and goal type
    const fallbackPrompts = getFallbackJournalPrompts(goalType, mood);
    return { prompts: fallbackPrompts };
  }
}

function getFallbackJournalPrompts(goalType: string, mood: string): string[] {
  const promptSets = {
    personal_development: {
      positive: [
        "What strength did I discover about myself this week?",
        "How can I build on today's positive momentum?",
        "What new skill would bring me joy to develop?",
        "Who in my life inspires me to grow, and why?",
        "What would I do if I knew I couldn't fail?"
      ],
      neutral: [
        "What small action can I take today to move closer to my goals?",
        "What am I most grateful for in my journey so far?",
        "What challenge am I currently facing, and how can I approach it differently?",
        "What would I tell my past self about pursuing goals?",
        "What success, no matter how small, can I celebrate today?"
      ],
      reflective: [
        "What patterns do I notice in my daily habits?",
        "When do I feel most authentic and true to myself?",
        "What fears are holding me back from taking action?",
        "How have my priorities shifted in the past month?",
        "What would my ideal day look like, and why?"
      ]
    },
    career: [
      "What skills am I developing that excite me most?",
      "How can I add more value in my current role?",
      "What would my dream career look like in 5 years?",
      "Who are the mentors or role models I admire?",
      "What project would I start if resources weren't a constraint?"
    ],
    health: [
      "How did my body feel today, and what is it telling me?",
      "What healthy habit can I start with just 5 minutes a day?",
      "What foods make me feel energized and focused?",
      "How does movement change my mood and mindset?",
      "What does self-care look like for me right now?"
    ]
  };

  // Select appropriate prompts based on goal type and mood
  if (promptSets[goalType as keyof typeof promptSets]) {
    if (typeof promptSets[goalType as keyof typeof promptSets] === 'object' && mood in (promptSets[goalType as keyof typeof promptSets] as any)) {
      return (promptSets[goalType as keyof typeof promptSets] as any)[mood];
    } else if (Array.isArray(promptSets[goalType as keyof typeof promptSets])) {
      return promptSets[goalType as keyof typeof promptSets] as string[];
    }
  }

  // Default fallback
  return promptSets.personal_development.neutral;
}

export async function generateCoreValuesExercise() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a life coach specializing in values-based living. Create a core values discovery exercise. Respond with JSON: { \"exercise\": \"exercise description\", \"questions\": [\"question1\", \"question2\"], \"values\": [\"value1\", \"value2\"] }"
        },
        {
          role: "user",
          content: "Create a core values discovery exercise with instructions, 5 reflection questions, and a list of 20 common core values."
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error generating core values exercise:', error);
    return {
      exercise: "Reflect on moments when you felt most fulfilled and authentic. Think about times when you were proud of your decisions or actions. These moments often reveal your core values.",
      questions: [
        "What activities make you lose track of time?",
        "What would you do if money wasn't a factor?",
        "What qualities do you most admire in others?",
        "What makes you feel most proud of yourself?",
        "What principles would you never compromise on?"
      ],
      values: [
        "Authenticity", "Growth", "Family", "Adventure", "Creativity", "Freedom", "Justice", "Compassion",
        "Excellence", "Integrity", "Innovation", "Service", "Balance", "Courage", "Wisdom", "Community",
        "Health", "Security", "Fun", "Spirituality"
      ]
    };
  }
}

export async function generateWellnessSuggestions(categories: string[] = ['fitness', 'nutrition', 'mindfulness', 'productivity', 'goals']) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a comprehensive wellness coach and life strategist. Create personalized wellness suggestions across multiple categories. Respond with JSON in this exact format: 
          { 
            "suggestions": [
              {
                "category": "fitness|nutrition|mindfulness|productivity|goals",
                "title": "Brief title",
                "description": "Detailed description",
                "actionSteps": ["step1", "step2", "step3"],
                "priority": "high|medium|low",
                "timeToComplete": "duration estimate",
                "difficulty": "easy|medium|hard"
              }
            ],
            "personalizedMessage": "Encouraging personal message",
            "focusArea": "Main recommended focus area"
          }`
        },
        {
          role: "user",
          content: `Generate 5 wellness suggestions covering these categories: ${categories.join(', ')}. Make them actionable, personalized, and varied in difficulty. Include specific time estimates and clear action steps. Focus on holistic well-being and practical implementation.`
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error generating wellness suggestions:', error);
    return {
      suggestions: [
        {
          category: "fitness",
          title: "Start Your Day with Movement",
          description: "Begin each morning with 10 minutes of light exercise to boost energy and mood.",
          actionSteps: [
            "Set alarm 10 minutes earlier",
            "Choose 3-4 simple exercises (jumping jacks, stretches, push-ups)",
            "Do them right after waking up",
            "Track your energy levels throughout the day"
          ],
          priority: "high",
          timeToComplete: "10 minutes daily",
          difficulty: "easy"
        },
        {
          category: "nutrition",
          title: "Hydration Foundation",
          description: "Establish a consistent water intake routine to improve energy and focus.",
          actionSteps: [
            "Fill a large water bottle each morning",
            "Drink a glass before each meal",
            "Set hourly reminders on your phone",
            "Track your intake for one week"
          ],
          priority: "high",
          timeToComplete: "Throughout the day",
          difficulty: "easy"
        },
        {
          category: "mindfulness",
          title: "5-Minute Breathing Reset",
          description: "Use simple breathing techniques to manage stress and improve focus.",
          actionSteps: [
            "Find a quiet spot",
            "Breathe in for 4 counts, hold for 4, exhale for 6",
            "Repeat for 5 minutes",
            "Use during stressful moments"
          ],
          priority: "medium",
          timeToComplete: "5 minutes",
          difficulty: "easy"
        },
        {
          category: "productivity",
          title: "Time Blocking Basics",
          description: "Organize your day with focused work blocks for better efficiency.",
          actionSteps: [
            "List your top 3 priorities each morning",
            "Assign specific time blocks to each task",
            "Set timers for each block",
            "Take 5-minute breaks between blocks"
          ],
          priority: "medium",
          timeToComplete: "15 minutes planning",
          difficulty: "medium"
        },
        {
          category: "goals",
          title: "Weekly Progress Review",
          description: "Regular check-ins to stay aligned with your long-term objectives.",
          actionSteps: [
            "Schedule 15 minutes every Sunday",
            "Review last week's accomplishments",
            "Identify what worked and what didn't",
            "Set 3 priorities for the upcoming week"
          ],
          priority: "medium",
          timeToComplete: "15 minutes weekly",
          difficulty: "easy"
        }
      ],
      personalizedMessage: "These suggestions are designed to build sustainable wellness habits. Start with one or two that resonate most with you, then gradually add others as they become routine. Remember, small consistent actions create lasting transformation.",
      focusArea: "Building Sustainable Daily Habits"
    };
  }
}