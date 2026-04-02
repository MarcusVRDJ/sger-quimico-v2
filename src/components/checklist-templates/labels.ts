import type { TipoChecklist } from "@/components/checklist-templates/types";

export function getChecklistTypeLabel(tipoChecklist: TipoChecklist | null | undefined): string {
  if (tipoChecklist === "RECEBIMENTO") return "Recebimento";
  if (tipoChecklist === "EXPEDICAO") return "Expedição";
  return "Desconhecido";
}
