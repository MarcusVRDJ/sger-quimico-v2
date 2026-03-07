import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requisicoesLimpeza, contentores } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const [requisicao] = await db
    .select()
    .from(requisicoesLimpeza)
    .where(eq(requisicoesLimpeza.id, id))
    .limit(1);

  if (!requisicao) {
    return NextResponse.json(
      { error: "Requisição não encontrada" },
      { status: 404 }
    );
  }

  if (requisicao.status !== "EM_ANDAMENTO") {
    return NextResponse.json(
      { error: "Requisição não está em andamento" },
      { status: 400 }
    );
  }

  const [atualizado] = await db
    .update(requisicoesLimpeza)
    .set({
      status: "CONCLUIDA",
      dataConclusao: new Date(),
    })
    .where(eq(requisicoesLimpeza.id, id))
    .returning();

  // Atualiza status do contentor
  const novoStatus = requisicao.reservadoParaProducao
    ? "RESERVADO_PRODUCAO"
    : "DISPONIVEL";

  await db
    .update(contentores)
    .set({
      status: novoStatus,
      precisaLimpeza: false,
      updatedAt: new Date(),
    })
    .where(eq(contentores.id, requisicao.contentorId));

  return NextResponse.json(atualizado);
}
