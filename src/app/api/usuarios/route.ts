import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usuarios } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import {
  sendAccountPendingEmail,
  sendNewAccountNotificationToAdmins,
} from "@/lib/email";
import { z } from "zod";
import { generateTemporaryPassword, maskEmail } from "@/lib/password";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  if (session.perfil !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      perfil: usuarios.perfil,
      ativo: usuarios.ativo,
      createdAt: usuarios.createdAt,
    })
    .from(usuarios)
    .where(eq(usuarios.ativo, true));

  return NextResponse.json(rows);
}

const criarSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  perfil: z.enum(["ANALISTA", "OPERADOR"]).default("OPERADOR"),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rota pública — cadastro de novos usuários (conta inativa, aguarda aprovação)
  const body = await request.json() as unknown;
  const parsed = criarSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { nome, email, perfil } = parsed.data;

  // Verifica email duplicado
  const [existente] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.email, email.toLowerCase()))
    .limit(1);

  if (existente) {
    return NextResponse.json(
      { error: "Este email já está cadastrado" },
      { status: 409 }
    );
  }

  const senhaHash = await bcrypt.hash(generateTemporaryPassword(), 10);

  const [usuario] = await db
    .insert(usuarios)
    .values({
      nome,
      email: email.toLowerCase(),
      senhaHash,
      perfil,
      ativo: false,
      exigeTrocaSenha: false,
    })
    .returning({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      perfil: usuarios.perfil,
    });

  const admins = await db
    .select({ email: usuarios.email })
    .from(usuarios)
    .where(and(eq(usuarios.perfil, "ADMIN"), eq(usuarios.ativo, true)));

  const adminEmails = admins
    .map((admin) => admin.email.toLowerCase())
    .filter(Boolean);

  // Envia emails (não bloqueia a resposta em caso de falha)
  try {
    await Promise.all([
      sendAccountPendingEmail(email, nome),
      sendNewAccountNotificationToAdmins(adminEmails, nome, email),
    ]);
  } catch (error) {
    console.error("Falha ao enviar emails da solicitacao de acesso", {
      email,
      error,
    });
  }

  return NextResponse.json(
    {
      ...usuario,
      mensagem: "Solicitação criada e emails enviados.",
      emailDestinoMascarado: maskEmail(email),
    },
    { status: 201 }
  );
}
