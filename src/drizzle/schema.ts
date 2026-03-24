import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const perfilEnum = pgEnum("perfil", ["ADMIN", "ANALISTA", "OPERADOR"]);

export const statusContentorEnum = pgEnum("status_contentor", [
  "APROVADO",
  "APROVADO_SUJO",
  "REPROVADO_VENCIDO",
  "REPROVADO_INTEGRIDADE",
  "RESERVADO_PRODUCAO",
  "RESERVADO_PRODUCAO_EM_LIMPEZA",
  "EM_LIMPEZA",
  "MANUTENCAO_INTERNA",
  "RESERVADO_USO_INTERNO",
  "DISPONIVEL",
  "EM_CICLO",
  "MANUTENCAO_EXTERNA",
  "RETIDO",
]);

export const tipoContentorEnum = pgEnum("tipo_contentor", [
  "OFFSHORE",
  "ONSHORE_REFIL",
  "ONSHORE_BASE",
]);

export const statusLimpezaEnum = pgEnum("status_limpeza", [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "CANCELADA",
]);

export const prioridadeLimpezaEnum = pgEnum("prioridade_limpeza", [
  "BAIXA",
  "MEDIA",
  "ALTA",
  "URGENTE",
]);

export const tipoOrigemLimpezaEnum = pgEnum("tipo_origem_limpeza", [
  "REQUISICAO_FORMAL",
  "LIMPEZA_DIRETA",
]);

// ─── Tabelas ──────────────────────────────────────────────────────────────────

export const usuarios = pgTable("usuarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  perfil: perfilEnum("perfil").notNull().default("OPERADOR"),
  ativo: boolean("ativo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contentores = pgTable("contentores", {
  id: uuid("id").defaultRandom().primaryKey(),
  numeroSerie: text("numero_serie").notNull().unique(),
  tara: decimal("tara", { precision: 10, scale: 2 }),
  dataValidade: timestamp("data_validade"),
  dataUltimaInspecao: timestamp("data_ultima_inspecao"),
  status: statusContentorEnum("status").notNull().default("DISPONIVEL"),
  tipoContentor: tipoContentorEnum("tipo_contentor").notNull(),
  material: text("material"),
  capacidadeLitros: integer("capacidade_litros"),
  fabricante: text("fabricante"),
  precisaLimpeza: boolean("precisa_limpeza").notNull().default(false),
  motivoReprovacao: text("motivo_reprovacao"),
  emCicloManutencaoExterna: boolean("em_ciclo_manutencao_externa")
    .notNull()
    .default(false),
  empresaManutencaoExterna: text("empresa_manutencao_externa"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const checklistsRecebimento = pgTable("checklists_recebimento", {
  id: uuid("id").defaultRandom().primaryKey(),
  contentorId: uuid("contentor_id")
    .notNull()
    .references(() => contentores.id),
  operadorId: uuid("operador_id")
    .notNull()
    .references(() => usuarios.id),
  operadorNome: text("operador_nome").notNull(),
  operadorEmail: text("operador_email").notNull(),
  dataInspecao: timestamp("data_inspecao").notNull().defaultNow(),
  tipoContentor: tipoContentorEnum("tipo_contentor").notNull(),
  respostas: jsonb("respostas").notNull(),
  statusResultante: statusContentorEnum("status_resultante").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const checklistsExpedicao = pgTable("checklists_expedicao", {
  id: uuid("id").defaultRandom().primaryKey(),
  contentorId: uuid("contentor_id")
    .notNull()
    .references(() => contentores.id),
  operadorId: uuid("operador_id")
    .notNull()
    .references(() => usuarios.id),
  operadorNome: text("operador_nome").notNull(),
  operadorEmail: text("operador_email").notNull(),
  dataInspecao: timestamp("data_inspecao").notNull().defaultNow(),
  tampaOk: boolean("tampa_ok").notNull(),
  vedacaoOk: boolean("vedacao_ok").notNull(),
  lacresIntactos: boolean("lacres_intactos").notNull(),
  nomeProduto: text("nome_produto"),
  numeroLote: text("numero_lote"),
  dataFabricacao: timestamp("data_fabricacao"),
  dataValidade: timestamp("data_validade"),
  quantidadeKg: decimal("quantidade_kg", { precision: 10, scale: 2 }),
  numeroNfSaida: text("numero_nf_saida"),
  tipoDestino: text("tipo_destino").notNull(),
  clienteNome: text("cliente_nome"),
  statusResultante: statusContentorEnum("status_resultante").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const requisicoesLimpeza = pgTable("requisicoes_limpeza", {
  id: uuid("id").defaultRandom().primaryKey(),
  contentorId: uuid("contentor_id")
    .notNull()
    .references(() => contentores.id),
  usuarioSolicitanteId: uuid("usuario_solicitante_id")
    .notNull()
    .references(() => usuarios.id),
  usuarioSolicitanteNome: text("usuario_solicitante_nome").notNull(),
  usuarioSolicitanteEmail: text("usuario_solicitante_email").notNull(),
  usuarioExecutorId: uuid("usuario_executor_id").references(() => usuarios.id),
  usuarioExecutorNome: text("usuario_executor_nome"),
  usuarioExecutorEmail: text("usuario_executor_email"),
  dataSolicitacao: timestamp("data_solicitacao").notNull().defaultNow(),
  dataInicio: timestamp("data_inicio"),
  dataConclusao: timestamp("data_conclusao"),
  status: statusLimpezaEnum("status").notNull().default("PENDENTE"),
  prioridade: prioridadeLimpezaEnum("prioridade").notNull().default("MEDIA"),
  tipoOrigem: tipoOrigemLimpezaEnum("tipo_origem")
    .notNull()
    .default("REQUISICAO_FORMAL"),
  reservadoParaProducao: boolean("reservado_para_producao")
    .notNull()
    .default(false),
  observacoes: text("observacoes"),
});

export const statusHistorico = pgTable("status_historico", {
  id: uuid("id").defaultRandom().primaryKey(),
  contentorId: uuid("contentor_id")
    .notNull()
    .references(() => contentores.id),
  statusAnterior: statusContentorEnum("status_anterior"),
  statusNovo: statusContentorEnum("status_novo").notNull(),
  usuarioNome: text("usuario_nome").notNull(),
  usuarioEmail: text("usuario_email").notNull(),
  motivo: text("motivo"),
  origem: text("origem"),
  dataMudanca: timestamp("data_mudanca").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const notificacoes = pgTable("notificacoes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  lida: boolean("lida").notNull().default(false),
  contentorId: uuid("contentor_id").references(() => contentores.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type Usuario = typeof usuarios.$inferSelect;
export type NovoUsuario = typeof usuarios.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Contentor = typeof contentores.$inferSelect;
export type NovoContentor = typeof contentores.$inferInsert;
export type ChecklistRecebimento = typeof checklistsRecebimento.$inferSelect;
export type ChecklistExpedicao = typeof checklistsExpedicao.$inferSelect;
export type RequisicaoLimpeza = typeof requisicoesLimpeza.$inferSelect;
export type StatusHistoricoEntry = typeof statusHistorico.$inferSelect;
export type Notificacao = typeof notificacoes.$inferSelect;

export type StatusContentor = (typeof statusContentorEnum.enumValues)[number];
export type TipoContentor = (typeof tipoContentorEnum.enumValues)[number];
export type Perfil = (typeof perfilEnum.enumValues)[number];
export type StatusLimpeza = (typeof statusLimpezaEnum.enumValues)[number];
export type PrioridadeLimpeza =
  (typeof prioridadeLimpezaEnum.enumValues)[number];
