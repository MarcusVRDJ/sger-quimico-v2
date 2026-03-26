import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  checklistTemplates,
  checklistTemplateRevisoes,
  checklistTemplateEventos,
} from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { createRevisionSchema } from "@/lib/checklist-template-definition";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireRole(["ADMIN"], request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const revisoes = await db
    .select()
    .from(checklistTemplateRevisoes)
    .where(eq(checklistTemplateRevisoes.templateId, id))
    .orderBy(desc(checklistTemplateRevisoes.versao));

  return NextResponse.json(revisoes);
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireRole(["ADMIN"], request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = (await request.json()) as unknown;
  const parsed = createRevisionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [template] = await db
    .select({ id: checklistTemplates.id })
    .from(checklistTemplates)
    .where(eq(checklistTemplates.id, id))
    .limit(1);

  if (!template) {
    return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
  }

  const [lastRevision] = await db
    .select({ versao: checklistTemplateRevisoes.versao })
    .from(checklistTemplateRevisoes)
    .where(eq(checklistTemplateRevisoes.templateId, id))
    .orderBy(desc(checklistTemplateRevisoes.versao))
    .limit(1);

  const nextVersion = (lastRevision?.versao ?? 0) + 1;
  const now = new Date();

  const [revisao] = await db
    .insert(checklistTemplateRevisoes)
    .values({
      templateId: id,
      versao: nextVersion,
      status: "RASCUNHO",
      definicao: parsed.data.definicao,
      resumoMudancas: parsed.data.resumoMudancas,
      criadoPorId: session.sub,
      updatedAt: now,
    })
    .returning();

  await db.insert(checklistTemplateEventos).values({
    templateId: id,
    revisaoId: revisao.id,
    acao: "REVISAO_CRIADA",
    usuarioId: session.sub,
    usuarioNome: session.nome,
    usuarioEmail: session.email,
    detalhes: { versao: revisao.versao },
  });

  await db
    .update(checklistTemplates)
    .set({ updatedAt: now })
    .where(eq(checklistTemplates.id, id));

  return NextResponse.json(revisao, { status: 201 });
}
