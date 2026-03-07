import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usuarios } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { sendWelcomeEmail, sendAccountRejectedEmail } from "@/lib/email";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  ativo: z.boolean().optional(),
  perfil: z.enum(["ADMIN", "ANALISTA", "OPERADOR"]).optional(),
  nome: z.string().optional(),
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

  const [atualizado] = await db
    .update(usuarios)
    .set(parsed.data)
    .where(eq(usuarios.id, id))
    .returning({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      perfil: usuarios.perfil,
      ativo: usuarios.ativo,
    });

  // Envia email de boas-vindas quando conta é aprovada
  if (parsed.data.ativo === true && !usuario.ativo) {
    try {
      await sendWelcomeEmail(usuario.email, usuario.nome);
    } catch {
      // Email não crítico
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

  await db.delete(usuarios).where(eq(usuarios.id, id));

  try {
    await sendAccountRejectedEmail(usuario.email, usuario.nome);
  } catch {
    // Email não crítico
  }

  return NextResponse.json({ success: true });
}
