import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checklistTemplateRevisoes, checklistTemplateEventos } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

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

  const [revisao] = await db
    .select()
    .from(checklistTemplateRevisoes)
    .where(eq(checklistTemplateRevisoes.id, id))
    .limit(1);

  if (!revisao) {
    return NextResponse.json({ error: "Revisão não encontrada" }, { status: 404 });
  }

  if (revisao.status !== "RASCUNHO" && revisao.status !== "REJEITADO") {
    return NextResponse.json(
      { error: "Apenas revisões em rascunho ou rejeitadas podem ser submetidas" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(checklistTemplateRevisoes)
    .set({
      status: "PENDENTE_APROVACAO",
      motivoRejeicao: null,
      rejeitadoEm: null,
      aprovadoPorId: null,
      aprovadoEm: null,
      updatedAt: new Date(),
    })
    .where(eq(checklistTemplateRevisoes.id, id))
    .returning();

  await db.insert(checklistTemplateEventos).values({
    templateId: revisao.templateId,
    revisaoId: revisao.id,
    acao: "REVISAO_SUBMETIDA",
    usuarioId: session.sub,
    usuarioNome: session.nome,
    usuarioEmail: session.email,
    detalhes: { versao: revisao.versao },
  });

  return NextResponse.json(updated);
}
