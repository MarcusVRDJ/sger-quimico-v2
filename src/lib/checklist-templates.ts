import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  checklistTemplateRevisoes,
  checklistTemplates,
  type TipoChecklist,
} from "@/drizzle/schema";
import {
  checklistTemplateDefinitionSchema,
  type ChecklistTemplateDefinition,
} from "@/lib/checklist-template-definition";

export interface ActiveChecklistTemplate {
  templateId: string;
  revisaoId: string;
  versao: number;
  definicao: ChecklistTemplateDefinition;
}

export async function getActiveChecklistTemplate(
  tipoChecklist: TipoChecklist
): Promise<ActiveChecklistTemplate | null> {
  const [row] = await db
    .select({
      templateId: checklistTemplates.id,
      revisaoId: checklistTemplateRevisoes.id,
      versao: checklistTemplateRevisoes.versao,
      definicao: checklistTemplateRevisoes.definicao,
    })
    .from(checklistTemplateRevisoes)
    .innerJoin(
      checklistTemplates,
      eq(checklistTemplateRevisoes.templateId, checklistTemplates.id)
    )
    .where(
      and(
        eq(checklistTemplates.ativo, true),
        eq(checklistTemplates.tipoChecklist, tipoChecklist),
        eq(checklistTemplateRevisoes.status, "APROVADO")
      )
    )
    .orderBy(
      desc(checklistTemplateRevisoes.aprovadoEm),
      desc(checklistTemplateRevisoes.versao)
    )
    .limit(1);

  if (!row) return null;

  const parsedDefinition = checklistTemplateDefinitionSchema.safeParse(row.definicao);
  if (!parsedDefinition.success) {
    return null;
  }

  return {
    templateId: row.templateId,
    revisaoId: row.revisaoId,
    versao: row.versao,
    definicao: parsedDefinition.data,
  };
}

export function templateHasRequiredFieldKeys(
  definicao: ChecklistTemplateDefinition,
  requiredKeys: string[]
): boolean {
  const fieldKeys = new Set(
    definicao.sections.flatMap((section) =>
      section.fields.map((field) => field.key)
    )
  );

  return requiredKeys.every((key) => fieldKeys.has(key));
}
