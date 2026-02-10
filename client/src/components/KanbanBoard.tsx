import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card } from "@/components/ui/card";
import { Trash2, GripVertical, User, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  isLoading?: boolean;
}

export default function KanbanBoard({
  leads,
  stages,
  onUpdateLeadStage,
  onDeleteLead,
  isLoading = false,
}: KanbanBoardProps) {
  const [leadsByStage, setLeadsByStage] = useState<Record<number, Lead[]>>({});
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  // Agrupar leads por etapa
  useEffect(() => {
    const grouped = stages.reduce((acc, stage) => {
      acc[stage.id] = leads.filter((lead) => lead.funnelStageId === stage.id);
      return acc;
    }, {} as Record<number, Lead[]>);
    setLeadsByStage(grouped);
  }, [leads, stages]);

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeLeadId = Number(active.id);
    const overStageId = Number(over.id);

    if (isNaN(activeLeadId) || isNaN(overStageId)) return;

    // Encontrar o lead sendo arrastado
    let activeLead: Lead | null = null;
    let activeStageId: number | null = null;

    for (const [stageId, stageLeads] of Object.entries(leadsByStage)) {
      const found = stageLeads.find((l) => l.id === activeLeadId);
      if (found) {
        activeLead = found;
        activeStageId = Number(stageId);
        break;
      }
    }

    if (!activeLead || activeStageId === null) return;

    // Se o lead está sendo movido para uma etapa diferente
    if (activeStageId !== overStageId) {
      setLeadsByStage((prev) => {
        const newState = { ...prev };
        // Remove do estágio anterior
        newState[activeStageId] = newState[activeStageId].filter(
          (l) => l.id !== activeLeadId
        );
        // Adiciona ao novo estágio
        newState[overStageId] = [
          ...newState[overStageId],
          { ...activeLead, funnelStageId: overStageId },
        ];
        return newState;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);

    if (!over) return;

    const activeLeadId = Number(active.id);
    const overStageId = Number(over.id);

    if (isNaN(activeLeadId) || isNaN(overStageId)) return;

    // Encontrar o estágio anterior do lead
    let previousStageId: number | null = null;
    for (const [stageId, stageLeads] of Object.entries(leadsByStage)) {
      if (stageLeads.some((l) => l.id === activeLeadId)) {
        previousStageId = Number(stageId);
        break;
      }
    }

    // Se a etapa mudou, atualizar no backend
    if (previousStageId !== null && previousStageId !== overStageId) {
      try {
        await onUpdateLeadStage(activeLeadId, overStageId);
        toast.success("Lead movido com sucesso!");
      } catch (error) {
        // Reverter mudança local em caso de erro
        setLeadsByStage((prev) => {
          const newState = { ...prev };
          const lead = newState[overStageId].find((l) => l.id === activeLeadId);
          if (lead) {
            newState[overStageId] = newState[overStageId].filter(
              (l) => l.id !== activeLeadId
            );
            newState[previousStageId] = [
              ...newState[previousStageId],
              { ...lead, funnelStageId: previousStageId },
            ];
          }
          return newState;
        });
        toast.error("Erro ao mover lead");
      }
    }
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragStart={(event: DragStartEvent) => setIsDragging(true)}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-8">
        {stages.map((stage) => (
          <div key={stage.id} className="flex flex-col h-full">
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

            {/* Área de Cards */}
            <SortableContext
              items={leadsByStage[stage.id]?.map((l) => l.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div
                className="bg-slate-50 border border-t-0 border-slate-200 rounded-b-lg flex-1 overflow-y-auto p-3 space-y-3 min-h-96"
                data-stage-id={stage.id}
              >
                {leadsByStage[stage.id] && leadsByStage[stage.id].length > 0 ? (
                  leadsByStage[stage.id].map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      stageId={stage.id}
                      isDragging={isDragging}
                      onDelete={() => handleDeleteLead(lead.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    <p className="mb-1">Nenhum lead</p>
                    <p className="text-xs">Arraste leads aqui</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  );
}

interface LeadCardProps {
  lead: Lead;
  stageId: number;
  isDragging: boolean;
  onDelete: () => void;
}

function LeadCard({ lead, stageId, isDragging, onDelete }: LeadCardProps) {
  return (
    <div
      draggable
      className={`bg-white border border-slate-200 rounded-lg p-4 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 transition-all group ${
        isDragging ? "opacity-50" : ""
      }`}
      data-lead-id={lead.id}
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
        <button
          onClick={onDelete}
          className="text-slate-400 hover:text-red-600 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
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
