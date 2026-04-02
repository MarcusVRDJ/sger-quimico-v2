import type { RevisaoRow, TemplateRow } from "@/components/checklist-templates/types";
import { getChecklistTypeLabel } from "@/components/checklist-templates/labels";

interface RevisionListSectionProps {
  templateSelecionado: TemplateRow | null;
  revisoes: RevisaoRow[];
  onSubmitRevision: (revisaoId: string) => void;
  onApproveRevision: (revisaoId: string) => void;
  onRejectRevision: (revisaoId: string) => void;
}

export function RevisionListSection({
  templateSelecionado,
  revisoes,
  onSubmitRevision,
  onApproveRevision,
  onRejectRevision,
}: RevisionListSectionProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">
          {templateSelecionado
            ? `Revisões • ${getChecklistTypeLabel(templateSelecionado.tipoChecklist)}`
            : "Revisões"}
        </h3>
      </div>
      <div className="divide-y divide-border">
        {revisoes.map((revisao) => (
          <div key={revisao.id} className="px-4 py-3 space-y-2">
            <p className="text-sm font-medium text-foreground">
              v{revisao.versao} • {revisao.status}
            </p>
            {revisao.resumoMudancas && (
              <p className="text-xs text-muted-foreground">{revisao.resumoMudancas}</p>
            )}
            <div className="flex gap-2">
              {(revisao.status === "RASCUNHO" || revisao.status === "REJEITADO") && (
                <button
                  onClick={() => onSubmitRevision(revisao.id)}
                  className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md"
                >
                  Submeter
                </button>
              )}
              {revisao.status === "PENDENTE_APROVACAO" && (
                <>
                  <button
                    onClick={() => onApproveRevision(revisao.id)}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-md"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => onRejectRevision(revisao.id)}
                    className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-md"
                  >
                    Rejeitar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {revisoes.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">
            Selecione um template para visualizar as revisões.
          </div>
        )}
      </div>
    </div>
  );
}
