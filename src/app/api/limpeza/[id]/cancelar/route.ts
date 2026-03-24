import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requisicoesLimpeza } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const [requisicao] = await db
    .update(requisicoesLimpeza)
    .set({
      status: "CANCELADA" as const,
    })
    .where(eq(requisicoesLimpeza.id, id))
    .returning();

  if (!requisicao) {
    return NextResponse.json(
      { error: "Requisição não encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(requisicao);
}
