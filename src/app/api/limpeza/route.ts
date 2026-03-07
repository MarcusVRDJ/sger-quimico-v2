import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requisicoesLimpeza, contentores } from "@/drizzle/schema";
import { eq, desc, or, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  let rows;
  if (statusParam) {
    const statusList = statusParam.split(",") as Array<
      "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA"
    >;
    rows = await db
      .select({
        id: requisicoesLimpeza.id,
        contentorId: requisicoesLimpeza.contentorId,
        usuarioSolicitanteId: requisicoesLimpeza.usuarioSolicitanteId,
        usuarioSolicitanteNome: requisicoesLimpeza.usuarioSolicitanteNome,
        usuarioSolicitanteEmail: requisicoesLimpeza.usuarioSolicitanteEmail,
        usuarioExecutorId: requisicoesLimpeza.usuarioExecutorId,
        usuarioExecutorNome: requisicoesLimpeza.usuarioExecutorNome,
        usuarioExecutorEmail: requisicoesLimpeza.usuarioExecutorEmail,
        dataSolicitacao: requisicoesLimpeza.dataSolicitacao,
        dataInicio: requisicoesLimpeza.dataInicio,
        dataConclusao: requisicoesLimpeza.dataConclusao,
        status: requisicoesLimpeza.status,
        prioridade: requisicoesLimpeza.prioridade,
        tipoOrigem: requisicoesLimpeza.tipoOrigem,
        reservadoParaProducao: requisicoesLimpeza.reservadoParaProducao,
        observacoes: requisicoesLimpeza.observacoes,
        codigoContentor: contentores.codigo,
      })
      .from(requisicoesLimpeza)
      .leftJoin(
        contentores,
        eq(requisicoesLimpeza.contentorId, contentores.id)
      )
      .where(inArray(requisicoesLimpeza.status, statusList))
      .orderBy(desc(requisicoesLimpeza.dataSolicitacao));
  } else {
    rows = await db
      .select({
        id: requisicoesLimpeza.id,
        contentorId: requisicoesLimpeza.contentorId,
        usuarioSolicitanteId: requisicoesLimpeza.usuarioSolicitanteId,
        usuarioSolicitanteNome: requisicoesLimpeza.usuarioSolicitanteNome,
        usuarioSolicitanteEmail: requisicoesLimpeza.usuarioSolicitanteEmail,
        usuarioExecutorId: requisicoesLimpeza.usuarioExecutorId,
        usuarioExecutorNome: requisicoesLimpeza.usuarioExecutorNome,
        usuarioExecutorEmail: requisicoesLimpeza.usuarioExecutorEmail,
        dataSolicitacao: requisicoesLimpeza.dataSolicitacao,
        dataInicio: requisicoesLimpeza.dataInicio,
        dataConclusao: requisicoesLimpeza.dataConclusao,
        status: requisicoesLimpeza.status,
        prioridade: requisicoesLimpeza.prioridade,
        tipoOrigem: requisicoesLimpeza.tipoOrigem,
        reservadoParaProducao: requisicoesLimpeza.reservadoParaProducao,
        observacoes: requisicoesLimpeza.observacoes,
        codigoContentor: contentores.codigo,
      })
      .from(requisicoesLimpeza)
      .leftJoin(
        contentores,
        eq(requisicoesLimpeza.contentorId, contentores.id)
      )
      .orderBy(desc(requisicoesLimpeza.dataSolicitacao));
  }

  return NextResponse.json(rows);
}

const criarSchema = z.object({
  contentorId: z.string().uuid(),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).default("MEDIA"),
  tipoOrigem: z
    .enum(["REQUISICAO_FORMAL", "LIMPEZA_DIRETA"])
    .default("REQUISICAO_FORMAL"),
  reservadoParaProducao: z.boolean().default(false),
  observacoes: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const body = await request.json() as unknown;
  const parsed = criarSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const [requisicao] = await db
    .insert(requisicoesLimpeza)
    .values({
      ...parsed.data,
      usuarioSolicitanteId: session.sub,
      usuarioSolicitanteNome: session.nome,
      usuarioSolicitanteEmail: session.email,
    })
    .returning();

  // Atualiza status do contentor
  const novoStatus =
    parsed.data.reservadoParaProducao
      ? "RESERVADO_PRODUCAO_EM_LIMPEZA"
      : "EM_LIMPEZA";

  await db
    .update(contentores)
    .set({ status: novoStatus, updatedAt: new Date() })
    .where(eq(contentores.id, parsed.data.contentorId));

  return NextResponse.json(requisicao, { status: 201 });
}
