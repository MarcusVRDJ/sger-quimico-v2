import { describe, expect, it, beforeEach, vi } from "vitest";

const {
  mockRequireAuth,
  mockGetActiveChecklistTemplate,
  mockTemplateHasRequiredFieldKeys,
  mockEvaluateStatusFromTemplate,
  mockCalcularStatusRecebimento,
  selectQueue,
  insertReturningQueue,
  insertValuesCalls,
  mockDb,
} = vi.hoisted(() => {
  const mockRequireAuth = vi.fn();
  const mockGetActiveChecklistTemplate = vi.fn();
  const mockTemplateHasRequiredFieldKeys = vi.fn();
  const mockEvaluateStatusFromTemplate = vi.fn();
  const mockCalcularStatusRecebimento = vi.fn();

  const selectQueue: any[] = [];
  const insertReturningQueue: any[] = [];
  const insertValuesCalls: any[] = [];

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn(async () => selectQueue.shift() ?? []),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((payload) => {
        insertValuesCalls.push(payload);
        return {
          returning: vi.fn(async () => insertReturningQueue.shift() ?? []),
        };
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn(async () => []),
      returning: vi.fn(async () => []),
    })),
  };

  return {
    mockRequireAuth,
    mockGetActiveChecklistTemplate,
    mockTemplateHasRequiredFieldKeys,
    mockEvaluateStatusFromTemplate,
    mockCalcularStatusRecebimento,
    selectQueue,
    insertReturningQueue,
    insertValuesCalls,
    mockDb,
  };
});

vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/lib/auth", () => ({ requireAuth: mockRequireAuth }));
vi.mock("@/lib/checklist-templates", () => ({
  getActiveChecklistTemplate: mockGetActiveChecklistTemplate,
  templateHasRequiredFieldKeys: mockTemplateHasRequiredFieldKeys,
}));
vi.mock("@/lib/checklist-logic", () => ({
  evaluateStatusFromTemplate: mockEvaluateStatusFromTemplate,
  calcularStatusRecebimento: mockCalcularStatusRecebimento,
}));

import { POST } from "@/app/api/checklists/recebimento/route";

describe("POST /api/checklists/recebimento (integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectQueue.length = 0;
    insertReturningQueue.length = 0;
    insertValuesCalls.length = 0;

    mockRequireAuth.mockResolvedValue({
      sub: "user-1",
      nome: "Operador Teste",
      email: "operador@teste.com",
    });
    mockTemplateHasRequiredFieldKeys.mockReturnValue(true);
  });

  it("usa evaluateStatusFromTemplate quando template possui statusRules", async () => {
    mockGetActiveChecklistTemplate.mockResolvedValue({
      templateId: "tpl-1",
      revisaoId: "rev-1",
      versao: 2,
      definicao: {
        schemaVersion: 1,
        title: "Recebimento",
        sections: [
          {
            id: "sec-1",
            title: "Sec 1",
            fields: [
              { key: "avarias", label: "Avarias", type: "boolean", required: true },
              { key: "lacreRoto", label: "Lacre", type: "boolean", required: true },
              { key: "testesVencidos", label: "Testes", type: "boolean", required: true },
              { key: "produtoAnterior", label: "Produto", type: "boolean", required: true },
              { key: "residuos", label: "Residuos", type: "boolean", required: true },
            ],
          },
        ],
        statusRules: [
          {
            priority: 0,
            conditions: [{ key: "avarias", operator: "true" }],
            resultStatus: "REPROVADO_INTEGRIDADE",
          },
        ],
      },
    });
    mockEvaluateStatusFromTemplate.mockReturnValue("REPROVADO_INTEGRIDADE");

    selectQueue.push([
      {
        id: "cont-1",
        numeroSerie: "SN-1",
        status: "DISPONIVEL",
        fabricante: "Fab",
        capacidadeLitros: 1000,
        tara: "250",
        dataValidade: null,
      },
    ]);
    insertReturningQueue.push([{ id: "check-1" }]);

    const request = {
      json: async () => ({
        numeroSerie: "SN-1",
        tipoContentor: "OFFSHORE",
        avarias: true,
        lacreRoto: false,
        testesVencidos: false,
        produtoAnterior: false,
        residuos: false,
      }),
    } as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.id).toBe("check-1");
    expect(mockEvaluateStatusFromTemplate).toHaveBeenCalledOnce();
    expect(mockCalcularStatusRecebimento).not.toHaveBeenCalled();
    expect(insertValuesCalls[0].statusResultante).toBe("REPROVADO_INTEGRIDADE");
  });

  it("usa fallback legado quando template não possui statusRules", async () => {
    mockGetActiveChecklistTemplate.mockResolvedValue({
      templateId: "tpl-1",
      revisaoId: "rev-1",
      versao: 2,
      definicao: {
        schemaVersion: 1,
        title: "Recebimento",
        sections: [
          {
            id: "sec-1",
            title: "Sec 1",
            fields: [
              { key: "avarias", label: "Avarias", type: "boolean", required: true },
              { key: "lacreRoto", label: "Lacre", type: "boolean", required: true },
              { key: "testesVencidos", label: "Testes", type: "boolean", required: true },
              { key: "produtoAnterior", label: "Produto", type: "boolean", required: true },
              { key: "residuos", label: "Residuos", type: "boolean", required: true },
            ],
          },
        ],
      },
    });
    mockCalcularStatusRecebimento.mockReturnValue("APROVADO_SUJO");

    selectQueue.push([
      {
        id: "cont-1",
        numeroSerie: "SN-1",
        status: "DISPONIVEL",
        fabricante: "Fab",
        capacidadeLitros: 1000,
        tara: "250",
        dataValidade: null,
      },
    ]);
    insertReturningQueue.push([{ id: "check-2" }]);

    const request = {
      json: async () => ({
        numeroSerie: "SN-1",
        tipoContentor: "OFFSHORE",
        avarias: false,
        lacreRoto: false,
        testesVencidos: false,
        produtoAnterior: true,
        residuos: false,
      }),
    } as any;

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockCalcularStatusRecebimento).toHaveBeenCalledOnce();
    expect(mockEvaluateStatusFromTemplate).not.toHaveBeenCalled();
    expect(insertValuesCalls[0].statusResultante).toBe("APROVADO_SUJO");
  });
});
