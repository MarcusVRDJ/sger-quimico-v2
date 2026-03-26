ALTER TABLE "usuarios"
ADD COLUMN "exige_troca_senha" boolean DEFAULT false NOT NULL,
ADD COLUMN "senha_temporaria_expira_em" timestamp,
ADD COLUMN "aprovado_por_id" uuid,
ADD COLUMN "aprovado_em" timestamp,
ADD COLUMN "motivo_reprovacao" text,
ADD COLUMN "reprovado_em" timestamp;

CREATE TABLE IF NOT EXISTS "tokens_recuperacao_senha" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "tokens_recuperacao_senha_token_hash_unique" UNIQUE("token_hash")
);

DO $$ BEGIN
 ALTER TABLE "tokens_recuperacao_senha" ADD CONSTRAINT "tokens_recuperacao_senha_user_id_usuarios_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "tokens_recuperacao_senha_user_expira_idx"
ON "tokens_recuperacao_senha" ("user_id", "expires_at");
