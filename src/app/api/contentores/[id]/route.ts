import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentores, statusHistorico } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const [contentor] = await db
    .select()
    .from(contentores)
    .where(eq(contentores.id, id))
    .limit(1);

  if (!contentor) {
    return NextResponse.json({ error: "Contentor não encontrado" }, { status: 404 });
  }

  return NextResponse.json(contentor);
}

const atualizarSchema = z.object({
  status: z
    .enum([
      "APROVADO",
      "APROVADO_SUJO",
      "REPROVADO_VENCIDO",
      "REPROVADO_INTEGRIDADE",
      "RESERVADO_PRODUCAO",
      "RESERVADO_PRODUCAO_EM_LIMPEZA",
      "EM_LIMPEZA",
      "MANUTENCAO_INTERNA",
      "RESERVADO_USO_INTERNO",
      "DISPONIVEL",
      "EM_CICLO",
      "MANUTENCAO_EXTERNA",
      "RETIDO",
    ])
    .optional(),
  observacoes: z.string().optional(),
  motivoReprovacao: z.string().optional(),
  motivo: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const body = await request.json() as unknown;
  const parsed = atualizarSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const [atual] = await db
    .select()
    .from(contentores)
    .where(eq(contentores.id, id))
    .limit(1);

  if (!atual) {
    return NextResponse.json({ error: "Contentor não encontrado" }, { status: 404 });
  }

  const { motivo, ...dadosAtualizacao } = parsed.data;

  const [atualizado] = await db
    .update(contentores)
    .set({ ...dadosAtualizacao, updatedAt: new Date() })
    .where(eq(contentores.id, id))
    .returning();

  if (parsed.data.status && parsed.data.status !== atual.status) {
    await db.insert(statusHistorico).values({
      contentorId: id,
      statusAnterior: atual.status,
      statusNovo: parsed.data.status,
      usuarioNome: session.nome,
      usuarioEmail: session.email,
      motivo: motivo,
      origem: "API",
    });
  }

  return NextResponse.json(atualizado);
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  if (session.perfil !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  await db.delete(contentores).where(eq(contentores.id, id));

  return NextResponse.json({ success: true });
}
