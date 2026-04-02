import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import bcrypt from "bcryptjs";
import { and, desc, eq } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed(): Promise<void> {
  console.log("🌱 Iniciando seed...");

  // Usuários
  const senhaHash = await bcrypt.hash("senha123", 10);

  async function ensureUser(input: {
    nome: string;
    email: string;
    perfil: "ADMIN" | "ANALISTA" | "OPERADOR";
  }) {
    const [inserted] = await db
      .insert(schema.usuarios)
      .values({
        nome: input.nome,
        email: input.email,
        senhaHash,
        perfil: input.perfil,
        ativo: true,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted) return inserted;

    const [existing] = await db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.email, input.email))
      .limit(1);

    if (!existing) {
      throw new Error(`Usuário ${input.email} não encontrado após upsert`);
    }

    return existing;
  }

  const admin = await ensureUser({
    nome: "Admin SGE",
    email: "admin@sge.com",
    perfil: "ADMIN",
  });

  await ensureUser({
    nome: "Admin SGE 2",
    email: "admin2@sge.com",
    perfil: "ADMIN",
  });

  const analista = await ensureUser({
    nome: "Ana Analista",
    email: "analista@sge.com",
    perfil: "ANALISTA",
  });

  await ensureUser({
    nome: "João Operador",
    email: "operador@sge.com",
    perfil: "OPERADOR",
  });

  console.log("✅ Usuários criados");

  // Contentores
  await db
    .insert(schema.contentores)
    .values([
      {
        numeroSerie: "SN-2024-001",
        tipoContentor: "OFFSHORE",
        status: "DISPONIVEL",
        material: "Aço Inoxidável 316L",
        capacidadeLitros: 1000,
        fabricante: "Schutz",
        tara: "250.00",
        dataValidade: new Date("2026-12-31"),
        dataUltimaInspecao: new Date("2024-06-15"),
        precisaLimpeza: false,
      },
      {
        numeroSerie: "SN-2024-002",
        tipoContentor: "ONSHORE_REFIL",
        status: "APROVADO_SUJO",
        material: "Aço Inoxidável 304",
        capacidadeLitros: 1000,
        fabricante: "Hoover Ferguson",
        tara: "245.00",
        dataValidade: new Date("2025-08-31"),
        dataUltimaInspecao: new Date("2024-07-20"),
        precisaLimpeza: true,
      },
      {
        numeroSerie: "SN-2024-003",
        tipoContentor: "ONSHORE_BASE",
        status: "EM_LIMPEZA",
        material: "Aço Inoxidável 316L",
        capacidadeLitros: 1500,
        fabricante: "Brambles",
        tara: "310.00",
        dataValidade: new Date("2027-03-31"),
        dataUltimaInspecao: new Date("2024-08-10"),
        precisaLimpeza: false,
      },
      {
        numeroSerie: "SN-2023-004",
        tipoContentor: "OFFSHORE",
        status: "REPROVADO_VENCIDO",
        material: "Aço Inoxidável 316L",
        capacidadeLitros: 1000,
        fabricante: "Schutz",
        tara: "250.00",
        dataValidade: new Date("2024-01-31"),
        dataUltimaInspecao: new Date("2023-11-05"),
        precisaLimpeza: false,
        motivoReprovacao: "Testes de pressão vencidos",
      },
      {
        numeroSerie: "SN-2024-005",
        tipoContentor: "ONSHORE_REFIL",
        status: "RESERVADO_PRODUCAO",
        material: "Aço Inoxidável 304",
        capacidadeLitros: 1000,
        fabricante: "Hoover Ferguson",
        tara: "248.00",
        dataValidade: new Date("2026-06-30"),
        dataUltimaInspecao: new Date("2024-09-01"),
        precisaLimpeza: false,
      },
    ])
    .onConflictDoNothing();

  console.log("✅ Contentores criados");

  async function ensureTemplateAprovado(input: {
    nome: string;
    descricao: string;
    tipoChecklist: "RECEBIMENTO" | "EXPEDICAO";
    definicao: unknown;
  }) {
    let [template] = await db
      .select()
      .from(schema.checklistTemplates)
      .where(
        and(
          eq(schema.checklistTemplates.nome, input.nome),
          eq(schema.checklistTemplates.tipoChecklist, input.tipoChecklist)
        )
      )
      .limit(1);

    if (!template) {
      [template] = await db
        .insert(schema.checklistTemplates)
        .values({
          nome: input.nome,
          descricao: input.descricao,
          tipoChecklist: input.tipoChecklist,
          ativo: true,
          criadoPorId: admin.id,
          updatedAt: new Date(),
        })
        .returning();
    }

    const [aprovada] = await db
      .select({ id: schema.checklistTemplateRevisoes.id })
      .from(schema.checklistTemplateRevisoes)
      .where(
        and(
          eq(schema.checklistTemplateRevisoes.templateId, template.id),
          eq(schema.checklistTemplateRevisoes.status, "APROVADO")
        )
      )
      .limit(1);

    if (aprovada) return;

    const [ultima] = await db
      .select({ versao: schema.checklistTemplateRevisoes.versao })
      .from(schema.checklistTemplateRevisoes)
      .where(eq(schema.checklistTemplateRevisoes.templateId, template.id))
      .orderBy(desc(schema.checklistTemplateRevisoes.versao))
      .limit(1);

    const now = new Date();
    const [revisao] = await db
      .insert(schema.checklistTemplateRevisoes)
      .values({
        templateId: template.id,
        versao: (ultima?.versao ?? 0) + 1,
        status: "APROVADO",
        definicao: input.definicao,
        resumoMudancas: "Template base inicial",
        criadoPorId: admin.id,
        aprovadoPorId: analista.id,
        aprovadoEm: now,
        updatedAt: now,
      })
      .returning();

    await db.insert(schema.checklistTemplateEventos).values({
      templateId: template.id,
      revisaoId: revisao.id,
      acao: "TEMPLATE_SEEDED",
      usuarioId: admin.id,
      usuarioNome: admin.nome,
      usuarioEmail: admin.email,
      detalhes: { versao: revisao.versao },
    });
  }

  await ensureTemplateAprovado({
    nome: "Recebimento Padrão",
    descricao: "Template inicial para checklist de recebimento",
    tipoChecklist: "RECEBIMENTO",
    definicao: {
      schemaVersion: 1,
      title: "Checklist de Recebimento",
      sections: [
        {
          id: "inspecao-externa",
          title: "Inspeção Externa",
          order: 0,
          fields: [
            {
              key: "avarias",
              label: "Há avarias físicas visíveis?",
              type: "boolean",
              required: true,
              order: 0,
            },
            {
              key: "lacreRoto",
              label: "Lacre roto ou ausente?",
              type: "boolean",
              required: true,
              order: 1,
            },
          ],
        },
        {
          id: "inspecao-interna",
          title: "Inspeção Interna",
          order: 1,
          fields: [
            {
              key: "produtoAnterior",
              label: "Presença de produto anterior?",
              type: "boolean",
              required: true,
              order: 0,
            },
            {
              key: "residuos",
              label: "Presença de resíduos?",
              type: "boolean",
              required: true,
              order: 1,
            },
          ],
        },
        {
          id: "validade",
          title: "Validades",
          order: 2,
          fields: [
            {
              key: "testesVencidos",
              label: "Testes técnicos vencidos?",
              type: "boolean",
              required: true,
              order: 0,
            },
            {
              key: "dataValidade",
              label: "Data de validade do contentor",
              type: "date",
              required: false,
              order: 1,
            },
            {
              key: "dataUltimaInspecao",
              label: "Data da última inspeção",
              type: "date",
              required: false,
              order: 2,
            },
          ],
        },
      ],
      statusRules: [
        {
          priority: 0,
          conditions: [{ key: "avarias", operator: "true" }],
          resultStatus: "REPROVADO_INTEGRIDADE",
        },
        {
          priority: 1,
          conditions: [{ key: "lacreRoto", operator: "true" }],
          resultStatus: "REPROVADO_INTEGRIDADE",
        },
        {
          priority: 2,
          conditions: [{ key: "testesVencidos", operator: "true" }],
          resultStatus: "REPROVADO_VENCIDO",
        },
        {
          priority: 3,
          conditions: [{ key: "produtoAnterior", operator: "true" }],
          resultStatus: "APROVADO_SUJO",
        },
        {
          priority: 4,
          conditions: [{ key: "residuos", operator: "true" }],
          resultStatus: "APROVADO_SUJO",
        },
        {
          priority: 5,
          conditions: [],
          resultStatus: "APROVADO",
        },
      ],
    },
  });

  await ensureTemplateAprovado({
    nome: "Expedição Padrão",
    descricao: "Template inicial para checklist de expedição",
    tipoChecklist: "EXPEDICAO",
    definicao: {
      schemaVersion: 1,
      title: "Checklist de Expedição",
      sections: [
        {
          id: "inspecao",
          title: "Inspeção",
          order: 0,
          fields: [
            {
              key: "tampaOk",
              label: "Tampa OK?",
              type: "boolean",
              required: true,
              order: 0,
            },
            {
              key: "vedacaoOk",
              label: "Vedação OK?",
              type: "boolean",
              required: true,
              order: 1,
            },
            {
              key: "lacresIntactos",
              label: "Lacres intactos?",
              type: "boolean",
              required: true,
              order: 2,
            },
            {
              key: "tipoDestino",
              label: "Tipo de destino",
              type: "text",
              required: true,
              order: 3,
            },
          ],
        },
      ],
      statusRules: [
        {
          priority: 0,
          conditions: [{ key: "tampaOk", operator: "false" }],
          resultStatus: "RETIDO",
        },
        {
          priority: 1,
          conditions: [{ key: "vedacaoOk", operator: "false" }],
          resultStatus: "RETIDO",
        },
        {
          priority: 2,
          conditions: [{ key: "lacresIntactos", operator: "false" }],
          resultStatus: "RETIDO",
        },
        {
          priority: 3,
          conditions: [
            {
              key: "tipoDestino",
              operator: "equals",
              value: "MANUTENCAO_EXTERNA",
            },
          ],
          resultStatus: "MANUTENCAO_EXTERNA",
        },
        {
          priority: 4,
          conditions: [],
          resultStatus: "EM_CICLO",
        },
      ],
    },
  });

  console.log("✅ Templates de checklist padrão criados");
  console.log("\n📋 Usuários padrão:");
  console.log("  admin@sge.com     — senha123 (ADMIN)");
  console.log("  analista@sge.com  — senha123 (ANALISTA)");
  console.log("  operador@sge.com  — senha123 (OPERADOR)");

  await pool.end();
  console.log("\n✨ Seed concluído!");
}

seed().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
