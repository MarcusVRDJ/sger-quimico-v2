import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { tokensRecuperacaoSenha, usuarios } from "@/drizzle/schema";
import { generateOpaqueToken } from "@/lib/password";
import { hashToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null) as unknown;
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const [usuario] = await db
    .select({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
    })
    .from(usuarios)
    .where(and(eq(usuarios.email, email), eq(usuarios.ativo, true)))
    .limit(1);

  if (!usuario) {
    return NextResponse.json({ success: true, message: "Se o email existir, você receberá instruções em instantes." });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  const token = generateOpaqueToken();

  await db
    .delete(tokensRecuperacaoSenha)
    .where(and(eq(tokensRecuperacaoSenha.userId, usuario.id), isNull(tokensRecuperacaoSenha.usedAt)));

  await db.insert(tokensRecuperacaoSenha).values({
    userId: usuario.id,
    tokenHash: hashToken(token),
    expiresAt,
  });

  try {
    await sendPasswordResetEmail(usuario.email, usuario.nome, token, expiresAt);
  } catch (error) {
    console.error("Falha ao enviar email de recuperacao", {
      userId: usuario.id,
      error,
    });
  }

  return NextResponse.json({ success: true, message: "Se o email existir, você receberá instruções em instantes." });
}
