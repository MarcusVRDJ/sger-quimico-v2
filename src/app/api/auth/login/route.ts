import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usuarios } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signJWT, setAuthCookie, createSession } from "@/lib/auth";
import {
  isMobileRequest,
  isDeviceAllowedForPerfil,
  deviceAccessErrorMessage,
} from "@/lib/device-access";
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

  const mobileRequest = isMobileRequest(request);

  if (!isDeviceAllowedForPerfil(usuario.perfil, mobileRequest)) {
    return NextResponse.json(
      {
        error: deviceAccessErrorMessage(usuario.perfil),
      },
      { status: 403 }
    );
  }

  if (usuario.exigeTrocaSenha) {
    const now = new Date();

    if (usuario.senhaTemporariaExpiraEm && usuario.senhaTemporariaExpiraEm < now) {
      return NextResponse.json(
        {
          error: "Sua senha temporária expirou. Solicite recuperação de senha.",
          code: "SENHA_TEMPORARIA_EXPIRADA",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: "Primeiro acesso detectado. Troque sua senha para continuar.",
        code: "TROCA_SENHA_OBRIGATORIA",
      },
      { status: 403 }
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
