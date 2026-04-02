import type { StatusContentor } from "@/drizzle/schema";
import type { ChecklistTemplateDefinition } from "@/lib/checklist-template-definition";

export interface RespostasRecebimento {
  avarias: boolean;
  lacreRoto: boolean;
  testesVencidos: boolean;
  produtoAnterior: boolean;
  residuos: boolean;
  [key: string]: boolean | string | number;
}

/**
 * Avaliador determinístico de status por regras de template.
 * 
 * Lógica:
 * 1. Se template tem statusRules, avaliar regras em ordem de prioridade (crescente = menor número primeiro).
 * 2. Para cada regra, verificar se TODAS as condições combinam com respostas.
 * 3. Ao encontrar primeira regra compatível, retornar seu resultStatus.
 * 4. Se nenhuma regra combina, lançar erro (template inválido, deve ter fallback).
 * 
 * Validação de segurança:
 * - Chave em condição deve existir nas respostas.
 * - Operadores suportados: true, false, equals, notEquals.
 */
export function evaluateStatusFromTemplate(
  respostas: Record<string, any>,
  templateDefinition: ChecklistTemplateDefinition
): StatusContentor {
  // Se template não tem regras, retornar erro explícito (não deve chegar aqui se validação Zod passou)
  if (!templateDefinition.statusRules || templateDefinition.statusRules.length === 0) {
    throw new Error(
      "Template não contém statusRules. Use fallback legado ou configure regras no template."
    );
  }

  // Ordenar regras por prioridade (menor = mais alta)
  const sortedRules = [...templateDefinition.statusRules].sort(
    (a, b) => a.priority - b.priority
  );

  // Avaliar cada regra em ordem
  for (const rule of sortedRules) {
    const allConditionsMatch = rule.conditions.every((condition) => {
      const value = respostas[condition.key];
      
      if (value === undefined) {
        throw new Error(
          `Chave "${condition.key}" não encontrada nas respostas do checklist. ` +
          `Respostas disponíveis: ${Object.keys(respostas).join(", ")}`
        );
      }

      // Avaliar operador
      if (condition.operator === "true") {
        return Boolean(value) === true;
      }

      if (condition.operator === "false") {
        return Boolean(value) === false;
      }

      if (condition.operator === "equals") {
        return value === condition.value;
      }

      if (condition.operator === "notEquals") {
        return value !== condition.value;
      }

      throw new Error(`Operador inválido: ${condition.operator}`);
    });

    // Se todas as condições combinam, retornar status
    if (allConditionsMatch) {
      return rule.resultStatus as StatusContentor;
    }
  }

  // Se nenhuma regra combina, template é inválido (deve ter fallback)
  throw new Error(
    "Nenhuma regra de status correspondeu às respostas. " +
    "Template deve incluir uma regra padrão (fallback), por exemplo com conditions vazia."
  );
}

/**
 * Calcula o status resultante do contentor após o checklist de recebimento.
 *
 * Regras de prioridade (da mais restritiva para a menos):
 * 1. Avarias físicas ou lacre roto → REPROVADO_INTEGRIDADE
 * 2. Testes vencidos              → REPROVADO_VENCIDO
 * 3. Produto anterior ou resíduos → APROVADO_SUJO
 * 4. Nenhum problema              → APROVADO
 * 
 * @deprecated Use evaluateStatusFromTemplate com template.statusRules em rotas novas.
 */
export function calcularStatusRecebimento(
  respostas: RespostasRecebimento
): StatusContentor {
  if (respostas.avarias || respostas.lacreRoto) {
    return "REPROVADO_INTEGRIDADE";
  }

  if (respostas.testesVencidos) {
    return "REPROVADO_VENCIDO";
  }

  if (respostas.produtoAnterior || respostas.residuos) {
    return "APROVADO_SUJO";
  }

  return "APROVADO";
}
