CREATE TYPE "public"."perfil" AS ENUM('ADMIN', 'ANALISTA', 'OPERADOR');--> statement-breakpoint
CREATE TYPE "public"."prioridade_limpeza" AS ENUM('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');--> statement-breakpoint
CREATE TYPE "public"."status_contentor" AS ENUM('APROVADO', 'APROVADO_SUJO', 'REPROVADO_VENCIDO', 'REPROVADO_INTEGRIDADE', 'RESERVADO_PRODUCAO', 'RESERVADO_PRODUCAO_EM_LIMPEZA', 'EM_LIMPEZA', 'MANUTENCAO_INTERNA', 'RESERVADO_USO_INTERNO', 'DISPONIVEL', 'EM_CICLO', 'MANUTENCAO_EXTERNA', 'RETIDO');--> statement-breakpoint
CREATE TYPE "public"."status_limpeza" AS ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');--> statement-breakpoint
CREATE TYPE "public"."tipo_contentor" AS ENUM('OFFSHORE', 'ONSHORE_REFIL', 'ONSHORE_BASE');--> statement-breakpoint
CREATE TYPE "public"."tipo_origem_limpeza" AS ENUM('REQUISICAO_FORMAL', 'LIMPEZA_DIRETA');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checklists_expedicao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contentor_id" uuid NOT NULL,
	"operador_id" uuid NOT NULL,
	"operador_nome" text NOT NULL,
	"operador_email" text NOT NULL,
	"data_inspecao" timestamp DEFAULT now() NOT NULL,
	"tampa_ok" boolean NOT NULL,
	"vedacao_ok" boolean NOT NULL,
	"lacres_intactos" boolean NOT NULL,
	"nome_produto" text,
	"numero_lote" text,
	"data_fabricacao" timestamp,
	"data_validade" timestamp,
	"quantidade_kg" numeric(10, 2),
	"numero_nf_saida" text,
	"tipo_destino" text NOT NULL,
	"cliente_nome" text,
	"status_resultante" "status_contentor" NOT NULL,
	"observacoes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checklists_recebimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contentor_id" uuid NOT NULL,
	"operador_id" uuid NOT NULL,
	"operador_nome" text NOT NULL,
	"operador_email" text NOT NULL,
	"data_inspecao" timestamp DEFAULT now() NOT NULL,
	"tipo_contentor" "tipo_contentor" NOT NULL,
	"respostas" jsonb NOT NULL,
	"status_resultante" "status_contentor" NOT NULL,
	"observacoes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contentores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"numero_serie" text NOT NULL,
	"tara" numeric(10, 2),
	"data_validade" timestamp,
	"data_ultima_inspecao" timestamp,
	"status" "status_contentor" DEFAULT 'DISPONIVEL' NOT NULL,
	"tipo_contentor" "tipo_contentor" NOT NULL,
	"material" text,
	"capacidade_litros" integer,
	"fabricante" text,
	"precisa_limpeza" boolean DEFAULT false NOT NULL,
	"motivo_reprovacao" text,
	"em_ciclo_manutencao_externa" boolean DEFAULT false NOT NULL,
	"empresa_manutencao_externa" text,
	"observacoes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contentores_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notificacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text NOT NULL,
	"lida" boolean DEFAULT false NOT NULL,
	"contentor_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "requisicoes_limpeza" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contentor_id" uuid NOT NULL,
	"usuario_solicitante_id" uuid NOT NULL,
	"usuario_solicitante_nome" text NOT NULL,
	"usuario_solicitante_email" text NOT NULL,
	"usuario_executor_id" uuid,
	"usuario_executor_nome" text,
	"usuario_executor_email" text,
	"data_solicitacao" timestamp DEFAULT now() NOT NULL,
	"data_inicio" timestamp,
	"data_conclusao" timestamp,
	"status" "status_limpeza" DEFAULT 'PENDENTE' NOT NULL,
	"prioridade" "prioridade_limpeza" DEFAULT 'MEDIA' NOT NULL,
	"tipo_origem" "tipo_origem_limpeza" DEFAULT 'REQUISICAO_FORMAL' NOT NULL,
	"reservado_para_producao" boolean DEFAULT false NOT NULL,
	"observacoes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "status_historico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contentor_id" uuid NOT NULL,
	"status_anterior" "status_contentor",
	"status_novo" "status_contentor" NOT NULL,
	"usuario_nome" text NOT NULL,
	"usuario_email" text NOT NULL,
	"motivo" text,
	"origem" text,
	"data_mudanca" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"perfil" "perfil" DEFAULT 'OPERADOR' NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklists_expedicao" ADD CONSTRAINT "checklists_expedicao_contentor_id_contentores_id_fk" FOREIGN KEY ("contentor_id") REFERENCES "public"."contentores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklists_expedicao" ADD CONSTRAINT "checklists_expedicao_operador_id_usuarios_id_fk" FOREIGN KEY ("operador_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklists_recebimento" ADD CONSTRAINT "checklists_recebimento_contentor_id_contentores_id_fk" FOREIGN KEY ("contentor_id") REFERENCES "public"."contentores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklists_recebimento" ADD CONSTRAINT "checklists_recebimento_operador_id_usuarios_id_fk" FOREIGN KEY ("operador_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_user_id_usuarios_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_contentor_id_contentores_id_fk" FOREIGN KEY ("contentor_id") REFERENCES "public"."contentores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisicoes_limpeza" ADD CONSTRAINT "requisicoes_limpeza_contentor_id_contentores_id_fk" FOREIGN KEY ("contentor_id") REFERENCES "public"."contentores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisicoes_limpeza" ADD CONSTRAINT "requisicoes_limpeza_usuario_solicitante_id_usuarios_id_fk" FOREIGN KEY ("usuario_solicitante_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisicoes_limpeza" ADD CONSTRAINT "requisicoes_limpeza_usuario_executor_id_usuarios_id_fk" FOREIGN KEY ("usuario_executor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_usuarios_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "status_historico" ADD CONSTRAINT "status_historico_contentor_id_contentores_id_fk" FOREIGN KEY ("contentor_id") REFERENCES "public"."contentores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
