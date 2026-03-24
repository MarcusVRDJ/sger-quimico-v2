import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  checklistsExpedicao,
  contentores,
  statusHistorico,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const checklistSchema = z.object({
  numeroSerie: z.string().min(1),
  tampaOk: z.boolean(),
  vedacaoOk: z.boolean(),
  lacresIntactos: z.boolean(),
  nomeProduto: z.string().optional(),
  numeroLote: z.string().optional(),
  dataFabricacao: z.string().optional(),
  dataValidade: z.string().optional(),
  quantidadeKg: z.string().optional(),
  numeroNfSaida: z.string().optional(),
  tipoDestino: z.string().min(1),
  clienteNome: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const body = await request.json() as unknown;
  const parsed = checklistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    numeroSerie,
    tampaOk,
    vedacaoOk,
    lacresIntactos,
    nomeProduto,
    numeroLote,
    dataFabricacao,
    dataValidade,
    quantidadeKg,
    numeroNfSaida,
    tipoDestino,
    clienteNome,
    observacoes,
  } = parsed.data;

  // Busca contentor
  const [contentor] = await db
    .select()
    .from(contentores)
    .where(eq(contentores.numeroSerie, numeroSerie))
    .limit(1);

  if (!contentor) {
    return NextResponse.json(
      { error: `Contentor com número de série "${numeroSerie}" não encontrado` },
      { status: 404 }
    );
  }

  // Determina status resultante
  const reprovado = !tampaOk || !vedacaoOk || !lacresIntactos;
  const statusResultante = reprovado
    ? "RETIDO"
    : tipoDestino === "MANUTENCAO_EXTERNA"
      ? "MANUTENCAO_EXTERNA"
      : "EM_CICLO";

  // Cria checklist (snapshot pattern)
  const [checklist] = await db
    .insert(checklistsExpedicao)
    .values({
      contentorId: contentor.id,
      operadorId: session.sub,
      operadorNome: session.nome,
      operadorEmail: session.email,
      tampaOk,
      vedacaoOk,
      lacresIntactos,
      nomeProduto,
      numeroLote,
      dataFabricacao: dataFabricacao ? new Date(dataFabricacao) : undefined,
      dataValidade: dataValidade ? new Date(dataValidade) : undefined,
      quantidadeKg,
      numeroNfSaida,
      tipoDestino,
      clienteNome,
      statusResultante,
      observacoes,
    })
    .returning();

  // Atualiza status do contentor
  const statusAnterior = contentor.status;
  await db
    .update(contentores)
    .set({ status: statusResultante, updatedAt: new Date() })
    .where(eq(contentores.id, contentor.id));

  // Registra histórico
  await db.insert(statusHistorico).values({
    contentorId: contentor.id,
    statusAnterior,
    statusNovo: statusResultante,
    usuarioNome: session.nome,
    usuarioEmail: session.email,
    motivo: "Checklist de expedição EXPED-001",
    origem: "CHECKLIST_EXPEDICAO",
    metadata: { checklistId: checklist.id, tipoDestino, clienteNome },
  });

  return NextResponse.json(checklist, { status: 201 });
}
