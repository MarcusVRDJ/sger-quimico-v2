import { describe, expect, it } from "vitest";
import { checklistTemplateDefinitionSchema } from "@/lib/checklist-template-definition";

const baseTemplate = {
  schemaVersion: 1,
  title: "Checklist Teste",
  sections: [
    {
      id: "sec-1",
      title: "Secao 1",
      fields: [
        { key: "campoA", label: "Campo A", type: "boolean", required: true, order: 0 },
        { key: "campoB", label: "Campo B", type: "text", required: false, order: 1 },
      ],
    },
  ],
} as const;

describe("checklistTemplateDefinitionSchema", () => {
  it("aceita regra fallback com conditions vazia", () => {
    const parsed = checklistTemplateDefinitionSchema.safeParse({
      ...baseTemplate,
      statusRules: [
        {
          priority: 0,
          conditions: [],
          resultStatus: "APROVADO",
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejeita equals sem value", () => {
    const parsed = checklistTemplateDefinitionSchema.safeParse({
      ...baseTemplate,
      statusRules: [
        {
          priority: 0,
          conditions: [{ key: "campoB", operator: "equals" }],
          resultStatus: "APROVADO",
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejeita true com value preenchido", () => {
    const parsed = checklistTemplateDefinitionSchema.safeParse({
      ...baseTemplate,
      statusRules: [
        {
          priority: 0,
          conditions: [{ key: "campoA", operator: "true", value: true }],
          resultStatus: "APROVADO",
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejeita priorities duplicadas", () => {
    const parsed = checklistTemplateDefinitionSchema.safeParse({
      ...baseTemplate,
      statusRules: [
        {
          priority: 0,
          conditions: [{ key: "campoA", operator: "true" }],
          resultStatus: "APROVADO",
        },
        {
          priority: 0,
          conditions: [{ key: "campoA", operator: "false" }],
          resultStatus: "RETIDO",
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it("aceita templates legados sem order", () => {
    const parsed = checklistTemplateDefinitionSchema.safeParse({
      schemaVersion: 1,
      title: "Template Legado",
      sections: [
        {
          id: "sec-old",
          title: "Secao antiga",
          fields: [
            { key: "x", label: "X", type: "boolean", required: true },
            { key: "y", label: "Y", type: "boolean", required: true },
          ],
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });
});
