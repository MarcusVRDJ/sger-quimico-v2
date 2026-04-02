import { describe, expect, it, beforeEach, vi } from "vitest";

const {
  mockRequireAuth,
  mockGetActiveChecklistTemplate,
  mockTemplateHasRequiredFieldKeys,
  mockEvaluateStatusFromTemplate,
  selectQueue,
  insertReturningQueue,
  insertValuesCalls,
  mockDb,
} = vi.hoisted(() => {
  const mockRequireAuth = vi.fn();
  const mockGetActiveChecklistTemplate = vi.fn();
  const mockTemplateHasRequiredFieldKeys = vi.fn();
  const mockEvaluateStatusFromTemplate = vi.fn();

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
    })),
  };

  return {
    mockRequireAuth,
    mockGetActiveChecklistTemplate,
    mockTemplateHasRequiredFieldKeys,
    mockEvaluateStatusFromTemplate,
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
}));

import { POST } from "@/app/api/checklists/expedicao/route";

describe("POST /api/checklists/expedicao (integration)", () => {
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

  it("usa evaluateStatusFromTemplate quando statusRules existe", async () => {
    mockGetActiveChecklistTemplate.mockResolvedValue({
      templateId: "tpl-exp",
      revisaoId: "rev-exp",
      versao: 1,
      definicao: {
        schemaVersion: 1,
        title: "Expedicao",
        sections: [
          {
            id: "sec-1",
            title: "Sec 1",
            fields: [
              { key: "tampaOk", label: "Tampa", type: "boolean", required: true },
              { key: "vedacaoOk", label: "Vedacao", type: "boolean", required: true },
              { key: "lacresIntactos", label: "Lacres", type: "boolean", required: true },
            ],
          },
        ],
        statusRules: [
          {
            priority: 0,
            conditions: [{ key: "tampaOk", operator: "false" }],
            resultStatus: "RETIDO",
          },
        ],
      },
    });
    mockEvaluateStatusFromTemplate.mockReturnValue("MANUTENCAO_EXTERNA");

    selectQueue.push([
      {
        id: "cont-exp-1",
        numeroSerie: "SN-EXP-1",
        status: "DISPONIVEL",
      },
    ]);
    insertReturningQueue.push([{ id: "check-exp-1" }]);

    const request = {
      json: async () => ({
        numeroSerie: "SN-EXP-1",
        tampaOk: true,
        vedacaoOk: true,
        lacresIntactos: true,
        tipoDestino: "MANUTENCAO_EXTERNA",
      }),
    } as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.id).toBe("check-exp-1");
    expect(mockEvaluateStatusFromTemplate).toHaveBeenCalledOnce();
    expect(insertValuesCalls[0].statusResultante).toBe("MANUTENCAO_EXTERNA");
  });

  it("usa fallback interno quando statusRules não existe", async () => {
    mockGetActiveChecklistTemplate.mockResolvedValue({
      templateId: "tpl-exp",
      revisaoId: "rev-exp",
      versao: 1,
      definicao: {
        schemaVersion: 1,
        title: "Expedicao",
        sections: [
          {
            id: "sec-1",
            title: "Sec 1",
            fields: [
              { key: "tampaOk", label: "Tampa", type: "boolean", required: true },
              { key: "vedacaoOk", label: "Vedacao", type: "boolean", required: true },
              { key: "lacresIntactos", label: "Lacres", type: "boolean", required: true },
            ],
          },
        ],
      },
    });

    selectQueue.push([
      {
        id: "cont-exp-1",
        numeroSerie: "SN-EXP-1",
        status: "DISPONIVEL",
      },
    ]);
    insertReturningQueue.push([{ id: "check-exp-2" }]);

    const request = {
      json: async () => ({
        numeroSerie: "SN-EXP-1",
        tampaOk: true,
        vedacaoOk: true,
        lacresIntactos: true,
        tipoDestino: "MANUTENCAO_EXTERNA",
      }),
    } as any;

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockEvaluateStatusFromTemplate).not.toHaveBeenCalled();
    expect(insertValuesCalls[0].statusResultante).toBe("MANUTENCAO_EXTERNA");
  });
});
