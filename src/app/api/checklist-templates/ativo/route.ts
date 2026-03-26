import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checklistTemplateRevisoes, checklistTemplates } from "@/drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const querySchema = z.object({
  tipoChecklist: z.enum(["RECEBIMENTO", "EXPEDICAO"]),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    tipoChecklist: searchParams.get("tipoChecklist"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetro tipoChecklist inválido" },
      { status: 400 }
    );
  }

  const [row] = await db
    .select({
      templateId: checklistTemplates.id,
      templateNome: checklistTemplates.nome,
      tipoChecklist: checklistTemplates.tipoChecklist,
      revisaoId: checklistTemplateRevisoes.id,
      versao: checklistTemplateRevisoes.versao,
      definicao: checklistTemplateRevisoes.definicao,
      aprovadoEm: checklistTemplateRevisoes.aprovadoEm,
    })
    .from(checklistTemplateRevisoes)
    .innerJoin(
      checklistTemplates,
      eq(checklistTemplateRevisoes.templateId, checklistTemplates.id)
    )
    .where(
      and(
        eq(checklistTemplates.ativo, true),
        eq(checklistTemplates.tipoChecklist, parsed.data.tipoChecklist),
        eq(checklistTemplateRevisoes.status, "APROVADO")
      )
    )
    .orderBy(
      desc(checklistTemplateRevisoes.aprovadoEm),
      desc(checklistTemplateRevisoes.versao)
    )
    .limit(1);

  if (!row) {
    return NextResponse.json(
      { error: "Nenhum template aprovado encontrado para o tipo informado" },
      { status: 404 }
    );
  }

  return NextResponse.json(row);
}
