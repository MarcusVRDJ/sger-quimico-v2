import { describe, expect, it } from "vitest";
import { evaluateStatusFromTemplate } from "@/lib/checklist-logic";
import type { ChecklistTemplateDefinition } from "@/lib/checklist-template-definition";

function buildTemplate(statusRules: ChecklistTemplateDefinition["statusRules"]): ChecklistTemplateDefinition {
  return {
    schemaVersion: 1,
    title: "Template teste",
    sections: [
      {
        id: "sec-1",
        title: "Secao 1",
        fields: [
          { key: "avarias", label: "Avarias", type: "boolean", required: true },
          { key: "tipoDestino", label: "Destino", type: "text", required: false },
        ],
      },
    ],
    statusRules,
  };
}

describe("evaluateStatusFromTemplate", () => {
  it("respeita prioridade e retorna primeiro match", () => {
    const template = buildTemplate([
      {
        priority: 1,
        conditions: [{ key: "avarias", operator: "true" }],
        resultStatus: "RETIDO",
      },
      {
        priority: 0,
        conditions: [{ key: "avarias", operator: "true" }],
        resultStatus: "REPROVADO_INTEGRIDADE",
      },
      {
        priority: 10,
        conditions: [],
        resultStatus: "APROVADO",
      },
    ]);

    const result = evaluateStatusFromTemplate({ avarias: true, tipoDestino: "X" }, template);
    expect(result).toBe("REPROVADO_INTEGRIDADE");
  });

  it("suporta operador equals", () => {
    const template = buildTemplate([
      {
        priority: 0,
        conditions: [{ key: "tipoDestino", operator: "equals", value: "MANUTENCAO_EXTERNA" }],
        resultStatus: "MANUTENCAO_EXTERNA",
      },
      {
        priority: 1,
        conditions: [],
        resultStatus: "EM_CICLO",
      },
    ]);

    const result = evaluateStatusFromTemplate(
      { avarias: false, tipoDestino: "MANUTENCAO_EXTERNA" },
      template
    );
    expect(result).toBe("MANUTENCAO_EXTERNA");
  });

  it("suporta operador notEquals", () => {
    const template = buildTemplate([
      {
        priority: 0,
        conditions: [{ key: "tipoDestino", operator: "notEquals", value: "MANUTENCAO_EXTERNA" }],
        resultStatus: "EM_CICLO",
      },
      {
        priority: 1,
        conditions: [],
        resultStatus: "MANUTENCAO_EXTERNA",
      },
    ]);

    const result = evaluateStatusFromTemplate({ avarias: false, tipoDestino: "CLIENTE" }, template);
    expect(result).toBe("EM_CICLO");
  });

  it("usa fallback quando nenhuma regra específica casa", () => {
    const template = buildTemplate([
      {
        priority: 0,
        conditions: [{ key: "avarias", operator: "true" }],
        resultStatus: "REPROVADO_INTEGRIDADE",
      },
      {
        priority: 99,
        conditions: [],
        resultStatus: "APROVADO",
      },
    ]);

    const result = evaluateStatusFromTemplate({ avarias: false, tipoDestino: "X" }, template);
    expect(result).toBe("APROVADO");
  });

  it("lança erro quando regra referencia chave ausente nas respostas", () => {
    const template = buildTemplate([
      {
        priority: 0,
        conditions: [{ key: "campoInexistente", operator: "true" }],
        resultStatus: "RETIDO",
      },
    ]);

    expect(() => evaluateStatusFromTemplate({ avarias: false, tipoDestino: "X" }, template)).toThrow(
      /Chave "campoInexistente" não encontrada/
    );
  });
});
