import { z } from "zod";

const fieldTypeSchema = z.enum([
  "boolean",
  "text",
  "number",
  "select",
  "date",
]);

const optionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

export const checklistFieldSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: fieldTypeSchema,
    required: z.boolean().default(false),
    helpText: z.string().optional(),
    placeholder: z.string().optional(),
    options: z.array(optionSchema).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  })
  .superRefine((field, ctx) => {
    if (field.type === "select" && (!field.options || field.options.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Campos do tipo select exigem pelo menos uma opcao",
        path: ["options"],
      });
    }
  });

export const checklistSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(checklistFieldSchema).min(1),
});

export const checklistTemplateDefinitionSchema = z.object({
  schemaVersion: z.number().int().positive().default(1),
  title: z.string().min(1),
  description: z.string().optional(),
  sections: z.array(checklistSectionSchema).min(1),
});

export type ChecklistTemplateDefinition = z.infer<
  typeof checklistTemplateDefinitionSchema
>;

export const createTemplateSchema = z.object({
  descricao: z.string().optional(),
  tipoChecklist: z.enum(["RECEBIMENTO", "EXPEDICAO"]),
  definicao: checklistTemplateDefinitionSchema,
  resumoMudancas: z.string().optional(),
});

export const createRevisionSchema = z.object({
  definicao: checklistTemplateDefinitionSchema,
  resumoMudancas: z.string().optional(),
});

export const rejectRevisionSchema = z.object({
  motivo: z.string().min(5),
});
