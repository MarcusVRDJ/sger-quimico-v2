import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requisicoesLimpeza, contentores, usuarios } from "@/drizzle/schema";
import { eq, desc, inArray, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  let executorId = searchParams.get("executor_id");

  // Suporte para "current" = usuário autenticado
  if (executorId === "current") {
    executorId = session.sub;
  }

  const selectFields = {
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
    numeroSerieContentor: contentores.numeroSerie,
  };

  const conditions = [];
  if (statusParam) {
    const statusList = statusParam.split(",") as Array<
      "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA"
    >;
    conditions.push(inArray(requisicoesLimpeza.status, statusList));
  }
  if (executorId) {
    conditions.push(eq(requisicoesLimpeza.usuarioExecutorId, executorId));
  }

  const baseQuery = db
    .select(selectFields)
    .from(requisicoesLimpeza)
    .leftJoin(contentores, eq(requisicoesLimpeza.contentorId, contentores.id));

  const rows =
    conditions.length === 0
      ? await baseQuery.orderBy(desc(requisicoesLimpeza.dataSolicitacao))
      : conditions.length === 1
        ? await baseQuery
            .where(conditions[0])
            .orderBy(desc(requisicoesLimpeza.dataSolicitacao))
        : await baseQuery
            .where(and(...conditions))
            .orderBy(desc(requisicoesLimpeza.dataSolicitacao));

  return NextResponse.json(rows);
}

const criarSchema = z.object({
  contentorId: z.string().uuid(),
  usuarioExecutorId: z.string().uuid().optional(),
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

  // Se executorId foi fornecido, busca dados do usuário
  let executorNome: string | undefined;
  let executorEmail: string | undefined;
  if (parsed.data.usuarioExecutorId) {
    const executor = await db.query.usuarios.findFirst({
      where: eq(usuarios.id, parsed.data.usuarioExecutorId),
    });
    if (!executor) {
      return NextResponse.json(
        { error: "Usuário executor não encontrado" },
        { status: 404 }
      );
    }
    executorNome = executor.nome;
    executorEmail = executor.email;
  }

  const [requisicao] = await db
    .insert(requisicoesLimpeza)
    .values({
      contentorId: parsed.data.contentorId,
      usuarioSolicitanteId: session.sub,
      usuarioSolicitanteNome: session.nome,
      usuarioSolicitanteEmail: session.email,
      usuarioExecutorId: parsed.data.usuarioExecutorId,
      usuarioExecutorNome: executorNome,
      usuarioExecutorEmail: executorEmail,
      prioridade: parsed.data.prioridade,
      tipoOrigem: parsed.data.tipoOrigem,
      reservadoParaProducao: parsed.data.reservadoParaProducao,
      observacoes: parsed.data.observacoes,
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
