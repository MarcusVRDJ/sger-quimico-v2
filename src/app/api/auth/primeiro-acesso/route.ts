import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { usuarios } from "@/drizzle/schema";
import { isStrongPassword } from "@/lib/password";
import { revokeAllSessionsForUser } from "@/lib/auth";

const primeiroAcessoSchema = z.object({
  email: z.string().email(),
  senhaAtual: z.string().min(1),
  novaSenha: z.string().min(10),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null) as unknown;
  const parsed = primeiroAcessoSchema.safeParse(body);

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

  const email = parsed.data.email.toLowerCase();
  const [usuario] = await db
    .select({
      id: usuarios.id,
      senhaHash: usuarios.senhaHash,
      exigeTrocaSenha: usuarios.exigeTrocaSenha,
      senhaTemporariaExpiraEm: usuarios.senhaTemporariaExpiraEm,
    })
    .from(usuarios)
    .where(and(eq(usuarios.email, email), eq(usuarios.ativo, true)))
    .limit(1);

  if (!usuario) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const senhaValida = await bcrypt.compare(parsed.data.senhaAtual, usuario.senhaHash);
  if (!senhaValida) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  if (!usuario.exigeTrocaSenha) {
    return NextResponse.json({ error: "Este usuário não está em fluxo de primeiro acesso" }, { status: 400 });
  }

  if (usuario.senhaTemporariaExpiraEm && usuario.senhaTemporariaExpiraEm < new Date()) {
    return NextResponse.json(
      { error: "Senha temporária expirada. Solicite recuperação de senha." },
      { status: 400 }
    );
  }

  const senhaHash = await bcrypt.hash(parsed.data.novaSenha, 10);

  await db
    .update(usuarios)
    .set({
      senhaHash,
      exigeTrocaSenha: false,
      senhaTemporariaExpiraEm: null,
    })
    .where(eq(usuarios.id, usuario.id));

  await revokeAllSessionsForUser(usuario.id);

  return NextResponse.json({ success: true });
}
