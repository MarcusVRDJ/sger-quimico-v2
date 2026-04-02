"use client";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  onUpdateFieldLabel: (sectionIndex: number, fieldIndex: number, label: string) => void;
  onReorderSections: (fromIndex: number, toIndex: number) => void;
  onReorderFields: (
    sectionIndex: number,
    fromIndex: number,
    toIndex: number
  ) => void;
  onMoveFieldAcrossSections: (
    fromSectionIndex: number,
    fromFieldIndex: number,
    toSectionIndex: number,
    toFieldIndex: number
  ) => void;
  onSaveDraft: () => void;
  onSaveAndSubmit: () => void;
}

const SECTION_PREFIX = "section:";
const FIELD_PREFIX = "field:";

function createSectionDragId(sectionIndex: number): string {
  return `${SECTION_PREFIX}${sectionIndex}`;
}

function createFieldDragId(sectionIndex: number, fieldIndex: number): string {
  return `${FIELD_PREFIX}${sectionIndex}:${fieldIndex}`;
}

function parseSectionDragId(id: string): number | null {
  if (!id.startsWith(SECTION_PREFIX)) return null;
  const index = Number(id.replace(SECTION_PREFIX, ""));
  return Number.isInteger(index) ? index : null;
}

function parseFieldDragId(id: string): { sectionIndex: number; fieldIndex: number } | null {
  if (!id.startsWith(FIELD_PREFIX)) return null;
  const payload = id.replace(FIELD_PREFIX, "");
  const [sectionRaw, fieldRaw] = payload.split(":");
  const sectionIndex = Number(sectionRaw);
  const fieldIndex = Number(fieldRaw);

  if (!Number.isInteger(sectionIndex) || !Number.isInteger(fieldIndex)) {
    return null;
  }

  return { sectionIndex, fieldIndex };
}

interface SortableFieldItemProps {
  dragId: string;
  field: TemplateField;
  fieldIndex: number;
  sectionIndex: number;
  onRemoveField: (sectionIndex: number, fieldIndex: number) => void;
  onUpdateField: (
    sectionIndex: number,
    fieldIndex: number,
    mutator: (field: TemplateField) => TemplateField
  ) => void;
  onUpdateFieldLabel: (sectionIndex: number, fieldIndex: number, label: string) => void;
}

function SortableFieldItem({
  dragId,
  field,
  fieldIndex,
  sectionIndex,
  onRemoveField,
  onUpdateField,
  onUpdateFieldLabel,
}: SortableFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: dragId });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`border border-border rounded-md p-2 space-y-2 ${
        isDragging ? "shadow-lg ring-2 ring-blue-200 bg-blue-50/40" : ""
      }`}
    >
      <div className="flex justify-between items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Campo {fieldIndex + 1}
        </span>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
          aria-label="Arrastar campo"
        >
          Arrastar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          value={field.label}
          onChange={(e) => onUpdateFieldLabel(sectionIndex, fieldIndex, e.target.value)}
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

      <p className="text-[11px] text-muted-foreground">
        ID técnico gerado automaticamente: <span className="font-mono">{field.key}</span>
      </p>

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
  );
}

interface SortableSectionItemProps {
  dragId: string;
  section: TemplateSection;
  sectionIndex: number;
  onRemoveSection: (sectionIndex: number) => void;
  onUpdateSection: (sectionIndex: number, mutator: (section: TemplateSection) => TemplateSection) => void;
  onAddField: (sectionIndex: number) => void;
  onRemoveField: (sectionIndex: number, fieldIndex: number) => void;
  onUpdateField: (
    sectionIndex: number,
    fieldIndex: number,
    mutator: (field: TemplateField) => TemplateField
  ) => void;
  onUpdateFieldLabel: (sectionIndex: number, fieldIndex: number, label: string) => void;
}

function SortableSectionItem({
  dragId,
  section,
  sectionIndex,
  onRemoveSection,
  onUpdateSection,
  onAddField,
  onRemoveField,
  onUpdateField,
  onUpdateFieldLabel,
}: SortableSectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: dragId });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`border border-border rounded-md p-3 space-y-3 ${
        isDragging ? "shadow-xl ring-2 ring-blue-200 bg-blue-50/40" : ""
      }`}
    >
      <div className="flex justify-between items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Seção {sectionIndex + 1}
        </span>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
          aria-label="Arrastar seção"
        >
          Arrastar
        </button>
      </div>

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
        <SortableContext
          items={section.fields.map((_, fieldIndex) => createFieldDragId(sectionIndex, fieldIndex))}
          strategy={verticalListSortingStrategy}
        >
          {section.fields.map((field, fieldIndex) => (
            <SortableFieldItem
              key={createFieldDragId(sectionIndex, fieldIndex)}
              dragId={createFieldDragId(sectionIndex, fieldIndex)}
              field={field}
              fieldIndex={fieldIndex}
              sectionIndex={sectionIndex}
              onRemoveField={onRemoveField}
              onUpdateField={onUpdateField}
              onUpdateFieldLabel={onUpdateFieldLabel}
            />
          ))}
        </SortableContext>
      </div>

      <button onClick={() => onAddField(sectionIndex)} className="text-xs text-blue-700">
        + Adicionar campo
      </button>
    </div>
  );
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
  onUpdateFieldLabel,
  onReorderSections,
  onReorderFields,
  onMoveFieldAcrossSections,
  onSaveDraft,
  onSaveAndSubmit,
}: RevisionEditorSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeSection = parseSectionDragId(String(active.id));
    const overSection = parseSectionDragId(String(over.id));

    if (activeSection !== null && overSection !== null) {
      onReorderSections(activeSection, overSection);
      return;
    }

    const activeField = parseFieldDragId(String(active.id));
    const overField = parseFieldDragId(String(over.id));

    if (!activeField || !overField) {
      return;
    }

    if (activeField.sectionIndex !== overField.sectionIndex) {
      onMoveFieldAcrossSections(
        activeField.sectionIndex,
        activeField.fieldIndex,
        overField.sectionIndex,
        overField.fieldIndex
      );
      return;
    }

    onReorderFields(activeField.sectionIndex, activeField.fieldIndex, overField.fieldIndex);
  }

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
            <SortableContext
              items={editorDefinition.sections.map((_, sectionIndex) => createSectionDragId(sectionIndex))}
              strategy={verticalListSortingStrategy}
            >
              {editorDefinition.sections.map((section, sectionIndex) => (
                <SortableSectionItem
                  key={createSectionDragId(sectionIndex)}
                  dragId={createSectionDragId(sectionIndex)}
                  section={section}
                  sectionIndex={sectionIndex}
                  onRemoveSection={onRemoveSection}
                  onUpdateSection={onUpdateSection}
                  onAddField={onAddField}
                  onRemoveField={onRemoveField}
                  onUpdateField={onUpdateField}
                  onUpdateFieldLabel={onUpdateFieldLabel}
                />
              ))}
            </SortableContext>
          </div>

          <button onClick={onAddSection} className="text-xs text-blue-700">
            + Adicionar seção
          </button>
        </div>
        </DndContext>
      )}
    </section>
  );
}
