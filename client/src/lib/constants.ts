export const WORKFLOW_STEPS = [
  {
    id: 1,
    title: "Brainstorm Ideas",
    description: "Explore possibilities and capture your aspirations",
    icon: "fas fa-lightbulb",
    path: "/step/1",
  },
  {
    id: 2,
    title: "Create SMART Goals",
    description: "Transform your best ideas into structured goals",
    icon: "fas fa-target",
    path: "/step/2",
  },
  {
    id: 3,
    title: "Break Into Tasks",
    description: "Divide each goal into actionable tasks",
    icon: "fas fa-tasks",
    path: "/step/3",
  },
  {
    id: 4,
    title: "Track Progress",
    description: "Monitor your journey with detailed analytics",
    icon: "fas fa-chart-line",
    path: "/step/4",
  },
  {
    id: 5,
    title: "Collaborate & Share",
    description: "Share goals and get accountability support",
    icon: "fas fa-users",
    path: "/step/5",
  },
  {
    id: 6,
    title: "Achieve & Review",
    description: "Celebrate achievements and conduct reviews",
    icon: "fas fa-trophy",
    path: "/step/6",
  },
];

export const PRIORITIES = [
  { value: "high", label: "High Priority", color: "text-red-600" },
  { value: "medium", label: "Medium Priority", color: "text-yellow-600" },
  { value: "low", label: "Low Priority", color: "text-green-600" },
];

export const TASK_STATUSES = [
  { value: "pending", label: "Pending", color: "text-gray-600" },
  { value: "in_progress", label: "In Progress", color: "text-blue-600" },
  { value: "completed", label: "Completed", color: "text-green-600" },
];

export const GOAL_STATUSES = [
  { value: "active", label: "Active", color: "text-blue-600" },
  { value: "completed", label: "Completed", color: "text-green-600" },
  { value: "paused", label: "Paused", color: "text-yellow-600" },
];

export const HABIT_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const MOOD_OPTIONS = [
  { value: 1, label: "😞 Very Low", emoji: "😞" },
  { value: 2, label: "😟 Low", emoji: "😟" },
  { value: 3, label: "😐 Poor", emoji: "😐" },
  { value: 4, label: "🙂 Fair", emoji: "🙂" },
  { value: 5, label: "😊 Good", emoji: "😊" },
  { value: 6, label: "😄 Great", emoji: "😄" },
  { value: 7, label: "🤩 Excellent", emoji: "🤩" },
  { value: 8, label: "🚀 Amazing", emoji: "🚀" },
  { value: 9, label: "🌟 Outstanding", emoji: "🌟" },
  { value: 10, label: "🎉 Perfect", emoji: "🎉" },
];

export const DEMO_USER_ID = 1;
