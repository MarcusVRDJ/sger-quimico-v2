import { z } from "zod";

const statusContentorValues = [
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
] as const;

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
    order: z.number().int().optional(),
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
  order: z.number().int().optional(),
});

// Status rules: avaliam respostas do checklist e retornam status fixo
const statusConditionSchema = z
  .object({
    key: z.string().min(1),
    operator: z.enum(["true", "false", "equals", "notEquals"]),
    value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  })
  .superRefine((condition, ctx) => {
    if (
      (condition.operator === "equals" || condition.operator === "notEquals") &&
      condition.value === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Operadores equals/notEquals exigem o campo value",
        path: ["value"],
      });
    }

    if (
      (condition.operator === "true" || condition.operator === "false") &&
      condition.value !== undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Operadores true/false não aceitam o campo value",
        path: ["value"],
      });
    }
  });

export const statusRuleSchema = z.object({
  priority: z.number().int().min(0),
  conditions: z.array(statusConditionSchema),
  resultStatus: z.enum(statusContentorValues),
});

export const checklistTemplateDefinitionSchema = z.object({
  schemaVersion: z.number().int().positive().default(1),
  title: z.string().min(1),
  description: z.string().optional(),
  sections: z.array(checklistSectionSchema).min(1),
  statusRules: z.array(statusRuleSchema).optional(),
}).superRefine((template, ctx) => {
  // Validação 1: Unicidade de chave entre todas as seções
  const allKeys = new Set<string>();
  const duplicateKeys: string[] = [];
  
  for (const section of template.sections) {
    for (const field of section.fields) {
      if (allKeys.has(field.key)) {
        duplicateKeys.push(field.key);
      } else {
        allKeys.add(field.key);
      }
    }
  }
  
  if (duplicateKeys.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Chaves duplicadas encontradas no template: ${duplicateKeys.join(", ")}. Cada campo deve ter uma chave única.`,
      path: ["sections"],
    });
  }

  // Validação 2: Se houver statusRules, validar referências e prioridades
  if (template.statusRules && template.statusRules.length > 0) {
    const priorities = new Set<number>();
    
    for (let ruleIdx = 0; ruleIdx < template.statusRules.length; ruleIdx++) {
      const rule = template.statusRules[ruleIdx];
      
      // Prioridades únicas
      if (priorities.has(rule.priority)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Prioridade ${rule.priority} duplicada em statusRules. Cada regra precisa de uma prioridade única.`,
          path: ["statusRules", ruleIdx, "priority"],
        });
      } else {
        priorities.add(rule.priority);
      }
      
      // Validar que todas as chaves em condições existem no template
      for (const condition of rule.conditions) {
        if (!allKeys.has(condition.key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Chave "${condition.key}" em statusRules não encontrada no template. Chaves disponíveis: ${Array.from(allKeys).join(", ")}`,
            path: ["statusRules", ruleIdx, "conditions"],
          });
        }
      }
    }
  }

  // Validação 3: Unicidade de order dentro de cada seção
  for (let sectionIdx = 0; sectionIdx < template.sections.length; sectionIdx++) {
    const section = template.sections[sectionIdx];
    const fieldOrders = new Set<number>();
    
    for (const field of section.fields) {
      if (field.order === undefined) {
        continue;
      }

      if (fieldOrders.has(field.order)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Ordem ${field.order} duplicada na seção "${section.title}". Cada campo precisa de uma ordem única.`,
          path: ["sections", sectionIdx, "fields"],
        });
      } else {
        fieldOrders.add(field.order);
      }
    }
  }
});

export type ChecklistTemplateDefinition = z.infer<
  typeof checklistTemplateDefinitionSchema
>;
export type StatusCondition = z.infer<typeof statusConditionSchema>;
export type StatusRule = z.infer<typeof statusRuleSchema>;

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
