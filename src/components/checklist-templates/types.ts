import type { ChecklistTemplateDefinition } from "@/lib/checklist-template-definition";

export type TipoChecklist = "RECEBIMENTO" | "EXPEDICAO";

export type StatusRevisao =
  | "RASCUNHO"
  | "PENDENTE_APROVACAO"
  | "APROVADO"
  | "REJEITADO"
  | "ARQUIVADO";

export interface TemplateRow {
  id: string;
  nome: string;
  descricao: string | null;
  tipoChecklist: TipoChecklist;
  ativo: boolean;
  updatedAt: string;
}

export interface RevisaoRow {
  id: string;
  versao: number;
  status: StatusRevisao;
  definicao?: ChecklistTemplateDefinition;
  resumoMudancas: string | null;
  createdAt: string;
}

export interface PendenteRow {
  id: string;
  templateId: string;
  versao: number;
  nomeTemplate: string | null;
  tipoChecklist: TipoChecklist | null;
  createdAt: string;
}

export type TemplateSection = ChecklistTemplateDefinition["sections"][number];
export type TemplateField = TemplateSection["fields"][number];
