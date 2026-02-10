import { useState, useEffect } from "react";
import { AlertCircle, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Task {
  id: number;
  title: string;
  dueDate?: Date | null;
  reminderTime?: Date | null;
  priority: "low" | "medium" | "high";
  hasAlert: boolean;
  status: "pending" | "completed" | "cancelled";
}

export default function TaskAlertBanner() {
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());

  const { data: tasks } = trpc.tasks.list.useQuery();
  const updateTask = trpc.tasks.update.useMutation();

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const now = new Date();
      const overdue = tasks.filter((task: Task) => {
        if (task.status !== "pending" || !task.hasAlert) return false;
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        return dueDate < now && !dismissedAlerts.has(task.id);
      });

      setOverdueTasks(overdue);
      setShowBanner(overdue.length > 0);
    }
  }, [tasks, dismissedAlerts]);

  const handleDismiss = (taskId: number) => {
    setDismissedAlerts((prev) => new Set(prev).add(taskId));
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: "completed",
      });
      toast.success("Tarefa marcada como concluída!");
      handleDismiss(taskId);
    } catch (error) {
      toast.error("Erro ao atualizar tarefa");
    }
  };

  if (!showBanner || overdueTasks.length === 0) {
    return null;
  }

  const priorityColors = {
    high: "bg-red-50 border-red-200",
    medium: "bg-yellow-50 border-yellow-200",
    low: "bg-blue-50 border-blue-200",
  };

  const priorityTextColors = {
    high: "text-red-700",
    medium: "text-yellow-700",
    low: "text-blue-700",
  };

  return (
    <div className={`${priorityColors[overdueTasks[0]?.priority || "medium"]} border rounded-lg p-4 mb-6`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Bell className={`${priorityTextColors[overdueTasks[0]?.priority || "medium"]} mt-0.5 flex-shrink-0`} size={20} />
          <div className="flex-1">
            <h3 className={`font-semibold ${priorityTextColors[overdueTasks[0]?.priority || "medium"]}`}>
              Você tem {overdueTasks.length} tarefa{overdueTasks.length !== 1 ? "s" : ""} vencida{overdueTasks.length !== 1 ? "s" : ""}
            </h3>
            <div className="mt-2 space-y-2">
              {overdueTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="text-sm text-slate-700">
                  <p className="font-medium">{task.title}</p>
                  {task.dueDate && (
                    <p className="text-xs text-slate-500">
                      Vencimento: {new Date(task.dueDate).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              ))}
              {overdueTasks.length > 3 && (
                <p className="text-xs text-slate-500 font-medium">
                  +{overdueTasks.length - 3} tarefa{overdueTasks.length - 3 !== 1 ? "s" : ""} vencida{overdueTasks.length - 3 !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCompleteTask(overdueTasks[0]?.id || 0)}
            className="text-xs"
          >
            Marcar Concluída
          </Button>
          <button
            onClick={() => handleDismiss(overdueTasks[0]?.id || 0)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
