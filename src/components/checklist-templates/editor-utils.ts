import type { ChecklistTemplateDefinition } from "@/lib/checklist-template-definition";
import type { TipoChecklist } from "@/components/checklist-templates/types";

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const cloned = [...items];
  const [moved] = cloned.splice(fromIndex, 1);
  cloned.splice(toIndex, 0, moved);
  return cloned;
}

function withSequentialOrder<T extends { order?: number }>(items: T[]): T[] {
  return items.map((item, index) => ({
    ...item,
    order: index,
  }));
}

function normalizeFieldKeyBase(label: string): string {
  const normalized = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized || "campo";
}

export function defaultDefinition(tipo: TipoChecklist): ChecklistTemplateDefinition {
  if (tipo === "RECEBIMENTO") {
    return {
      schemaVersion: 1,
      title: "Checklist de Recebimento",
      sections: [
        {
          id: "inspecao-externa",
          title: "Inspeção Externa",
          fields: [
            { key: "avarias", label: "Há avarias físicas visíveis?", type: "boolean", required: true },
            { key: "lacreRoto", label: "Lacre roto ou ausente?", type: "boolean", required: true },
          ],
        },
        {
          id: "inspecao-interna",
          title: "Inspeção Interna",
          fields: [
            { key: "produtoAnterior", label: "Presença de produto anterior?", type: "boolean", required: true },
            { key: "residuos", label: "Presença de resíduos?", type: "boolean", required: true },
          ],
        },
        {
          id: "validade",
          title: "Validades",
          fields: [
            { key: "testesVencidos", label: "Testes técnicos vencidos?", type: "boolean", required: true },
            { key: "dataValidade", label: "Data de validade", type: "date", required: false },
            { key: "dataUltimaInspecao", label: "Data da última inspeção", type: "date", required: false },
          ],
        },
      ],
    };
  }

  return {
    schemaVersion: 1,
    title: "Checklist de Expedição",
    sections: [
      {
        id: "inspecao",
        title: "Inspeção",
        fields: [
          { key: "tampaOk", label: "Tampa OK?", type: "boolean", required: true },
          { key: "vedacaoOk", label: "Vedação OK?", type: "boolean", required: true },
          { key: "lacresIntactos", label: "Lacres intactos?", type: "boolean", required: true },
        ],
      },
      {
        id: "produto",
        title: "Produto",
        fields: [
          { key: "nomeProduto", label: "Nome do Produto", type: "text", required: false },
          { key: "numeroLote", label: "Número do Lote", type: "text", required: false },
          { key: "quantidadeKg", label: "Quantidade (kg)", type: "number", required: false },
          { key: "numeroNfSaida", label: "Nº NF Saída", type: "text", required: false },
        ],
      },
      {
        id: "destino",
        title: "Destino",
        fields: [
          {
            key: "tipoDestino",
            label: "Tipo de destino",
            type: "select",
            required: true,
            options: [
              { value: "CLIENTE", label: "Cliente" },
              { value: "MANUTENCAO_EXTERNA", label: "Manutenção Externa" },
            ],
          },
          { key: "clienteNome", label: "Nome do Cliente", type: "text", required: false },
          { key: "observacoes", label: "Observações", type: "text", required: false },
        ],
      },
    ],
  };
}

export function validateEditorDefinition(definicao: ChecklistTemplateDefinition): string | null {
  if (!definicao.title.trim()) return "Título do template é obrigatório.";
  if (definicao.sections.length === 0) return "Adicione ao menos uma seção.";

  for (const section of definicao.sections) {
    if (!section.id.trim()) return "Toda seção precisa de ID.";
    if (!section.title.trim()) return "Toda seção precisa de título.";
    if (section.fields.length === 0) return `A seção ${section.title} precisa de ao menos um campo.`;

    for (const field of section.fields) {
      if (!field.key.trim()) return "Todo campo precisa de chave.";
      if (!field.label.trim()) return "Todo campo precisa de rótulo.";
      if (field.type === "select" && (!field.options || field.options.length === 0)) {
        return `Campo ${field.label} precisa de opções.`;
      }
    }
  }

  return null;
}

export function reorderSectionsInDefinition(
  definition: ChecklistTemplateDefinition,
  fromIndex: number,
  toIndex: number
): ChecklistTemplateDefinition {
  const moved = moveItem(definition.sections, fromIndex, toIndex);

  if (moved === definition.sections) {
    return definition;
  }

  return {
    ...definition,
    sections: withSequentialOrder(moved),
  };
}

export function reorderFieldsInDefinitionSection(
  definition: ChecklistTemplateDefinition,
  sectionIndex: number,
  fromIndex: number,
  toIndex: number
): ChecklistTemplateDefinition {
  if (sectionIndex < 0 || sectionIndex >= definition.sections.length) {
    return definition;
  }

  const section = definition.sections[sectionIndex];
  const moved = moveItem(section.fields, fromIndex, toIndex);

  if (moved === section.fields) {
    return definition;
  }

  const nextSection = {
    ...section,
    fields: withSequentialOrder(moved),
  };

  return {
    ...definition,
    sections: definition.sections.map((item, index) =>
      index === sectionIndex ? nextSection : item
    ),
  };
}

export function moveFieldAcrossSectionsInDefinition(
  definition: ChecklistTemplateDefinition,
  fromSectionIndex: number,
  fromFieldIndex: number,
  toSectionIndex: number,
  toFieldIndex: number
): ChecklistTemplateDefinition {
  if (
    fromSectionIndex < 0 ||
    fromSectionIndex >= definition.sections.length ||
    toSectionIndex < 0 ||
    toSectionIndex >= definition.sections.length
  ) {
    return definition;
  }

  if (fromSectionIndex === toSectionIndex) {
    return reorderFieldsInDefinitionSection(
      definition,
      fromSectionIndex,
      fromFieldIndex,
      toFieldIndex
    );
  }

  const source = definition.sections[fromSectionIndex];
  const target = definition.sections[toSectionIndex];

  if (
    fromFieldIndex < 0 ||
    fromFieldIndex >= source.fields.length ||
    source.fields.length <= 1
  ) {
    return definition;
  }

  const sourceFields = [...source.fields];
  const [moved] = sourceFields.splice(fromFieldIndex, 1);

  const targetFields = [...target.fields];
  const safeToIndex = Math.max(0, Math.min(toFieldIndex, targetFields.length));
  targetFields.splice(safeToIndex, 0, moved);

  return {
    ...definition,
    sections: definition.sections.map((section, index) => {
      if (index === fromSectionIndex) {
        return {
          ...section,
          fields: withSequentialOrder(sourceFields),
        };
      }

      if (index === toSectionIndex) {
        return {
          ...section,
          fields: withSequentialOrder(targetFields),
        };
      }

      return section;
    }),
  };
}

export function suggestUniqueFieldKey(
  definition: ChecklistTemplateDefinition,
  label: string,
  current?: { sectionIndex: number; fieldIndex: number }
): string {
  const base = normalizeFieldKeyBase(label);

  const usedKeys = new Set<string>();
  definition.sections.forEach((section, sectionIndex) => {
    section.fields.forEach((field, fieldIndex) => {
      if (
        current &&
        current.sectionIndex === sectionIndex &&
        current.fieldIndex === fieldIndex
      ) {
        return;
      }
      usedKeys.add(field.key);
    });
  });

  if (!usedKeys.has(base)) {
    return base;
  }

  let sequence = 2;
  while (usedKeys.has(`${base}-${sequence}`)) {
    sequence += 1;
  }

  return `${base}-${sequence}`;
}
