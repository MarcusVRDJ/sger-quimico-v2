import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notificacoes } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const rows = await db
    .select()
    .from(notificacoes)
    .where(eq(notificacoes.userId, session.sub))
    .orderBy(desc(notificacoes.createdAt))
    .limit(50);

  return NextResponse.json(rows);
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  // Marca todas as notificações do usuário como lidas
  await db
    .update(notificacoes)
    .set({ lida: true })
    .where(eq(notificacoes.userId, session.sub));

  return NextResponse.json({ success: true });
}
