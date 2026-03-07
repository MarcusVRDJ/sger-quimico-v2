import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentores } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import type { StatusContentor } from "@/drizzle/schema";
import { z } from "zod";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as StatusContentor | null;

  const rows = status
    ? await db
        .select()
        .from(contentores)
        .where(eq(contentores.status, status))
    : await db.select().from(contentores);

  return NextResponse.json(rows);
}

const novoContentorSchema = z.object({
  codigo: z.string().min(1),
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
