import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checklistTemplateRevisoes, checklistTemplateEventos } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { rejectRevisionSchema } from "@/lib/checklist-template-definition";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireRole(["ADMIN"], request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = (await request.json()) as unknown;
  const parsed = rejectRevisionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [revisao] = await db
    .select()
    .from(checklistTemplateRevisoes)
    .where(eq(checklistTemplateRevisoes.id, id))
    .limit(1);

  if (!revisao) {
    return NextResponse.json({ error: "Revisão não encontrada" }, { status: 404 });
  }

  if (revisao.status !== "PENDENTE_APROVACAO") {
    return NextResponse.json(
      { error: "A revisão não está pendente de aprovação" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(checklistTemplateRevisoes)
    .set({
      status: "REJEITADO",
      rejeitadoEm: new Date(),
      motivoRejeicao: parsed.data.motivo,
      aprovadoPorId: null,
      aprovadoEm: null,
      updatedAt: new Date(),
    })
    .where(eq(checklistTemplateRevisoes.id, id))
    .returning();

  await db.insert(checklistTemplateEventos).values({
    templateId: revisao.templateId,
    revisaoId: revisao.id,
    acao: "REVISAO_REJEITADA",
    usuarioId: session.sub,
    usuarioNome: session.nome,
    usuarioEmail: session.email,
    detalhes: { versao: revisao.versao, motivo: parsed.data.motivo },
  });

  return NextResponse.json(updated);
}
