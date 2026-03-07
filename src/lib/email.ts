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
      <p>Aguarde a aprovação de um administrador. Você será notificado por email quando sua conta for ativada.</p>
    `,
  });
}

export async function sendNewAccountNotificationToAdmin(
  nome: string,
  email: string
): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: "Nova solicitação de acesso — SGE Químico v2",
    html: `
      <h1>Nova solicitação de acesso</h1>
      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><a href="${APP_URL}/usuarios">Revisar solicitação</a></p>
    `,
  });
}

export async function sendAccountRejectedEmail(
  to: string,
  nome: string
): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Solicitação de acesso não aprovada — SGE Químico v2",
    html: `
      <h1>Olá, ${nome}!</h1>
      <p>Infelizmente, sua solicitação de acesso ao SGE Químico v2 não foi aprovada.</p>
      <p>Entre em contato com o administrador do sistema para mais informações.</p>
    `,
  });
}
