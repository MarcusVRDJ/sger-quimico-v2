import type { StatusContentor } from "@/drizzle/schema";

export interface RespostasRecebimento {
  avarias: boolean;
  lacreRoto: boolean;
  testesVencidos: boolean;
  produtoAnterior: boolean;
  residuos: boolean;
  [key: string]: boolean;
}

/**
 * Calcula o status resultante do contentor após o checklist de recebimento.
 *
 * Regras de prioridade (da mais restritiva para a menos):
 * 1. Avarias físicas ou lacre roto → REPROVADO_INTEGRIDADE
 * 2. Testes vencidos              → REPROVADO_VENCIDO
 * 3. Produto anterior ou resíduos → APROVADO_SUJO
 * 4. Nenhum problema              → APROVADO
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
