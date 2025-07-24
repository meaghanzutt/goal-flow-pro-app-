import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, AlertTriangle, CheckCircle2, ArrowDown } from "lucide-react";

interface SuggestedTask {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  urgency: "urgent" | "not_urgent";
  importance: "important" | "not_important";
  estimatedHours: number;
}

interface EisenhowerMatrixProps {
  tasks: SuggestedTask[];
  onAddTask: (task: SuggestedTask) => void;
  loading?: boolean;
}

export function EisenhowerMatrix({ tasks, onAddTask, loading }: EisenhowerMatrixProps) {
  // Categorize tasks by urgency and importance
  const urgent_important = tasks.filter(t => t.urgency === "urgent" && t.importance === "important");
  const not_urgent_important = tasks.filter(t => t.urgency === "not_urgent" && t.importance === "important");
  const urgent_not_important = tasks.filter(t => t.urgency === "urgent" && t.importance === "not_important");
  const not_urgent_not_important = tasks.filter(t => t.urgency === "not_urgent" && t.importance === "not_important");

  const MatrixQuadrant = ({ 
    title, 
    subtitle, 
    tasks: quadrantTasks, 
    bgColor, 
    icon: Icon,
    priority 
  }: {
    title: string;
    subtitle: string;
    tasks: SuggestedTask[];
    bgColor: string;
    icon: any;
    priority: "high" | "medium" | "low";
  }) => (
    <Card className={`${bgColor} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center">
          <Icon className="mr-2" size={16} />
          {title}
        </CardTitle>
        <p className="text-xs text-gray-600 font-medium">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {quadrantTasks.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No tasks in this quadrant</p>
        ) : (
          quadrantTasks.map((task, index) => (
            <div
              key={index}
              className="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 leading-tight">
                  {task.title}
                </h4>
                <Badge variant={priority === "high" ? "destructive" : priority === "medium" ? "default" : "secondary"} className="text-xs">
                  {priority}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                {task.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock size={12} className="mr-1" />
                  {task.estimatedHours}h
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddTask(task)}
                  className="text-xs px-2 py-1 h-7"
                >
                  <Plus size={12} className="mr-1" />
                  Add
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
          <span className="ml-3 text-gray-600">AI is analyzing your goal and generating task suggestions...</span>
        </div>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">No AI task suggestions available.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🤖 AI Task Suggestions - Eisenhower Matrix
        </h3>
        <p className="text-sm text-gray-600">
          Organize your tasks by urgency and importance for maximum productivity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quadrant 1: Urgent + Important (Do First) */}
        <MatrixQuadrant
          title="Do First"
          subtitle="Urgent & Important"
          tasks={urgent_important}
          bgColor="bg-red-50 border-red-200"
          icon={AlertTriangle}
          priority="high"
        />

        {/* Quadrant 2: Not Urgent + Important (Schedule) */}
        <MatrixQuadrant
          title="Schedule"
          subtitle="Important, Not Urgent"
          tasks={not_urgent_important}
          bgColor="bg-blue-50 border-blue-200"
          icon={CheckCircle2}
          priority="medium"
        />

        {/* Quadrant 3: Urgent + Not Important (Delegate) */}
        <MatrixQuadrant
          title="Delegate"
          subtitle="Urgent, Not Important"
          tasks={urgent_not_important}
          bgColor="bg-yellow-50 border-yellow-200"
          icon={ArrowDown}
          priority="medium"
        />

        {/* Quadrant 4: Not Urgent + Not Important (Eliminate) */}
        <MatrixQuadrant
          title="Eliminate"
          subtitle="Neither Urgent nor Important"
          tasks={not_urgent_not_important}
          bgColor="bg-gray-50 border-gray-200"
          icon={ArrowDown}
          priority="low"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Eisenhower Matrix Tips:</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li><strong>Do First:</strong> Handle these immediately - they're crucial and time-sensitive</li>
          <li><strong>Schedule:</strong> Plan dedicated time for these important but not urgent tasks</li>
          <li><strong>Delegate:</strong> These are urgent but consider if someone else can handle them</li>
          <li><strong>Eliminate:</strong> Question if these tasks are truly necessary</li>
        </ul>
      </div>
    </div>
  );
}