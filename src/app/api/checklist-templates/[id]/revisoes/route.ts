import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  checklistTemplates,
  checklistTemplateRevisoes,
  checklistTemplateEventos,
} from "@/drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { createRevisionSchema } from "@/lib/checklist-template-definition";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as { code?: string }).code === "23505";
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

  const now = new Date();

  try {
    const revisao = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM checklist_templates WHERE id = ${id} FOR UPDATE`
      );

      const [lastRevision] = await tx
        .select({ versao: checklistTemplateRevisoes.versao })
        .from(checklistTemplateRevisoes)
        .where(eq(checklistTemplateRevisoes.templateId, id))
        .orderBy(desc(checklistTemplateRevisoes.versao))
        .limit(1);

      const nextVersion = (lastRevision?.versao ?? 0) + 1;

      const [created] = await tx
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

      await tx.insert(checklistTemplateEventos).values({
        templateId: id,
        revisaoId: created.id,
        acao: "REVISAO_CRIADA",
        usuarioId: session.sub,
        usuarioNome: session.nome,
        usuarioEmail: session.email,
        detalhes: { versao: created.versao },
      });

      await tx
        .update(checklistTemplates)
        .set({ updatedAt: now })
        .where(eq(checklistTemplates.id, id));

      return created;
    });

    return NextResponse.json(revisao, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        {
          error:
            "Conflito de versão ao criar revisão. Tente novamente para gerar a próxima versão.",
        },
        { status: 409 }
      );
    }

    throw error;
  }
}
