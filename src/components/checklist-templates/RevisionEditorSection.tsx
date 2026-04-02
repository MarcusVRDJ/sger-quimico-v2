"use client";

import type { ChecklistTemplateDefinition } from "@/lib/checklist-template-definition";
import type { TemplateField, TemplateRow, TemplateSection } from "@/components/checklist-templates/types";

interface RevisionEditorSectionProps {
  templateSelecionado: TemplateRow | null;
  editorDefinition: ChecklistTemplateDefinition | null;
  editorSourceRevisionId: string;
  editorResumo: string;
  revisoes: Array<{ id: string; versao: number; status: string }>;
  salvandoRevisao: boolean;
  onChangeRevisionSource: (revisaoId: string) => void;
  onChangeResumo: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onAddSection: () => void;
  onRemoveSection: (sectionIndex: number) => void;
  onUpdateSection: (sectionIndex: number, mutator: (section: TemplateSection) => TemplateSection) => void;
  onAddField: (sectionIndex: number) => void;
  onRemoveField: (sectionIndex: number, fieldIndex: number) => void;
  onUpdateField: (
    sectionIndex: number,
    fieldIndex: number,
    mutator: (field: TemplateField) => TemplateField
  ) => void;
  onSaveDraft: () => void;
  onSaveAndSubmit: () => void;
}

