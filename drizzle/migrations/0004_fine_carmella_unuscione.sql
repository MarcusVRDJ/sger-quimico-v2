ALTER TABLE "checklists_expedicao" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "checklists_expedicao" ADD COLUMN "template_revisao_id" uuid;--> statement-breakpoint
ALTER TABLE "checklists_recebimento" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "checklists_recebimento" ADD COLUMN "template_revisao_id" uuid;