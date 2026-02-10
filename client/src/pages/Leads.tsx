import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import KanbanBoard from "@/components/KanbanBoard";
import EditLeadModal from "@/components/EditLeadModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const leadSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  origin: z.string().optional(),
  estimatedValue: z.string().optional(),
  funnelStageId: z.number(),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface Lead {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  origin?: string | null;
  property?: string | null;
  source?: string | null;
  estimatedValue?: string | null;
  funnelStageId: number;
  createdAt?: Date;
  notes?: string | null;
}

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: stages, isLoading: stagesLoading } = trpc.funnelStages.list.useQuery();
  const { data: leads, isLoading: leadsLoading, refetch: refetchLeads } = trpc.leads.list.useQuery({
    stageId: selectedStage || undefined,
    search: searchTerm || undefined,
  });

  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead criado com sucesso!");
      refetchLeads();
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar lead");
    },
  });

  const updateLeadStage = trpc.leads.update.useMutation({
    onSuccess: () => {
      refetchLeads();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar etapa do lead");
    },
  });

  const deleteLead = trpc.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead deletado com sucesso!");
      refetchLeads();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar lead");
    },
  });

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      funnelStageId: stages?.[0]?.id || 1,
    },
  });

  useEffect(() => {
    if (stages && stages.length > 0 && !form.getValues("funnelStageId")) {
      form.setValue("funnelStageId", stages[0].id);
    }
  }, [stages, form]);

  const onSubmit = async (data: LeadFormData) => {
    await createLead.mutateAsync(data);
  };

  const handleUpdateLeadStage = async (leadId: number, stageId: number) => {
    return new Promise<void>((resolve, reject) => {
      updateLeadStage.mutate(
        { id: leadId, funnelStageId: stageId },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        }
      );
    });
  };

  const handleDeleteLead = async (leadId: number) => {
    return new Promise<void>((resolve, reject) => {
      deleteLead.mutate(
        { id: leadId },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        }
      );
    });
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditModalOpen(true);
  };

  return (
    <CRMLayout activeTab="leads">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Leads</h1>
            <p className="text-slate-600 mt-1">Gerencie seus contatos e oportunidades</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus size={18} className="mr-2" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Lead</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do contato" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="funnelStageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etapa</FormLabel>
                        <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stages?.map((stage) => (
                              <SelectItem key={stage.id} value={String(stage.id)}>
                                {stage.name}
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
                    name="estimatedValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Estimado</FormLabel>
                        <FormControl>
                          <Input placeholder="R$ 0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={createLead.isPending}>
                    {createLead.isPending ? "Criando..." : "Criar Lead"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedStage ? String(selectedStage) : "all"} onValueChange={(v) => setSelectedStage(v === "all" ? null : Number(v))}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Etapas</SelectItem>
              {stages?.map((stage) => (
                <SelectItem key={stage.id} value={String(stage.id)}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quadro Kanban */}
        {leadsLoading ? (
          <div className="text-center py-12 text-slate-500">
            Carregando leads...
          </div>
        ) : (
          <KanbanBoard
            leads={leads || []}
            stages={stages || []}
            onUpdateLeadStage={handleUpdateLeadStage}
            onDeleteLead={handleDeleteLead}
            onEditLead={handleEditLead}
            isLoading={leadsLoading}
          />
        )}
      </div>

      {/* Modal de Edição */}
      <EditLeadModal
        lead={selectedLead}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLead(null);
        }}
        onSuccess={() => {
          refetchLeads();
        }}
        stages={stages || []}
      />
    </CRMLayout>
  );
}
