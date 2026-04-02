import { describe, expect, it } from "vitest";
import {
  defaultDefinition,
  moveFieldAcrossSectionsInDefinition,
  reorderFieldsInDefinitionSection,
  reorderSectionsInDefinition,
  suggestUniqueFieldKey,
  validateEditorDefinition,
} from "@/components/checklist-templates/editor-utils";

describe("editor-utils", () => {
  it("gera definição padrão para recebimento", () => {
    const definition = defaultDefinition("RECEBIMENTO");

    expect(definition.title).toContain("Recebimento");
    expect(definition.sections.length).toBeGreaterThan(0);
    expect(definition.sections[0]?.fields.length).toBeGreaterThan(0);
  });

  it("gera definição padrão para expedição com campo tipoDestino", () => {
    const definition = defaultDefinition("EXPEDICAO");
    const keys = definition.sections.flatMap((section) =>
      section.fields.map((field) => field.key)
    );

    expect(keys).toContain("tipoDestino");
  });

  it("valida título obrigatório", () => {
    const definition = defaultDefinition("RECEBIMENTO");
    definition.title = "";

    expect(validateEditorDefinition(definition)).toBe(
      "Título do template é obrigatório."
    );
  });

  it("valida opção obrigatória para campo select", () => {
    const definition = defaultDefinition("EXPEDICAO");
    const destinationSection = definition.sections.find(
      (section) => section.id === "destino"
    );
    const destinationField = destinationSection?.fields.find(
      (field) => field.key === "tipoDestino"
    );

    if (destinationField && destinationField.type === "select") {
      destinationField.options = [];
    }

    expect(validateEditorDefinition(definition)).toBe(
      "Campo Tipo de destino precisa de opções."
    );
  });

  it("reordena seções e recalcula order sequencial", () => {
    const definition = defaultDefinition("RECEBIMENTO");
    const reordered = reorderSectionsInDefinition(definition, 0, 2);

    expect(reordered.sections[0]?.id).toBe("inspecao-interna");
    expect(reordered.sections[1]?.id).toBe("validade");
    expect(reordered.sections[2]?.id).toBe("inspecao-externa");
    expect(reordered.sections.map((section) => section.order)).toEqual([0, 1, 2]);
  });

  it("reordena campos dentro da seção e recalcula order", () => {
    const definition = defaultDefinition("RECEBIMENTO");
    const reordered = reorderFieldsInDefinitionSection(definition, 0, 0, 1);

    expect(reordered.sections[0]?.fields[0]?.key).toBe("lacreRoto");
    expect(reordered.sections[0]?.fields[1]?.key).toBe("avarias");
    expect(reordered.sections[0]?.fields.map((field) => field.order)).toEqual([0, 1]);
  });

  it("mantém definição inalterada em índices inválidos", () => {
    const definition = defaultDefinition("RECEBIMENTO");
    const reordered = reorderFieldsInDefinitionSection(definition, 9, 0, 1);

    expect(reordered).toBe(definition);
  });

  it("move campo entre seções e recalcula order", () => {
    const definition = defaultDefinition("RECEBIMENTO");
    const moved = moveFieldAcrossSectionsInDefinition(definition, 0, 1, 1, 1);

    expect(moved.sections[0]?.fields.map((field) => field.key)).toEqual(["avarias"]);
    expect(moved.sections[1]?.fields.map((field) => field.key)).toEqual([
      "produtoAnterior",
      "lacreRoto",
      "residuos",
    ]);
    expect(moved.sections[1]?.fields.map((field) => field.order)).toEqual([0, 1, 2]);
  });

  it("não move entre seções quando seção origem ficaria vazia", () => {
    const definition = defaultDefinition("EXPEDICAO");
    const withSingleFieldSource = {
      ...definition,
      sections: [
        {
          ...definition.sections[0],
          fields: [definition.sections[0]?.fields[0]].filter(Boolean) as typeof definition.sections[0]["fields"],
        },
        definition.sections[1],
        definition.sections[2],
      ],
    };

    const moved = moveFieldAcrossSectionsInDefinition(withSingleFieldSource, 0, 0, 1, 1);
    expect(moved).toBe(withSingleFieldSource);
  });

  it("gera key técnica única a partir do label", () => {
    const definition = defaultDefinition("RECEBIMENTO");

    const keyA = suggestUniqueFieldKey(definition, "Novo Campo");
    const keyB = suggestUniqueFieldKey(
      {
        ...definition,
        sections: [
          {
            ...definition.sections[0],
            fields: [
              ...definition.sections[0].fields,
              { key: "novo-campo", label: "Outro", type: "text", required: false },
            ],
          },
          ...definition.sections.slice(1),
        ],
      },
      "Novo Campo"
    );

    expect(keyA).toBe("novo-campo");
    expect(keyB).toBe("novo-campo-2");
  });
});
