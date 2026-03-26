CREATE TYPE "public"."status_revisao_checklist" AS ENUM('RASCUNHO', 'PENDENTE_APROVACAO', 'APROVADO', 'REJEITADO', 'ARQUIVADO');--> statement-breakpoint
CREATE TYPE "public"."tipo_checklist" AS ENUM('RECEBIMENTO', 'EXPEDICAO');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checklist_template_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"revisao_id" uuid,
	"acao" text NOT NULL,
	"usuario_id" uuid NOT NULL,
	"usuario_nome" text NOT NULL,
	"usuario_email" text NOT NULL,
	"detalhes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checklist_template_revisoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"versao" integer NOT NULL,
	"status" "status_revisao_checklist" DEFAULT 'RASCUNHO' NOT NULL,
	"definicao" jsonb NOT NULL,
	"resumo_mudancas" text,
	"criado_por_id" uuid NOT NULL,
	"aprovado_por_id" uuid,
	"aprovado_em" timestamp,
	"rejeitado_em" timestamp,
	"motivo_rejeicao" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_template_revisoes_no_auto_aprovacao" CHECK ("checklist_template_revisoes"."aprovado_por_id" IS NULL OR "checklist_template_revisoes"."aprovado_por_id" <> "checklist_template_revisoes"."criado_por_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checklist_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"tipo_checklist" "tipo_checklist" NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_por_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
DO $$ BEGIN
 ALTER TABLE "checklist_template_eventos" ADD CONSTRAINT "checklist_template_eventos_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_template_eventos" ADD CONSTRAINT "checklist_template_eventos_revisao_id_checklist_template_revisoes_id_fk" FOREIGN KEY ("revisao_id") REFERENCES "public"."checklist_template_revisoes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_template_eventos" ADD CONSTRAINT "checklist_template_eventos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_template_revisoes" ADD CONSTRAINT "checklist_template_revisoes_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_template_revisoes" ADD CONSTRAINT "checklist_template_revisoes_criado_por_id_usuarios_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_template_revisoes" ADD CONSTRAINT "checklist_template_revisoes_aprovado_por_id_usuarios_id_fk" FOREIGN KEY ("aprovado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_criado_por_id_usuarios_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "checklist_template_revisoes_template_versao_unique" ON "checklist_template_revisoes" USING btree ("template_id","versao");--> statement-breakpoint