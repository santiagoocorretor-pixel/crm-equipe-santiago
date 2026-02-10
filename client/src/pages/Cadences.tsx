import { useState } from "react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Zap } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const cadenceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
});

type CadenceFormData = z.infer<typeof cadenceSchema>;

export default function Cadences() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCadence, setSelectedCadence] = useState<number | null>(null);

  const { data: cadences, isLoading, refetch } = trpc.cadences.list.useQuery();
  const { data: cadenceSteps } = trpc.cadenceSteps.listByCadence.useQuery(
    { cadenceId: selectedCadence || 0 },
    { enabled: !!selectedCadence }
  );

  const createCadence = trpc.cadences.create.useMutation({
    onSuccess: () => {
      toast.success("Cadência criada com sucesso!");
      refetch();
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar cadência");
    },
  });

  const form = useForm<CadenceFormData>({
    resolver: zodResolver(cadenceSchema),
  });

  const onSubmit = async (data: CadenceFormData) => {
    await createCadence.mutateAsync(data);
  };

  return (
    <CRMLayout activeTab="cadences">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Cadências de Contato</h1>
            <p className="text-slate-600 mt-1">Crie sequências automatizadas de contato com seus leads</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus size={18} className="mr-2" />
                Nova Cadência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Nova Cadência</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Cadência</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Acompanhamento Inicial" {...field} />
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
                          <Textarea placeholder="Descreva o objetivo desta cadência" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={createCadence.isPending}>
                    {createCadence.isPending ? "Criando..." : "Criar Cadência"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Cadências */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              Carregando cadências...
            </div>
          ) : cadences && cadences.length > 0 ? (
            cadences.map((cadence) => (
              <Card
                key={cadence.id}
                className="bg-white border-0 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCadence(cadence.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Zap className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{cadence.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {cadence.isActive ? "Ativa" : "Inativa"}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    cadence.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {cadence.isActive ? "Ativa" : "Inativa"}
                  </div>
                </div>

                {cadence.description && (
                  <p className="text-sm text-slate-600 mb-4">{cadence.description}</p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit2 size={16} className="mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700">
                    <Trash2 size={16} className="mr-1" />
                    Deletar
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-500">
              <p className="mb-4">Nenhuma cadência criada ainda</p>
              <p className="text-sm">Crie sua primeira cadência para começar a automatizar contatos</p>
            </div>
          )}
        </div>

        {/* Detalhes da Cadência */}
        {selectedCadence && cadenceSteps && (
          <Card className="bg-white border-0 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Etapas da Cadência</h2>
            <div className="space-y-3">
              {cadenceSteps.length > 0 ? (
                cadenceSteps.map((step) => (
                  <div key={step.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="bg-blue-100 text-blue-600 font-semibold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      {step.stepNumber}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {step.type === "email" && "📧 Email"}
                        {step.type === "phone_call" && "☎️ Chamada"}
                        {step.type === "whatsapp" && "💬 WhatsApp"}
                        {step.type === "linkedin" && "🔗 LinkedIn"}
                      </p>
                      {step.subject && <p className="text-sm text-slate-600 mt-1">{step.subject}</p>}
                      <p className="text-xs text-slate-500 mt-2">Aguardar {step.delayDays} dias</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-slate-500">Nenhuma etapa definida</p>
              )}
            </div>
          </Card>
        )}
      </div>
    </CRMLayout>
  );
}
