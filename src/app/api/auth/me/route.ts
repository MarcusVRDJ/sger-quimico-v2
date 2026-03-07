import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  return NextResponse.json({
    id: session.sub,
    email: session.email,
    nome: session.nome,
    perfil: session.perfil,
  });
}
