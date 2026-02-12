import { useState } from "react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, MessageSquare, Phone, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const interactionSchema = z.object({
  leadId: z.number(),
  type: z.enum(["email", "phone_call", "meeting", "whatsapp", "linkedin", "note"]),
  subject: z.string().optional(),
  description: z.string().optional(),
  result: z.string().optional(),
});

const leadEditSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.string().optional(),
  property: z.string().optional(),
  estimatedValue: z.string().optional(),
  notes: z.string().optional(),
});

type InteractionFormData = z.infer<typeof interactionSchema>;
type LeadEditFormData = z.infer<typeof leadEditSchema>;

export default function History() {
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: leads } = trpc.leads.list.useQuery({});
  const { data: interactions, refetch: refetchInteractions } = trpc.interactions.listByLead.useQuery(
    { leadId: selectedLeadId || 0 },
    { enabled: !!selectedLeadId }
  );
  const { data: selectedLead } = trpc.leads.get.useQuery(
    { id: selectedLeadId || 0 },
    { enabled: !!selectedLeadId }
  );

  const createInteraction = trpc.interactions.create.useMutation({
    onSuccess: () => {
      toast.success("Interação registrada com sucesso!");
      refetchInteractions();
      setIsInteractionDialogOpen(false);
      interactionForm.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar interação");
    },
  });

  const updateLead = trpc.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead atualizado com sucesso!");
      setIsEditDialogOpen(false);
      editForm.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar lead");
    },
  });

  const interactionForm = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      leadId: selectedLeadId || 0,
      type: "note",
    },
  });

  const editForm = useForm<LeadEditFormData>({
    resolver: zodResolver(leadEditSchema),
  });

  const onSubmitInteraction = async (data: InteractionFormData) => {
    await createInteraction.mutateAsync(data);
  };

  const onSubmitEdit = async (data: LeadEditFormData) => {
    if (!selectedLeadId) return;
    await updateLead.mutateAsync({
      id: selectedLeadId,
      ...data,
    });
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail size={18} className="text-blue-600" />;
      case "phone_call":
        return <Phone size={18} className="text-green-600" />;
      case "meeting":
        return <Calendar size={18} className="text-purple-600" />;
      case "whatsapp":
        return <MessageSquare size={18} className="text-green-500" />;
      case "linkedin":
        return <MessageSquare size={18} className="text-blue-700" />;
      case "note":
        return <MessageSquare size={18} className="text-slate-600" />;
      default:
        return <MessageSquare size={18} />;
    }
  };

  const getInteractionLabel = (type: string) => {
    switch (type) {
      case "email":
        return "Email";
      case "phone_call":
        return "Chamada";
      case "meeting":
        return "Reunião";
      case "whatsapp":
        return "WhatsApp";
      case "linkedin":
        return "LinkedIn";
      case "note":
        return "Nota";
      default:
        return type;
    }
  };

  return (
    <CRMLayout activeTab="leads">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Histórico de Interações</h1>
          <p className="text-slate-600 mt-1">Acompanhe todas as atividades com seus leads</p>
        </div>

        {/* Seleção de Lead */}
        <Card className="bg-white border-0 shadow-sm p-6">
          <label className="block text-sm font-medium text-slate-900 mb-2">Selecione um Lead</label>
          <Select value={selectedLeadId ? String(selectedLeadId) : ""} onValueChange={(v) => setSelectedLeadId(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um lead para ver o histórico" />
            </SelectTrigger>
            <SelectContent>
              {leads?.map((lead) => (
                <SelectItem key={lead.id} value={String(lead.id)}>
                  {lead.name} {lead.company && `(${lead.company})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Informações do Lead */}
        {selectedLead && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedLead.name}</h2>
                {selectedLead.company && <p className="text-slate-600 mt-1">{selectedLead.company}</p>}
                {selectedLead.property && (
                  <p className="text-sm text-slate-600 mt-2">
                    <strong>Imóvel:</strong> {selectedLead.property}
                  </p>
                )}
                {selectedLead.source && (
                  <p className="text-sm text-slate-600">
                    <strong>Fonte:</strong> {selectedLead.source}
                  </p>
                )}
                <div className="flex gap-4 mt-3 text-sm text-slate-600">
                  {selectedLead.email && <span>📧 {selectedLead.email}</span>}
                  {selectedLead.phone && <span>📱 {selectedLead.phone}</span>}
                  {selectedLead.estimatedValue && <span>💰 R$ {selectedLead.estimatedValue}</span>}
                </div>
              </div>
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Edit2 size={18} className="mr-2" />
                    Editar Lead
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Editar Lead</DialogTitle>
                  </DialogHeader>
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
                      <FormField
                        control={editForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="property"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Imóvel</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Apartamento 301 - Rua das Flores" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fonte do Lead</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Imobiliária XYZ, Indicado, Site" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
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

                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={updateLead.isPending}>
                        {updateLead.isPending ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        )}

        {/* Interações */}
        {selectedLeadId && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Histórico de Atividades</h2>
              <Dialog open={isInteractionDialogOpen} onOpenChange={setIsInteractionDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus size={18} className="mr-2" />
                    Registrar Atividade
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Registrar Nova Atividade</DialogTitle>
                  </DialogHeader>
                  <Form {...interactionForm}>
                    <form onSubmit={interactionForm.handleSubmit(onSubmitInteraction)} className="space-y-4">
                      <FormField
                        control={interactionForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Atividade</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="email">📧 Email</SelectItem>
                                <SelectItem value="phone_call">☎️ Chamada</SelectItem>
                                <SelectItem value="meeting">📅 Reunião</SelectItem>
                                <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                                <SelectItem value="linkedin">🔗 LinkedIn</SelectItem>
                                <SelectItem value="note">📝 Nota</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={interactionForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assunto</FormLabel>
                            <FormControl>
                              <Input placeholder="Assunto da atividade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={interactionForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Descreva a atividade realizada" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={interactionForm.control}
                        name="result"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resultado</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Sucesso, Sem resposta, Agendado" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={createInteraction.isPending}>
                        {createInteraction.isPending ? "Registrando..." : "Registrar Atividade"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Timeline de Interações */}
            <div className="space-y-3">
              {interactions && interactions.length > 0 ? (
                interactions.map((interaction: any) => (
                  <Card key={interaction.id} className="bg-white border-0 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getInteractionIcon(interaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {getInteractionLabel(interaction.type)}
                              {interaction.subject && ` - ${interaction.subject}`}
                            </p>
                            {interaction.description && (
                              <p className="text-sm text-slate-600 mt-1">{interaction.description}</p>
                            )}
                            {interaction.result && (
                              <p className="text-xs text-slate-500 mt-2">
                                <strong>Resultado:</strong> {interaction.result}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {formatDistanceToNow(new Date(interaction.createdAt), { locale: ptBR, addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p className="mb-2">Nenhuma atividade registrada</p>
                  <p className="text-sm">Clique em "Registrar Atividade" para começar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedLeadId && (
          <Card className="bg-slate-50 border border-slate-200 p-12 text-center">
            <p className="text-slate-500 text-lg">Selecione um lead acima para ver o histórico de atividades</p>
          </Card>
        )}
      </div>
    </CRMLayout>
  );
}
