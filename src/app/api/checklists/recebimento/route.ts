import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  checklistsRecebimento,
  contentores,
  statusHistorico,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { calcularStatusRecebimento } from "@/lib/checklist-logic";
import { z } from "zod";

const checklistSchema = z.object({
  numeroSerie: z.string().min(1),
  tipoContentor: z.enum(["OFFSHORE", "ONSHORE_REFIL", "ONSHORE_BASE"]),
  fabricante: z.string().optional(),
  capacidadeLitros: z.number().int().positive().optional(),
  tara: z.string().optional(),
  avarias: z.boolean(),
  lacreRoto: z.boolean(),
  testesVencidos: z.boolean(),
  produtoAnterior: z.boolean(),
  residuos: z.boolean(),
  observacoes: z.string().optional(),
  dataValidade: z.string().optional(),
  dataUltimaInspecao: z.string().optional(),
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
    tipoContentor,
    fabricante,
    capacidadeLitros,
    tara,
    avarias,
    lacreRoto,
    testesVencidos,
    produtoAnterior,
    residuos,
    observacoes,
    dataValidade,
    dataUltimaInspecao,
  } = parsed.data;

  // Busca contentor por numero de serie
  let [contentor] = await db
    .select()
    .from(contentores)
    .where(eq(contentores.numeroSerie, numeroSerie))
    .limit(1);

  if (!contentor) {
    [contentor] = await db
      .insert(contentores)
      .values({
        numeroSerie,
        tipoContentor,
        fabricante,
        capacidadeLitros,
        tara,
        status: "DISPONIVEL",
      })
      .returning();
  } else {
    const updates: Partial<
      Pick<typeof contentores.$inferInsert, "fabricante" | "capacidadeLitros" | "tara">
    > = {};

    if (fabricante && fabricante !== contentor.fabricante) {
      updates.fabricante = fabricante;
    }

    if (
      typeof capacidadeLitros === "number" &&
      capacidadeLitros !== contentor.capacidadeLitros
    ) {
      updates.capacidadeLitros = capacidadeLitros;
    }

    if (tara && tara !== contentor.tara) {
      updates.tara = tara;
    }

    if (Object.keys(updates).length > 0) {
      [contentor] = await db
        .update(contentores)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(contentores.id, contentor.id))
        .returning();
    }
  }

  const respostas = { avarias, lacreRoto, testesVencidos, produtoAnterior, residuos };
  const statusResultante = calcularStatusRecebimento(respostas);

  // Cria checklist (snapshot pattern)
  const [checklist] = await db
    .insert(checklistsRecebimento)
    .values({
      contentorId: contentor.id,
      operadorId: session.sub,
      operadorNome: session.nome,
      operadorEmail: session.email,
      tipoContentor,
      respostas,
      statusResultante,
      observacoes,
    })
    .returning();

  // Atualiza status do contentor
  const statusAnterior = contentor.status;
  await db
    .update(contentores)
    .set({
      status: statusResultante,
      tipoContentor,
      precisaLimpeza:
        statusResultante === "APROVADO_SUJO",
      dataUltimaInspecao: dataUltimaInspecao
        ? new Date(dataUltimaInspecao)
        : new Date(),
      dataValidade: dataValidade ? new Date(dataValidade) : contentor.dataValidade,
      updatedAt: new Date(),
    })
    .where(eq(contentores.id, contentor.id));

  // Registra histórico
  await db.insert(statusHistorico).values({
    contentorId: contentor.id,
    statusAnterior,
    statusNovo: statusResultante,
    usuarioNome: session.nome,
    usuarioEmail: session.email,
    motivo: "Checklist de recebimento RECEB-001",
    origem: "CHECKLIST_RECEBIMENTO",
    metadata: { checklistId: checklist.id },
  });

  return NextResponse.json(checklist, { status: 201 });
}
