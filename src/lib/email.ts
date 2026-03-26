import { Resend } from "resend";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@sge.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@sge.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function parseAdminFallbackEmails(): string[] {
  return ADMIN_EMAIL.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function sendWelcomeEmail(
  to: string,
  nome: string
): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Bem-vindo ao SGE Químico v2",
    html: `
      <h1>Olá, ${nome}!</h1>
      <p>Sua conta no SGE Químico v2 foi aprovada. Você já pode acessar o sistema.</p>
      <a href="${APP_URL}/login">Acessar o sistema</a>
    `,
  });
}

export async function sendAccountPendingEmail(
  to: string,
  nome: string
): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Solicitação de acesso recebida — SGE Químico v2",
    html: `
      <h1>Olá, ${nome}!</h1>
      <p>Recebemos sua solicitação de acesso ao SGE Químico v2.</p>
      <p>Seu pedido foi registrado e notificado para os administradores responsáveis pela aprovação.</p>
      <p>Quando sua conta for aprovada, você receberá uma senha temporária por email para realizar o primeiro acesso.</p>
    `,
  });
}

export async function sendNewAccountNotificationToAdmins(
  recipients: string[],
  nome: string,
  email: string
): Promise<void> {
  const to = recipients.length > 0 ? recipients : parseAdminFallbackEmails();

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Nova solicitação de acesso — SGE Químico v2",
    html: `
      <h1>Nova solicitação de acesso</h1>
      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><a href="${APP_URL}/usuarios">Revisar solicitação</a></p>
    `,
  });
}

export async function sendAccountApprovedWithTemporaryPasswordEmail(
  to: string,
  nome: string,
  temporaryPassword: string,
  expiresAt: Date
): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Conta aprovada com senha temporária — SGE Químico v2",
    html: `
      <h1>Olá, ${nome}!</h1>
      <p>Sua conta foi aprovada no SGE Químico v2.</p>
      <p><strong>Senha temporária:</strong> ${temporaryPassword}</p>
      <p>Validade da senha temporária: <strong>${expiresAt.toLocaleString("pt-BR")}</strong>.</p>
      <p>Ao entrar, você deverá trocar sua senha obrigatoriamente para concluir o acesso.</p>
      <p><a href="${APP_URL}/login">Acessar login</a></p>
    `,
  });
}

export async function sendAccountRejectedEmail(
  to: string,
  nome: string,
  motivo: string
): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Solicitação de acesso não aprovada — SGE Químico v2",
    html: `
      <h1>Olá, ${nome}!</h1>
      <p>Infelizmente, sua solicitação de acesso ao SGE Químico v2 não foi aprovada.</p>
      <p><strong>Motivo informado:</strong> ${motivo}</p>
      <p>Entre em contato com o administrador do sistema para mais informações.</p>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  nome: string,
  token: string,
  expiresAt: Date
): Promise<void> {
  const resetUrl = `${APP_URL}/redefinir-senha?token=${encodeURIComponent(token)}`;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Recuperação de senha — SGE Químico v2",
    html: `
      <h1>Olá, ${nome}!</h1>
      <p>Recebemos uma solicitação para redefinir sua senha.</p>
      <p>Para continuar, acesse o link abaixo:</p>
      <p><a href="${resetUrl}">Redefinir senha</a></p>
      <p>Este link expira em <strong>1 hora</strong> (${expiresAt.toLocaleString("pt-BR")}).</p>
      <p>Se você não solicitou esta alteração, ignore este email.</p>
    `,
  });
}
