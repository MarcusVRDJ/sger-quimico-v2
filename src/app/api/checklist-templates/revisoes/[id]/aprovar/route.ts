import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  checklistTemplateRevisoes,
  checklistTemplateEventos,
  checklistTemplates,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
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

  if (revisao.status !== "PENDENTE_APROVACAO") {
    return NextResponse.json(
      { error: "A revisão não está pendente de aprovação" },
      { status: 400 }
    );
  }

  if (revisao.criadoPorId === session.sub) {
    return NextResponse.json(
      { error: "O criador da revisão não pode aprová-la" },
      { status: 400 }
    );
  }

  const now = new Date();

  const updated = await db.transaction(async (tx) => {
    await tx
      .update(checklistTemplateRevisoes)
      .set({ status: "ARQUIVADO", updatedAt: now })
      .where(
        and(
          eq(checklistTemplateRevisoes.templateId, revisao.templateId),
          eq(checklistTemplateRevisoes.status, "APROVADO")
        )
      );

    const [approved] = await tx
      .update(checklistTemplateRevisoes)
      .set({
        status: "APROVADO",
        aprovadoPorId: session.sub,
        aprovadoEm: now,
        rejeitadoEm: null,
        motivoRejeicao: null,
        updatedAt: now,
      })
      .where(eq(checklistTemplateRevisoes.id, id))
      .returning();

    await tx
      .update(checklistTemplates)
      .set({ updatedAt: now })
      .where(eq(checklistTemplates.id, revisao.templateId));

    await tx.insert(checklistTemplateEventos).values({
      templateId: revisao.templateId,
      revisaoId: revisao.id,
      acao: "REVISAO_APROVADA",
      usuarioId: session.sub,
      usuarioNome: session.nome,
      usuarioEmail: session.email,
      detalhes: { versao: revisao.versao },
    });

    return approved;
  });

  return NextResponse.json(updated);
}
