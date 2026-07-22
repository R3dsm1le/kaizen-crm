"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Company } from "@/db";
import { moveStageAction } from "@/app/actions/companies";
import { STAGE_LABELS, STAGES, type Stage } from "@/types";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";

export function KanbanBoard({ companies }: { companies: Company[] }) {
  const router = useRouter();
  // Optimistic board state — server truth arrives via router.refresh().
  const [items, setItems] = React.useState(companies);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => setItems(companies), [companies]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStage = React.useMemo(() => {
    const map = new Map<Stage, Company[]>(STAGES.map((s) => [s, []]));
    for (const company of items) {
      map.get(company.stage as Stage)?.push(company);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (b.leadScore ?? -1) - (a.leadScore ?? -1));
    }
    return map;
  }, [items]);

  const onDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const companyId = String(active.id);
    const targetStage = String(over.id) as Stage;
    const company = items.find((c) => c.id === companyId);
    if (!company || !STAGES.includes(targetStage) || company.stage === targetStage) return;

    const previous = items;
    setItems((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, stage: targetStage } : c))
    );
    try {
      await moveStageAction(companyId, targetStage);
      router.refresh();
    } catch (error) {
      setItems(previous);
      toast.error(error instanceof Error ? error.message : "Failed to move lead");
    }
  };

  const activeCompany = activeId ? items.find((c) => c.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-full gap-3 overflow-x-auto px-4 pb-6 md:px-8">
        {STAGES.map((stage) => (
          <KanbanColumn key={stage} stage={stage} companies={byStage.get(stage) ?? []} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCompany && (
          <div className="rotate-2 opacity-95">
            <KanbanCard company={activeCompany} overlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ stage, companies }: { stage: Stage; companies: Company[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex w-60 shrink-0 flex-col">
      <div className="flex items-center gap-2 px-1 pb-2">
        <h3 className="text-xs font-semibold text-muted-foreground">{STAGE_LABELS[stage]}</h3>
        <span className="text-[11px] tabular-nums text-muted-foreground/60">{companies.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-lg p-1 transition-colors",
          isOver ? "bg-brand/8 ring-1 ring-brand/25" : "bg-muted/40"
        )}
      >
        {companies.map((company) => (
          <DraggableCard key={company.id} company={company} />
        ))}
        {companies.length === 0 && <div className="min-h-16" />}
      </div>
    </div>
  );
}

function DraggableCard({ company }: { company: Company }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: company.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("touch-none", isDragging && "opacity-30")}
    >
      <KanbanCard company={company} />
    </div>
  );
}
