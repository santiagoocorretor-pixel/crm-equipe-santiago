import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import CRMLayout from "@/components/CRMLayout";

export default function Brokers() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedBroker, setSelectedBroker] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    creci: "",
    commission: "",
    notes: "",
  });

  const { data: brokers, refetch } = trpc.brokers.list.useQuery();
  const { data: brokerStats } = trpc.brokers.getStats.useQuery(
    { brokerId: selectedBroker || 0 },
    { enabled: !!selectedBroker }
  );

  const createMutation = trpc.brokers.create.useMutation({
    onSuccess: () => {
      toast.success("Corretor criado com sucesso!");
      setIsOpen(false);
      setFormData({ name: "", email: "", phone: "", creci: "", commission: "", notes: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar corretor");
    },
  });

  const updateMutation = trpc.brokers.update.useMutation({
    onSuccess: () => {
      toast.success("Corretor atualizado com sucesso!");
      setIsOpen(false);
      setEditingId(null);
      setFormData({ name: "", email: "", phone: "", creci: "", commission: "", notes: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar corretor");
    },
  });

  const deleteMutation = trpc.brokers.delete.useMutation({
    onSuccess: () => {
      toast.success("Corretor deletado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar corretor");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        creci: formData.creci || undefined,
        commission: formData.commission ? parseFloat(formData.commission) : undefined,
        notes: formData.notes || undefined,
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        creci: formData.creci || undefined,
        commission: formData.commission ? parseFloat(formData.commission) : undefined,
        notes: formData.notes || undefined,
      });
    }
  };

  const handleEdit = (broker: any) => {
    setEditingId(broker.id);
    setFormData({
      name: broker.name,
      email: broker.email,
      phone: broker.phone || "",
      creci: broker.creci || "",
      commission: broker.commission || "",
      notes: broker.notes || "",
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este corretor?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({ name: "", email: "", phone: "", creci: "", commission: "", notes: "" });
  };

  return (
    <CRMLayout activeTab="dashboard">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Corretores</h1>
            <p className="text-slate-600 mt-1">Gerencie seus corretores e acompanhe seus negócios</p>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Adicionar Corretor
          </Button>
        </div>

        {selectedBroker && brokerStats && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-slate-900 mb-4">Estatísticas do Corretor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Total de Leads</p>
                <p className="text-2xl font-bold text-blue-600">{brokerStats.totalLeads}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Leads por Etapa</p>
                <div className="space-y-1 mt-2">
                  {brokerStats.leadsByStage.map((stage: any) => (
                    <div key={stage.stageId} className="flex justify-between text-sm">
                      <span className="text-slate-700">{stage.stageName}:</span>
                      <span className="font-semibold text-slate-900">{stage.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brokers?.map((broker) => (
            <Card
              key={broker.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedBroker(broker.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{broker.name}</h3>
                  <p className="text-sm text-slate-600">{broker.email}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    broker.status === "active"
                      ? "bg-green-100 text-green-800"
                      : broker.status === "inactive"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {broker.status === "active" ? "Ativo" : broker.status === "inactive" ? "Inativo" : "Suspenso"}
                </span>
              </div>

              {broker.phone && (
                <p className="text-sm text-slate-600 mb-2">
                  <span className="font-medium">Telefone:</span> {broker.phone}
                </p>
              )}

              {broker.creci && (
                <p className="text-sm text-slate-600 mb-2">
                  <span className="font-medium">CRECI:</span> {broker.creci}
                </p>
              )}

              {broker.commission && (
                <p className="text-sm text-slate-600 mb-4">
                  <span className="font-medium">Comissão:</span> {broker.commission}%
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(broker);
                  }}
                  className="flex-1 flex items-center justify-center gap-1"
                >
                  <Edit2 size={16} />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(broker.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                  Deletar
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {(!brokers || brokers.length === 0) && (
          <Card className="p-12 text-center">
            <p className="text-slate-600 mb-4">Nenhum corretor cadastrado ainda</p>
            <Button
              onClick={() => setIsOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              Adicionar Primeiro Corretor
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Corretor" : "Adicionar Novo Corretor"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
              <Input
                type="text"
                placeholder="Nome do corretor"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
              <Input
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CRECI</label>
              <Input
                type="text"
                placeholder="Número de registro"
                value={formData.creci}
                onChange={(e) => setFormData({ ...formData, creci: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comissão (%)</label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
              <textarea
                placeholder="Observações sobre o corretor"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

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
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  );
}
