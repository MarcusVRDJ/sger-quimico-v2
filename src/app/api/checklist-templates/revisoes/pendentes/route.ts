import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checklistTemplateRevisoes, checklistTemplates } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireRole(["ADMIN"], request);
  if (session instanceof NextResponse) return session;

  const rows = await db
    .select({
      id: checklistTemplateRevisoes.id,
      templateId: checklistTemplateRevisoes.templateId,
      versao: checklistTemplateRevisoes.versao,
      status: checklistTemplateRevisoes.status,
      resumoMudancas: checklistTemplateRevisoes.resumoMudancas,
      criadoPorId: checklistTemplateRevisoes.criadoPorId,
      createdAt: checklistTemplateRevisoes.createdAt,
      nomeTemplate: checklistTemplates.nome,
      tipoChecklist: checklistTemplates.tipoChecklist,
    })
    .from(checklistTemplateRevisoes)
    .leftJoin(
      checklistTemplates,
      eq(checklistTemplateRevisoes.templateId, checklistTemplates.id)
    )
    .where(eq(checklistTemplateRevisoes.status, "PENDENTE_APROVACAO"))
    .orderBy(desc(checklistTemplateRevisoes.createdAt));

  return NextResponse.json(rows);
}
