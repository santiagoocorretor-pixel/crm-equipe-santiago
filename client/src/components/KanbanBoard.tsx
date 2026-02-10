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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: number;
  name: string;
  company?: string | null;
  estimatedValue?: string | null;
  email?: string | null;
  phone?: string | null;
  funnelStageId: number;
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {stages.map((stage) => (
          <div key={stage.id} className="flex flex-col">
            <Card className="bg-white border-0 shadow-sm p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded">
                  {leadsByStage[stage.id]?.length || 0}
                </span>
              </div>

              <SortableContext
                items={leadsByStage[stage.id]?.map((l) => l.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 flex-1 overflow-y-auto max-h-96" data-stage-id={stage.id}>
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
                    <div className="text-center py-8 text-slate-400 text-sm">
                      Nenhum lead nesta etapa
                    </div>
                  )}
                </div>
              </SortableContext>
            </Card>
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
      className={`bg-slate-50 border border-slate-200 rounded-lg p-3 cursor-move hover:shadow-md transition-all ${
        isDragging ? "opacity-50" : ""
      }`}
      data-lead-id={lead.id}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 truncate">{lead.name}</p>
          {lead.company && (
            <p className="text-xs text-slate-500 truncate">{lead.company}</p>
          )}
          {lead.email && (
            <p className="text-xs text-slate-500 truncate">{lead.email}</p>
          )}
          {lead.estimatedValue && (
            <p className="text-sm font-semibold text-green-600 mt-2">
              R$ {lead.estimatedValue}
            </p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-slate-400 hover:text-red-600 transition-colors flex-shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
