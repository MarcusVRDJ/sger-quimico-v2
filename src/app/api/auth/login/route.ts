import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usuarios, sessions } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signJWT, setAuthCookie, createSession, hashToken } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json() as unknown;
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos" },
      { status: 400 }
    );
  }

  const { email, senha } = parsed.data;

  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, email.toLowerCase()))
    .limit(1);

  if (!usuario) {
    return NextResponse.json(
      { error: "Email ou senha inválidos" },
      { status: 401 }
    );
  }

  if (!usuario.ativo) {
    return NextResponse.json(
      {
        error:
          "Conta pendente de aprovação. Aguarde a confirmação do administrador.",
      },
      { status: 403 }
    );
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    return NextResponse.json(
      { error: "Email ou senha inválidos" },
      { status: 401 }
    );
  }

  const token = await signJWT({
    sub: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    perfil: usuario.perfil,
    sessionId: crypto.randomUUID(),
  });

  await createSession(usuario.id, token);

  const response = NextResponse.json({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  });

  setAuthCookie(response, token);

  return response;
}
