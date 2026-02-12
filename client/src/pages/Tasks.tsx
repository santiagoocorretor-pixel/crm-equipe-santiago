import { useState } from "react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import TaskAlertBanner from "@/components/TaskAlertBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const taskSchema = z.object({
  leadId: z.number(),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function Tasks() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: tasks, isLoading, refetch } = trpc.tasks.listPending.useQuery();
  const { data: leads } = trpc.leads.list.useQuery({});

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada com sucesso!");
      refetch();
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar tarefa");
    },
  });

  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Tarefa atualizada!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar tarefa");
    },
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: "medium",
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
    await createTask.mutateAsync({
      ...data,
      dueDate,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
      default:
        return priority;
    }
  };

  const pendingTasks = tasks?.filter(t => t.status === "pending") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];

  return (
    <CRMLayout activeTab="tasks">
      <div className="space-y-6">
        {/* Banner de Alertas */}
        <TaskAlertBanner />

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tarefas</h1>
            <p className="text-slate-600 mt-1">Gerencie suas atividades e lembretes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus size={18} className="mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Nova Tarefa</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="leadId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead</FormLabel>
                        <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um lead" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leads?.map((lead) => (
                              <SelectItem key={lead.id} value={String(lead.id)}>
                                {lead.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Título da tarefa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descreva a tarefa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={createTask.isPending}>
                    {createTask.isPending ? "Criando..." : "Criar Tarefa"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tarefas Pendentes */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Tarefas Pendentes</h2>
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-center py-8 text-slate-500">Carregando tarefas...</p>
            ) : pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <Card key={task.id} className="bg-white border-0 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() =>
                        updateTask.mutate({
                          id: task.id,
                          status: "completed",
                          completedAt: new Date(),
                        })
                      }
                      className="mt-1 text-slate-400 hover:text-green-600 transition-colors flex-shrink-0"
                    >
                      <Circle size={24} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-slate-500 mt-2">
                          Vencimento: {formatDistanceToNow(new Date(task.dueDate), { locale: ptBR, addSuffix: true })}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      <button
                        onClick={() => updateTask.mutate({ id: task.id, status: "cancelled" })}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="mb-2">Nenhuma tarefa pendente</p>
                <p className="text-sm">Você está em dia com suas atividades!</p>
              </div>
            )}
          </div>
        </div>

        {/* Tarefas Concluídas */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Tarefas Concluídas</h2>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <Card key={task.id} className="bg-slate-50 border border-slate-200 p-4 opacity-75">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 text-green-600 flex-shrink-0">
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 line-through">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-slate-600 mt-1 line-through">{task.description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}
