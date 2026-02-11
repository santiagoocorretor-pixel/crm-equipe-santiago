import { useState } from "react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, GripVertical, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const stageSchema = z.object({
  name: z.string().min(1, "Nome da etapa é obrigatório"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor inválida"),
});

type StageFormData = z.infer<typeof stageSchema>;

interface FunnelStage {
  id: number;
  name: string;
  order: number;
  color: string;
}

export default function FunnelConfig() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null);
  const [draggedStage, setDraggedStage] = useState<FunnelStage | null>(null);

  const { data: stages, isLoading, refetch } = trpc.funnelStages.list.useQuery();

  const createStage = trpc.funnelStages.create.useMutation({
    onSuccess: () => {
      toast.success("Etapa criada com sucesso!");
      refetch();
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar etapa");
    },
  });

  const updateStage = trpc.funnelStages.update.useMutation({
    onSuccess: () => {
      toast.success("Etapa atualizada com sucesso!");
      refetch();
      setEditingStage(null);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar etapa");
    },
  });

  const deleteStage = trpc.funnelStages.delete.useMutation({
    onSuccess: () => {
      toast.success("Etapa deletada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar etapa");
    },
  });

  const reorderStages = trpc.funnelStages.reorder.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao reordenar etapas");
    },
  });

  const form = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      name: "",
      color: "#3B82F6",
    },
  });

  const onSubmit = (data: StageFormData) => {
    if (editingStage) {
      updateStage.mutate({
        id: editingStage.id,
        ...data,
      });
    } else {
      createStage.mutate(data);
    }
  };

  const handleEdit = (stage: FunnelStage) => {
    setEditingStage(stage);
    form.reset({
      name: stage.name,
      color: stage.color,
    });
    setIsDialogOpen(true);
  };

  const handleDragStart = (stage: FunnelStage) => {
    setDraggedStage(stage);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStage: FunnelStage) => {
    if (!draggedStage || draggedStage.id === targetStage.id) return;

    const stagesList = stages || [];
    const draggedIndex = stagesList.findIndex(s => s.id === draggedStage.id);
    const targetIndex = stagesList.findIndex(s => s.id === targetStage.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newStages = [...stagesList];
    [newStages[draggedIndex], newStages[targetIndex]] = [newStages[targetIndex], newStages[draggedIndex]];

    const reorderData = newStages.map((stage, index) => ({
      id: stage.id,
      order: index,
    }));

    reorderStages.mutate({ stages: reorderData });
    setDraggedStage(null);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStage(null);
    form.reset();
  };

  return (
    <CRMLayout activeTab="dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurar Funil de Vendas</h1>
            <p className="text-muted-foreground mt-2">
              Customize as etapas do seu funil de vendas. Você pode adicionar, editar, deletar e reordenar as etapas.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingStage(null);
                  form.reset();
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Etapa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStage ? "Editar Etapa" : "Criar Nova Etapa"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Etapa</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Prospecção, Qualificação, etc" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input type="color" {...field} className="w-20 h-10" />
                          </FormControl>
                          <Input
                            type="text"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="#3B82F6"
                            className="flex-1"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createStage.isPending || updateStage.isPending}
                      className="flex-1"
                    >
                      {editingStage ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando etapas...</p>
          </div>
        ) : !stages || stages.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">Nenhuma etapa configurada ainda</p>
            <Button
              onClick={() => {
                setEditingStage(null);
                form.reset();
                setIsDialogOpen(true);
              }}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Primeira Etapa
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">
              {stages.length} etapa{stages.length !== 1 ? "s" : ""} configurada{stages.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  draggable
                  onDragStart={() => handleDragStart(stage)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(stage)}
                  className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow cursor-move"
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />

                  <div
                    className="w-6 h-6 rounded flex-shrink-0 border border-border"
                    style={{ backgroundColor: stage.color }}
                    title={stage.color}
                  />

                  <div className="flex-1">
                    <p className="font-medium text-foreground">{stage.name}</p>
                    <p className="text-sm text-muted-foreground">Posição: {stage.order + 1}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(stage)}
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja deletar a etapa "${stage.name}"?`)) {
                          deleteStage.mutate({ id: stage.id });
                        }
                      }}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Dicas</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Arraste as etapas para reordenar a sequência do funil</li>
            <li>• Escolha cores diferentes para cada etapa para melhor visualização</li>
            <li>• Você pode ter quantas etapas quiser no seu funil</li>
            <li>• As etapas aparecerão no Kanban na ordem configurada</li>
          </ul>
        </div>
      </div>
    </CRMLayout>
  );
}
