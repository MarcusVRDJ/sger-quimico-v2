import type { ChecklistTemplateDefinition } from "@/lib/checklist-template-definition";
import { buildChecklistPreviewModel } from "@/components/checklist-templates/preview-model";

interface ChecklistPreviewPanelProps {
  definition: ChecklistTemplateDefinition | null;
}

export function ChecklistPreviewPanel({ definition }: ChecklistPreviewPanelProps) {
  if (!definition) {
    return (
      <aside className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Selecione um template</h3>
        </div>
        <div className="p-5 text-sm text-muted-foreground space-y-3">
          <p>
            Aqui vai aparecer a leitura final do checklist, no estilo “antes de publicar”.
          </p>
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
            O preview espelha o formulário em tempo real conforme você edita título, seções e campos.
          </div>
        </div>
      </aside>
    );
  }

  const preview = buildChecklistPreviewModel(definition);

  return (
    <aside className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden sticky top-6">
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Preview ao vivo</p>
        <h3 className="mt-1 text-xl font-semibold leading-tight">{preview.title}</h3>
        <p className="mt-2 text-sm text-slate-300">
          {preview.sectionCount} seção(ões) • {preview.fieldCount} campo(s) • v{preview.schemaVersion}
        </p>
      </div>

      <div className="p-5 space-y-4 bg-gradient-to-b from-background to-muted/20">
        {preview.description && (
          <p className="text-sm text-muted-foreground">
            {preview.description}
          </p>
        )}

        <div className="space-y-4">
          {preview.sections.map((section, sectionIndex) => (
            <section key={section.id + sectionIndex} className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Seção {sectionIndex + 1}
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-foreground">{section.title}</h4>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {section.fields.length} pergunta(s)
                </span>
              </div>

              {section.description && (
                <p className="mt-3 text-sm text-muted-foreground">{section.description}</p>
              )}

              <div className="mt-4 space-y-3">
                {section.fields.map((field) => (
                  <article key={field.key} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{field.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {field.typeLabel}{field.required ? " • obrigatório" : " • opcional"}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-medium text-white">
                        {field.key}
                      </span>
                    </div>

                    {field.optionCount > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Array.from({ length: field.optionCount }).map((_, optionIndex) => (
                          <span
                            key={`${field.key}-${optionIndex}`}
                            className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
                          >
                            Opção {optionIndex + 1}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </aside>
  );
}
