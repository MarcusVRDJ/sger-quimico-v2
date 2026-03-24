import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requisicoesLimpeza, usuarios } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const designarSchema = z.object({
  usuarioExecutorId: z.string().uuid(),
});

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

  const body = await request.json() as unknown;
  const parsed = designarSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Busca o usuário executor
  const executor = await db.query.usuarios.findFirst({
    where: eq(usuarios.id, parsed.data.usuarioExecutorId),
  });

  if (!executor) {
    return NextResponse.json(
      { error: "Usuário executor não encontrado" },
      { status: 404 }
    );
  }

  // Atualiza a requisição
  const [requisicao] = await db
    .update(requisicoesLimpeza)
    .set({
      usuarioExecutorId: parsed.data.usuarioExecutorId,
      usuarioExecutorNome: executor.nome,
      usuarioExecutorEmail: executor.email,
    })
    .where(eq(requisicoesLimpeza.id, id))
    .returning();

  if (!requisicao) {
    return NextResponse.json(
      { error: "Requisição não encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(requisicao);
}
