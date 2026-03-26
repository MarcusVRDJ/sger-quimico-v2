import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { tokensRecuperacaoSenha, usuarios } from "@/drizzle/schema";
import { hashToken, revokeAllSessionsForUser } from "@/lib/auth";
import { isStrongPassword } from "@/lib/password";

const resetPasswordSchema = z.object({
  token: z.string().min(20),
  novaSenha: z.string().min(10),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null) as unknown;
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (!isStrongPassword(parsed.data.novaSenha)) {
    return NextResponse.json(
      {
        error:
          "A nova senha deve ter ao menos 10 caracteres, incluindo letra maiúscula, minúscula e número.",
      },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(parsed.data.token);
  const now = new Date();

  const [tokenRecord] = await db
    .select({
      id: tokensRecuperacaoSenha.id,
      userId: tokensRecuperacaoSenha.userId,
      expiresAt: tokensRecuperacaoSenha.expiresAt,
    })
    .from(tokensRecuperacaoSenha)
    .where(
      and(
        eq(tokensRecuperacaoSenha.tokenHash, tokenHash),
        isNull(tokensRecuperacaoSenha.usedAt),
        gt(tokensRecuperacaoSenha.expiresAt, now)
      )
    )
    .limit(1);

  if (!tokenRecord) {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(parsed.data.novaSenha, 10);

  await db
    .update(usuarios)
    .set({
      senhaHash,
      exigeTrocaSenha: false,
      senhaTemporariaExpiraEm: null,
    })
    .where(eq(usuarios.id, tokenRecord.userId));

  await db
    .update(tokensRecuperacaoSenha)
    .set({ usedAt: now })
    .where(eq(tokensRecuperacaoSenha.id, tokenRecord.id));

  await revokeAllSessionsForUser(tokenRecord.userId);

  return NextResponse.json({ success: true });
}
