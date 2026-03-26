import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checklistTemplates, checklistTemplateRevisoes } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchTemplateSchema = z.object({
  nome: z.string().min(3).optional(),
  descricao: z.string().optional(),
  ativo: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireRole(["ADMIN"], request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const [template] = await db
    .select()
    .from(checklistTemplates)
    .where(eq(checklistTemplates.id, id))
    .limit(1);

  if (!template) {
    return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
  }

  const revisoes = await db
    .select({
      id: checklistTemplateRevisoes.id,
      versao: checklistTemplateRevisoes.versao,
      status: checklistTemplateRevisoes.status,
      resumoMudancas: checklistTemplateRevisoes.resumoMudancas,
      criadoPorId: checklistTemplateRevisoes.criadoPorId,
      aprovadoPorId: checklistTemplateRevisoes.aprovadoPorId,
      aprovadoEm: checklistTemplateRevisoes.aprovadoEm,
      rejeitadoEm: checklistTemplateRevisoes.rejeitadoEm,
      motivoRejeicao: checklistTemplateRevisoes.motivoRejeicao,
      createdAt: checklistTemplateRevisoes.createdAt,
      updatedAt: checklistTemplateRevisoes.updatedAt,
    })
    .from(checklistTemplateRevisoes)
    .where(eq(checklistTemplateRevisoes.templateId, id))
    .orderBy(desc(checklistTemplateRevisoes.versao));

  return NextResponse.json({ template, revisoes });
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireRole(["ADMIN"], request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = (await request.json()) as unknown;
  const parsed = patchTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [template] = await db
    .select()
    .from(checklistTemplates)
    .where(eq(checklistTemplates.id, id))
    .limit(1);

  if (!template) {
    return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
  }

  const [updated] = await db
    .update(checklistTemplates)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(checklistTemplates.id, id))
    .returning();

  return NextResponse.json(updated);
}