export function RevisionEditorSection({
  templateSelecionado,
  editorDefinition,
  editorSourceRevisionId,
  editorResumo,
  revisoes,
  salvandoRevisao,
  onChangeRevisionSource,
  onChangeResumo,
  onChangeTitle,
  onChangeDescription,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
  onAddField,
  onRemoveField,
  onUpdateField,
  onSaveDraft,
  onSaveAndSubmit,
}: RevisionEditorSectionProps) {
  return (
    <section className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Editor de Revisão</h3>
          <p className="text-xs text-muted-foreground">
            Edite seções e campos e salve uma nova revisão sequencial.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSaveDraft}
            disabled={!templateSelecionado || !editorDefinition || salvandoRevisao}
            className="bg-primary disabled:opacity-50 text-primary-foreground text-xs px-3 py-1.5 rounded-md"
          >
            Salvar Revisão
          </button>
          <button
            onClick={onSaveAndSubmit}
            disabled={!templateSelecionado || !editorDefinition || salvandoRevisao}
            className="bg-blue-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-md"
          >
            Salvar e Submeter
          </button>
        </div>
      </div>

      {!templateSelecionado || !editorDefinition ? (
        <div className="p-4 text-sm text-muted-foreground">
          Selecione um template para começar a editar.
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Revisão base</label>
              <select
                value={editorSourceRevisionId}
                onChange={(e) => onChangeRevisionSource(e.target.value)}
                className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm"
              >
                {revisoes.map((revisao) => (
                  <option key={revisao.id} value={revisao.id}>
                    v{revisao.versao} • {revisao.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Resumo das mudanças
              </label>
              <input
                value={editorResumo}
                onChange={(e) => onChangeResumo(e.target.value)}
                placeholder="Ex: Ajuste de perguntas da inspeção"
                className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Título</label>
              <input
                value={editorDefinition.title}
                onChange={(e) => onChangeTitle(e.target.value)}
                className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Descrição</label>
              <input
                value={editorDefinition.description ?? ""}
                onChange={(e) => onChangeDescription(e.target.value)}
                className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            {editorDefinition.sections.map((section, sectionIndex) => (
              <div
                key={section.id + sectionIndex}
                className="border border-border rounded-md p-3 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    value={section.id}
                    onChange={(e) =>
                      onUpdateSection(sectionIndex, (prev) => ({
                        ...prev,
                        id: e.target.value,
                      }))
                    }
                    placeholder="ID da seção"
                    className="border border-border bg-background rounded-md px-3 py-2 text-sm"
                  />
                  <input
                    value={section.title}
                    onChange={(e) =>
                      onUpdateSection(sectionIndex, (prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Título da seção"
                    className="border border-border bg-background rounded-md px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => onRemoveSection(sectionIndex)}
                    className="border border-red-300 text-red-600 text-xs rounded-md px-3 py-2"
                  >
                    Remover Seção
                  </button>
                </div>

                <input
                  value={section.description ?? ""}
                  onChange={(e) =>
                    onUpdateSection(sectionIndex, (prev) => ({
                      ...prev,
                      description: e.target.value || undefined,
                    }))
                  }
                  placeholder="Descrição da seção (opcional)"
                  className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm"
                />

                <div className="space-y-2">
                  {section.fields.map((field, fieldIndex) => (
                    <div
                      key={field.key + fieldIndex}
                      className="border border-border rounded-md p-2 space-y-2"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        <input
                          value={field.key}
                          onChange={(e) =>
                            onUpdateField(sectionIndex, fieldIndex, (prev) => ({
                              ...prev,
                              key: e.target.value,
                            }))
                          }
                          placeholder="Chave"
                          className="border border-border bg-background rounded-md px-2 py-1.5 text-xs"
                        />
                        <input
                          value={field.label}
                          onChange={(e) =>
                            onUpdateField(sectionIndex, fieldIndex, (prev) => ({
                              ...prev,
                              label: e.target.value,
                            }))
                          }
                          placeholder="Rótulo"
                          className="border border-border bg-background rounded-md px-2 py-1.5 text-xs"
                        />
                        <select
                          value={field.type}
                          onChange={(e) =>
                            onUpdateField(sectionIndex, fieldIndex, (prev) => ({
                              ...prev,
                              type: e.target.value as TemplateField["type"],
                              options:
                                e.target.value === "select"
                                  ? prev.options ?? [{ value: "OPCAO", label: "Opção" }]
                                  : undefined,
                            }))
                          }
                          className="border border-border bg-background rounded-md px-2 py-1.5 text-xs"
                        >
                          <option value="boolean">boolean</option>
                          <option value="text">text</option>
                          <option value="number">number</option>
                          <option value="select">select</option>
                          <option value="date">date</option>
                        </select>
                        <label className="flex items-center gap-2 text-xs text-foreground border border-border rounded-md px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              onUpdateField(sectionIndex, fieldIndex, (prev) => ({
                                ...prev,
                                required: e.target.checked,
                              }))
                            }
                          />
                          Obrigatório
                        </label>
                        <button
                          onClick={() => onRemoveField(sectionIndex, fieldIndex)}
                          className="border border-red-300 text-red-600 text-xs rounded-md px-2 py-1.5"
                        >
                          Remover
                        </button>
                      </div>

                      {field.type === "select" && (
                        <div className="space-y-1">
                          {(field.options ?? []).map((option, optionIndex) => (
                            <div
                              key={`${option.value}-${optionIndex}`}
                              className="grid grid-cols-2 gap-2"
                            >
                              <input
                                value={option.value}
                                onChange={(e) =>
                                  onUpdateField(sectionIndex, fieldIndex, (prev) => ({
                                    ...prev,
                                    options: (prev.options ?? []).map((opt, idx) =>
                                      idx === optionIndex ? { ...opt, value: e.target.value } : opt
                                    ),
                                  }))
                                }
                                placeholder="valor"
                                className="border border-border bg-background rounded-md px-2 py-1.5 text-xs"
                              />
                              <input
                                value={option.label}
                                onChange={(e) =>
                                  onUpdateField(sectionIndex, fieldIndex, (prev) => ({
                                    ...prev,
                                    options: (prev.options ?? []).map((opt, idx) =>
                                      idx === optionIndex ? { ...opt, label: e.target.value } : opt
                                    ),
                                  }))
                                }
                                placeholder="label"
                                className="border border-border bg-background rounded-md px-2 py-1.5 text-xs"
                              />
                            </div>
                          ))}
                          <button
                            onClick={() =>
                              onUpdateField(sectionIndex, fieldIndex, (prev) => ({
                                ...prev,
                                options: [
                                  ...(prev.options ?? []),
                                  { value: `OPCAO_${Date.now()}`, label: "Nova Opção" },
                                ],
                              }))
                            }
                            className="text-xs text-blue-700"
                          >
                            + Adicionar opção
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button onClick={() => onAddField(sectionIndex)} className="text-xs text-blue-700">
                  + Adicionar campo
                </button>
              </div>
            ))}
          </div>

          <button onClick={onAddSection} className="text-xs text-blue-700">
            + Adicionar seção
          </button>
        </div>
      )}
    </section>
  );
}
