import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  checklistTemplates,
  checklistTemplateRevisoes,
  checklistTemplateEventos,
} from "@/drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { createTemplateSchema } from "@/lib/checklist-template-definition";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireRole(["ADMIN"], request);
  if (session instanceof NextResponse) return session;

  const rows = await db
    .select({
      id: checklistTemplates.id,
      nome: checklistTemplates.nome,
      descricao: checklistTemplates.descricao,
      tipoChecklist: checklistTemplates.tipoChecklist,
      ativo: checklistTemplates.ativo,
      criadoPorId: checklistTemplates.criadoPorId,
      createdAt: checklistTemplates.createdAt,
      updatedAt: checklistTemplates.updatedAt,
    })
    .from(checklistTemplates)
    .orderBy(desc(checklistTemplates.updatedAt));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireRole(["ADMIN"], request);
  if (session instanceof NextResponse) return session;

  const body = (await request.json()) as unknown;
  const parsed = createTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date();

  const result = await db.transaction(async (tx) => {
    const [template] = await tx
      .insert(checklistTemplates)
      .values({
        nome: parsed.data.nome,
        descricao: parsed.data.descricao,
        tipoChecklist: parsed.data.tipoChecklist,
        criadoPorId: session.sub,
        updatedAt: now,
      })
      .returning();

    const [revisao] = await tx
      .insert(checklistTemplateRevisoes)
      .values({
        templateId: template.id,
        versao: 1,
        status: "RASCUNHO",
        definicao: parsed.data.definicao,
        resumoMudancas: parsed.data.resumoMudancas,
        criadoPorId: session.sub,
        updatedAt: now,
      })
      .returning();

    await tx.insert(checklistTemplateEventos).values({
      templateId: template.id,
      revisaoId: revisao.id,
      acao: "TEMPLATE_CRIADO",
      usuarioId: session.sub,
      usuarioNome: session.nome,
      usuarioEmail: session.email,
      detalhes: { versao: revisao.versao },
    });

    return { template, revisao };
  });

  return NextResponse.json(result, { status: 201 });
}
