import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requisicoesLimpeza } from "@/drizzle/schema";
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

  if (requisicao.status !== "PENDENTE") {
    return NextResponse.json(
      { error: "Requisição não está pendente" },
      { status: 400 }
    );
  }

  const [atualizado] = await db
    .update(requisicoesLimpeza)
    .set({
      status: "EM_ANDAMENTO",
      usuarioExecutorId: session.sub,
      usuarioExecutorNome: session.nome,
      usuarioExecutorEmail: session.email,
      dataInicio: new Date(),
    })
    .where(eq(requisicoesLimpeza.id, id))
    .returning();

  return NextResponse.json(atualizado);
}
