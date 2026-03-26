import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usuarios } from "@/drizzle/schema";
import { and, eq, isNull } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireRole(["ADMIN"], request);
  if (session instanceof NextResponse) return session;

  const rows = await db
    .select({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      perfil: usuarios.perfil,
      ativo: usuarios.ativo,
      motivoReprovacao: usuarios.motivoReprovacao,
      reprovadoEm: usuarios.reprovadoEm,
      createdAt: usuarios.createdAt,
    })
    .from(usuarios)
    .where(and(eq(usuarios.ativo, false), isNull(usuarios.reprovadoEm)));

  return NextResponse.json(rows);
}
