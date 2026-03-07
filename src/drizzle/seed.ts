import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed(): Promise<void> {
  console.log("🌱 Iniciando seed...");

  // Usuários
  const senhaHash = await bcrypt.hash("senha123", 10);

  const [admin] = await db
    .insert(schema.usuarios)
    .values({
      nome: "Admin SGE",
      email: "admin@sge.com",
      senhaHash,
      perfil: "ADMIN",
      ativo: true,
    })
    .onConflictDoNothing()
    .returning();

  const [analista] = await db
    .insert(schema.usuarios)
    .values({
      nome: "Ana Analista",
      email: "analista@sge.com",
      senhaHash,
      perfil: "ANALISTA",
      ativo: true,
    })
    .onConflictDoNothing()
    .returning();

  const [operador] = await db
    .insert(schema.usuarios)
    .values({
      nome: "João Operador",
      email: "operador@sge.com",
      senhaHash,
      perfil: "OPERADOR",
      ativo: true,
    })
    .onConflictDoNothing()
    .returning();

  console.log("✅ Usuários criados");

  // Contentores
  await db
    .insert(schema.contentores)
    .values([
      {
        codigo: "IBC-001",
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
        codigo: "IBC-002",
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
        codigo: "IBC-003",
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
        codigo: "IBC-004",
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
        codigo: "IBC-005",
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
