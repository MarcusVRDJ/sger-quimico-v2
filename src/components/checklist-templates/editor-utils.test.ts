import { describe, expect, it } from "vitest";
import {
  defaultDefinition,
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
});
