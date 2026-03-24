import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentores, statusContentorEnum } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import type { StatusContentor } from "@/drizzle/schema";
import { z } from "zod";

const querySchema = z.object({
  status: z.enum(statusContentorEnum.enumValues).optional(),
  numeroSerie: z.string().trim().min(1).optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const rawQuery = {
    status: searchParams.get("status") ?? undefined,
    numeroSerie: searchParams.get("numeroSerie") ?? undefined,
  };

  const parsedQuery = querySchema.safeParse(rawQuery);
  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Parâmetros de consulta inválidos",
        details: parsedQuery.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { status, numeroSerie } = parsedQuery.data;

  try {
    const rows = numeroSerie
      ? await db
          .select()
          .from(contentores)
          .where(eq(contentores.numeroSerie, numeroSerie))
      : status
        ? await db
            .select()
            .from(contentores)
            .where(eq(contentores.status, status as StatusContentor))
        : await db.select().from(contentores);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro em GET /api/contentores", error);
    return NextResponse.json(
      { error: "Falha ao buscar contentores" },
      { status: 500 }
    );
  }
}

const novoContentorSchema = z.object({
  numeroSerie: z.string().min(1),
  tipoContentor: z.enum(["OFFSHORE", "ONSHORE_REFIL", "ONSHORE_BASE"]),
  material: z.string().optional(),
  capacidadeLitros: z.number().int().optional(),
  fabricante: z.string().optional(),
  tara: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  if (session.perfil !== "ADMIN" && session.perfil !== "ANALISTA") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json() as unknown;
  const parsed = novoContentorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [contentor] = await db
    .insert(contentores)
    .values(parsed.data)
    .returning();

  return NextResponse.json(contentor, { status: 201 });
}
