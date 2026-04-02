import type { TemplateRow } from "@/components/checklist-templates/types";
import { getChecklistTypeLabel } from "@/components/checklist-templates/labels";

interface TemplateListSectionProps {
  carregando: boolean;
  templates: TemplateRow[];
  pendenciasTexto: string;
  onSelectTemplate: (template: TemplateRow) => void;
}

export function TemplateListSection({
  carregando,
  templates,
  pendenciasTexto,
  onSelectTemplate,
}: TemplateListSectionProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Templates</h3>
        <span className="text-xs text-muted-foreground">{pendenciasTexto}</span>
      </div>
      {carregando ? (
        <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <div className="divide-y divide-border">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="w-full text-left px-4 py-3 hover:bg-muted/40"
            >
              <p className="text-sm font-medium text-foreground">
                {getChecklistTypeLabel(template.tipoChecklist)}
              </p>
              <p className="text-xs text-muted-foreground">
                {template.tipoChecklist} • {new Date(template.updatedAt).toLocaleString("pt-BR")}
              </p>
            </button>
          ))}
          {templates.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">Nenhum template cadastrado.</div>
          )}
        </div>
      )}
    </div>
  );
}
