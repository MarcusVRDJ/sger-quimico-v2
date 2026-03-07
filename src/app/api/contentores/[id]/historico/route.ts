import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { statusHistorico } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const historico = await db
    .select()
    .from(statusHistorico)
    .where(eq(statusHistorico.contentorId, id))
    .orderBy(desc(statusHistorico.dataMudanca))
    .limit(50);

  return NextResponse.json(historico);
}
