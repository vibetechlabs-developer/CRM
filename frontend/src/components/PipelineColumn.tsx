import { useDroppable } from "@dnd-kit/core";
import { PipelineStage } from "@/lib/data";

interface PipelineColumnProps {
    id: PipelineStage;
    children: React.ReactNode;
}

export function PipelineColumn({ id, children }: PipelineColumnProps) {
    const { isOver, setNodeRef } = useDroppable({
        id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`space-y-3 p-3 flex-1 overflow-y-auto pipeline-scrollbar shadow-inner rounded-xl border transition-colors lg:max-h-[850px] min-h-[400px] md:min-h-[500px] ${isOver ? "bg-secondary/60 border-primary" : "bg-secondary/40 border-transparent"
                }`}
        >
            {children}
        </div>
    );
}
