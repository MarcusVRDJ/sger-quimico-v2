import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usuarios } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import {
  sendAccountApprovedWithTemporaryPasswordEmail,
  sendAccountRejectedEmail,
} from "@/lib/email";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generateTemporaryPassword } from "@/lib/password";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  ativo: z.boolean().optional(),
  perfil: z.enum(["ADMIN", "ANALISTA", "OPERADOR"]).optional(),
  nome: z.string().optional(),
});

const rejectionSchema = z.object({
  motivo: z.string().min(5, "Informe um motivo com ao menos 5 caracteres"),
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireRole(["ADMIN"], request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const body = await request.json() as unknown;
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.id, id))
    .limit(1);

  if (!usuario) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const shouldApprove = parsed.data.ativo === true && !usuario.ativo;
  let updatedPayload: {
    ativo?: boolean;
    perfil?: "ADMIN" | "ANALISTA" | "OPERADOR";
    nome?: string;
    senhaHash?: string;
    exigeTrocaSenha?: boolean;
    senhaTemporariaExpiraEm?: Date;
    aprovadoPorId?: string;
    aprovadoEm?: Date;
    motivoReprovacao?: string | null;
    reprovadoEm?: Date | null;
  } = { ...parsed.data };

  let temporaryPassword: string | null = null;
  let temporaryPasswordExpiresAt: Date | null = null;

  if (shouldApprove) {
    temporaryPassword = generateTemporaryPassword();
    temporaryPasswordExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    updatedPayload = {
      ...updatedPayload,
      ativo: true,
      senhaHash: await bcrypt.hash(temporaryPassword, 10),
      exigeTrocaSenha: true,
      senhaTemporariaExpiraEm: temporaryPasswordExpiresAt,
      aprovadoPorId: session.sub,
      aprovadoEm: new Date(),
      motivoReprovacao: null,
      reprovadoEm: null,
    };
  }

  const [atualizado] = await db
    .update(usuarios)
    .set(updatedPayload)
    .where(eq(usuarios.id, id))
    .returning({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      perfil: usuarios.perfil,
      ativo: usuarios.ativo,
    });

  if (shouldApprove && temporaryPassword && temporaryPasswordExpiresAt) {
    try {
      await sendAccountApprovedWithTemporaryPasswordEmail(
        usuario.email,
        usuario.nome,
        temporaryPassword,
        temporaryPasswordExpiresAt
      );
    } catch (error) {
      console.error("Falha ao enviar email de aprovacao", {
        userId: usuario.id,
        error,
      });
    }
  }

  return NextResponse.json(atualizado);
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await requireRole(["ADMIN"], request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.id, id))
    .limit(1);

  if (!usuario) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  // Não permite excluir a si mesmo
  if (id === session.sub) {
    return NextResponse.json(
      { error: "Você não pode excluir sua própria conta" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null) as unknown;
  const parsed = rejectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Motivo de reprovação inválido" },
      { status: 400 }
    );
  }

  await db
    .update(usuarios)
    .set({
      ativo: false,
      motivoReprovacao: parsed.data.motivo,
      reprovadoEm: new Date(),
      exigeTrocaSenha: false,
      senhaTemporariaExpiraEm: null,
      aprovadoPorId: null,
      aprovadoEm: null,
    })
    .where(eq(usuarios.id, id));

  try {
    await sendAccountRejectedEmail(usuario.email, usuario.nome, parsed.data.motivo);
  } catch (error) {
    console.error("Falha ao enviar email de reprovação", {
      userId: usuario.id,
      error,
    });
  }

  return NextResponse.json({ success: true });
}
