import { describe, expect, it } from "vitest";
import { getChecklistTypeLabel } from "@/components/checklist-templates/labels";

describe("getChecklistTypeLabel", () => {
  it("mapeia recebimento", () => {
    expect(getChecklistTypeLabel("RECEBIMENTO")).toBe("Recebimento");
  });

  it("mapeia expedicao", () => {
    expect(getChecklistTypeLabel("EXPEDICAO")).toBe("Expedição");
  });

  it("fallback para valor desconhecido", () => {
    expect(getChecklistTypeLabel(undefined)).toBe("Desconhecido");
  });
});
