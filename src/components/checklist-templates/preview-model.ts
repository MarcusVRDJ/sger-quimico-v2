import type { ChecklistTemplateDefinition } from "@/lib/checklist-template-definition";

export interface PreviewFieldModel {
  key: string;
  label: string;
  typeLabel: string;
  required: boolean;
  optionCount: number;
}

export interface PreviewSectionModel {
  id: string;
  title: string;
  description?: string;
  fields: PreviewFieldModel[];
}

export interface ChecklistPreviewModel {
  title: string;
  description?: string;
  schemaVersion: number;
  sectionCount: number;
  fieldCount: number;
  sections: PreviewSectionModel[];
}

function getTypeLabel(type: ChecklistTemplateDefinition["sections"][number]["fields"][number]["type"]): string {
  if (type === "boolean") return "Marcação";
  if (type === "select") return "Lista";
  if (type === "number") return "Número";
  if (type === "date") return "Data";
  return "Texto";
}

export function buildChecklistPreviewModel(
  definition: ChecklistTemplateDefinition
): ChecklistPreviewModel {
  const sections = definition.sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    fields: section.fields.map((field) => ({
      key: field.key,
      label: field.label,
      typeLabel: getTypeLabel(field.type),
      required: field.required,
      optionCount: field.options?.length ?? 0,
    })),
  }));

  return {
    title: definition.title,
    description: definition.description,
    schemaVersion: definition.schemaVersion,
    sectionCount: sections.length,
    fieldCount: sections.reduce((total, section) => total + section.fields.length, 0),
    sections,
  };
}
