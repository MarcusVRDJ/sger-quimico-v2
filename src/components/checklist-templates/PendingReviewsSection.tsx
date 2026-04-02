import type { PendenteRow } from "@/components/checklist-templates/types";
import { getChecklistTypeLabel } from "@/components/checklist-templates/labels";

interface PendingReviewsSectionProps {
  pendentes: PendenteRow[];
  onApprove: (revisaoId: string) => void;
  onReject: (revisaoId: string) => void;
}

export function PendingReviewsSection({
  pendentes,
  onApprove,
  onReject,
}: PendingReviewsSectionProps) {
  return (
    <section className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Pendências de Aprovação</h3>
      </div>
      <div className="divide-y divide-border">
        {pendentes.map((pendente) => (
          <div key={pendente.id} className="px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {getChecklistTypeLabel(pendente.tipoChecklist)} • v{pendente.versao}
              </p>
              <p className="text-xs text-muted-foreground">
                Criada em {new Date(pendente.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(pendente.id)}
                className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-md"
              >
                Aprovar
              </button>
              <button
                onClick={() => onReject(pendente.id)}
                className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-md"
              >
                Rejeitar
              </button>
            </div>
          </div>
        ))}

        {pendentes.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">
            Nenhuma revisão pendente no momento.
          </div>
        )}
      </div>
    </section>
  );
}
