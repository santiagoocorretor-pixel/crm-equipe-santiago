import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Trash2, GripVertical, DollarSign, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface Lead {
  id: number;
  name: string;
  company?: string | null;
  estimatedValue?: string | null;
  email?: string | null;
  phone?: string | null;
  funnelStageId: number;
  createdAt?: Date;
}

interface Stage {
  id: number;
  name: string;
  order: number;
}

interface KanbanBoardProps {
  leads: Lead[];
  stages: Stage[];
  onUpdateLeadStage: (leadId: number, stageId: number) => Promise<void>;
  onDeleteLead: (leadId: number) => Promise<void>;
  onEditLead?: (lead: Lead) => void;
  isLoading?: boolean;
}

export default function KanbanBoard({
  leads,
  stages,
  onUpdateLeadStage,
  onDeleteLead,
  onEditLead,
  isLoading = false,
}: KanbanBoardProps) {
  const [leadsByStage, setLeadsByStage] = useState<Record<number, Lead[]>>({});
  const [draggedLead, setDraggedLead] = useState<{ leadId: number; fromStageId: number } | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<number | null>(null);

  // Agrupar leads por etapa
  useEffect(() => {
    const grouped = stages.reduce((acc, stage) => {
      acc[stage.id] = leads.filter((lead) => lead.funnelStageId === stage.id);
      return acc;
    }, {} as Record<number, Lead[]>);
    setLeadsByStage(grouped);
  }, [leads, stages]);

  const handleDragStart = (leadId: number, stageId: number) => {
    setDraggedLead({ leadId, fromStageId: stageId });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stageId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, toStageId: number) => {
    e.preventDefault();
    setDragOverStageId(null);

    if (!draggedLead) return;

    const { leadId, fromStageId } = draggedLead;

    // Se for a mesma etapa, não faz nada
    if (fromStageId === toStageId) {
      setDraggedLead(null);
      return;
    }

    // Atualizar estado local otimisticamente
    setLeadsByStage((prev) => {
      const newState = { ...prev };
      const lead = newState[fromStageId]?.find((l) => l.id === leadId);
      
      if (lead) {
        newState[fromStageId] = newState[fromStageId].filter((l) => l.id !== leadId);
        newState[toStageId] = [...(newState[toStageId] || []), { ...lead, funnelStageId: toStageId }];
      }
      
      return newState;
    });

    // Atualizar no backend
    try {
      await onUpdateLeadStage(leadId, toStageId);
      toast.success("Lead movido com sucesso!");
    } catch (error) {
      // Reverter em caso de erro
      setLeadsByStage((prev) => {
        const newState = { ...prev };
        const lead = newState[toStageId]?.find((l) => l.id === leadId);
        
        if (lead) {
          newState[toStageId] = newState[toStageId].filter((l) => l.id !== leadId);
          newState[fromStageId] = [...(newState[fromStageId] || []), { ...lead, funnelStageId: fromStageId }];
        }
        
        return newState;
      });
      toast.error("Erro ao mover lead");
    }

    setDraggedLead(null);
  };

  const handleDeleteLead = async (leadId: number) => {
    try {
      await onDeleteLead(leadId);
      toast.success("Lead deletado com sucesso!");
    } catch (error) {
      toast.error("Erro ao deletar lead");
    }
  };

  return (
    <div className="overflow-x-auto pb-8">
      <div className="flex gap-4 min-w-max">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex flex-col h-full min-w-[350px] max-w-[350px]"
          >
            {/* Cabeçalho da Coluna */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-t-lg border border-slate-200 p-4 mb-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{stage.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {leadsByStage[stage.id]?.length || 0} lead{(leadsByStage[stage.id]?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="bg-white rounded-full px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                  {leadsByStage[stage.id]?.length || 0}
                </div>
              </div>
            </div>

            {/* Área de Cards - Droppable Zone */}
            <div
              className={`bg-slate-50 border border-t-0 border-slate-200 rounded-b-lg flex-1 overflow-y-auto p-3 space-y-3 min-h-96 transition-all ${
                dragOverStageId === stage.id ? "bg-blue-50 border-blue-300" : "hover:bg-slate-100"
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {leadsByStage[stage.id] && leadsByStage[stage.id].length > 0 ? (
                leadsByStage[stage.id].map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isDragging={draggedLead?.leadId === lead.id}
                    onDragStart={() => handleDragStart(lead.id, stage.id)}
                    onDelete={() => handleDeleteLead(lead.id)}
                    onEdit={() => onEditLead?.(lead)}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <p className="mb-1">Nenhum lead</p>
                  <p className="text-xs">Arraste leads aqui</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LeadCardProps {
  lead: Lead;
  isDragging: boolean;
  onDragStart: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function LeadCard({ lead, isDragging, onDragStart, onDelete, onEdit }: LeadCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`bg-white border border-slate-200 rounded-lg p-4 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 transition-all group ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
    >
      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <GripVertical size={16} className="text-slate-400 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate leading-tight">{lead.name}</p>
            {lead.company && (
              <p className="text-xs text-slate-500 truncate mt-1">{lead.company}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0 p-1"
            title="Editar lead"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="text-slate-400 hover:text-red-600 transition-colors flex-shrink-0 p-1"
            title="Deletar lead"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Informações do Lead */}
      <div className="space-y-2 mb-3">
        {lead.email && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-4 h-4 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">✉</span>
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-4 h-4 rounded bg-green-50 flex items-center justify-center flex-shrink-0">📱</span>
            <span className="truncate">{lead.phone}</span>
          </div>
        )}
      </div>

      {/* Rodapé do Card */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        {lead.estimatedValue ? (
          <div className="flex items-center gap-1">
            <DollarSign size={14} className="text-green-600" />
            <span className="text-sm font-semibold text-green-600">R$ {lead.estimatedValue}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Sem valor</span>
        )}
        {lead.createdAt && (
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(lead.createdAt), { locale: ptBR, addSuffix: false })}
          </span>
        )}
      </div>
    </div>
  );
}
