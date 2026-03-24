import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentores } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const numeroSerie = searchParams.get("numeroSerie")?.trim();

  if (!numeroSerie) {
    return NextResponse.json(
      { error: "Parâmetro numeroSerie é obrigatório" },
      { status: 400 }
    );
  }

  const [contentor] = await db
    .select()
    .from(contentores)
    .where(eq(contentores.numeroSerie, numeroSerie))
    .limit(1);

  if (!contentor) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({ found: true, contentor });
}