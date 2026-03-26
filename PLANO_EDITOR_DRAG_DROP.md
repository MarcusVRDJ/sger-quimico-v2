## Plan: Editor Drag-and-Drop com Regras de Status

Implementar um editor visual de checklist com reordenacao drag-and-drop para secoes/perguntas e secoes pre-definidas de status (regras fixas por ordem de prioridade), mantendo o fluxo existente de revisao e aprovacao. A abordagem prioriza seguranca: as regras de status continuam avaliadas no backend e o mobile apenas renderiza ordem/estrutura da revisao aprovada.

**Steps**
1. Fase 1 - Contrato de definicao (base para UI e backend)
2. Evoluir o schema em src/lib/checklist-template-definition.ts para incluir: `order` em secoes e campos, `statusSection` opcional por secao e `statusRules` fixas por prioridade top-down.
3. Definir contrato de regra fixa (sem linguagem livre): condicoes por chaves de campo + operador simples (igual, verdadeiro, falso) e `resultStatus` limitado ao conjunto aprovado (APROVADO, APROVADO_SUJO, REPROVADO_VENCIDO, REPROVADO_INTEGRIDADE).
4. Atualizar validacoes Zod para garantir: chaves unicas, ordem numerica valida, regras referenciando apenas campos existentes no template e ao menos uma regra default de fallback.
5. Fase 2 - Motor de status no backend (depende da Fase 1)
6. Adicionar em src/lib/checklist-logic.ts um avaliador deterministico `evaluateStatusFromTemplate` baseado em prioridade top-down.
7. Integrar o avaliador nas rotas src/app/api/checklists/recebimento/route.ts e src/app/api/checklists/expedicao/route.ts: usar regra do template quando presente e manter fallback para logica legado quando ausente.
8. Garantir que status invalido nunca saia do backend: whitelist dos quatro status definidos e retorno de erro 400 para regra malformada.
9. Fase 3 - Editor visual drag-and-drop (depende da Fase 1; pode ocorrer em paralelo com Fase 2)
10. Evoluir src/app/(desktop)/checklist-templates/page.tsx para incluir modo de ordenacao com drag-and-drop em secoes e campos.
11. Implementar secoes pre-definidas para status com presets de perguntas/regras (ex.: integridade, validade, limpeza) e botao para inserir preset no template atual.
12. Persistir sempre `order` explicito apos qualquer reordenacao para evitar ambiguidade por indice de array.
13. Incluir validacao visual no editor: regra quebrada, campo removido ainda referenciado, e preview do status resultante com respostas simuladas.
14. Fase 4 - Compatibilidade do renderer mobile (paralelo com Fase 3, bloqueia entrega final)
15. Atualizar src/app/(mobile)/mobile/recebimento/page.tsx para renderizar secoes/campos por `order` (fallback para indice quando ausente).
16. Atualizar src/app/(mobile)/mobile/expedicao/page.tsx para mesma regra de ordenacao.
17. Confirmar que a coleta de respostas continua por `key` (nao por posicao), preservando compatibilidade entre revisoes.
18. Fase 5 - Governanca e aprovacao (final)
19. Manter fluxo atual de revisao sequencial e aprovacao sem autoaprovacao nas rotas de templates; apenas incluir nos resumos de mudanca informacoes de reordenacao e alteracao de regras.
20. Adicionar comparativo focado em governanca: secoes/perguntas movidas e regras de status alteradas antes de submeter/aprovar.
21. Fase 6 - Verificacao e rollout
22. Rodar validacoes de tipo/build e testes manuais ponta a ponta: criar revisao, reordenar perguntas, adicionar secao de status, submeter, aprovar por outro admin, executar checklist mobile e validar status resultante esperado.
23. Validar cenarios de conflito: regras sem fallback, regra com chave inexistente, e duas regras verdadeiras (deve vencer a de maior prioridade/top-down).

**Relevant files**
- src/lib/checklist-template-definition.ts - expandir contrato/validacao de template para ordem e regras fixas de status.
- src/lib/checklist-logic.ts - avaliador deterministico de status por regras configuradas.
- src/app/api/checklists/recebimento/route.ts - usar avaliador por template com fallback legado.
- src/app/api/checklists/expedicao/route.ts - mesmo padrao do recebimento.
- src/app/(desktop)/checklist-templates/page.tsx - editor drag-and-drop, presets de status, preview e validacao.
- src/app/(mobile)/mobile/recebimento/page.tsx - ordenacao por `order` no renderer.
- src/app/(mobile)/mobile/expedicao/page.tsx - ordenacao por `order` no renderer.

**Verification**
1. Executar `npx tsc --noEmit` apos cada fase com mudanca de contrato.
2. Executar `npm run build` (ou build Docker) para validar bundling do editor e rotas.
3. Teste manual admin: drag-and-drop de 3+ perguntas, salvar revisao, reabrir e confirmar ordem persistida.
4. Teste manual status: simular respostas que acionem cada status permitido e confirmar resultado no backend.
5. Teste de aprovacao: impedir autoaprovacao e validar aprovacao por outro admin.
6. Teste mobile: garantir que a ordem exibida bate com a ordem configurada no editor e que o envio por chave permanece valido.

**Decisions**
- Confirmado: secoes pre-definidas com regras fixas de status (nao usar linguagem livre de condicao no V1).
- Confirmado: prioridade top-down quando mais de uma regra casar.
- Confirmado: tipos de campo V1 sao boolean, texto, numero, select e data.
- Confirmado: status permitidos no V1 sao APROVADO, APROVADO_SUJO, REPROVADO_VENCIDO e REPROVADO_INTEGRIDADE.
- Incluido: drag-and-drop para reordenacao e persistencia explicita de ordem.
- Excluido do V1: logica condicional arbitraria entre perguntas, campos de anexo/foto/assinatura e multi-nivel de aprovacao.

**Further Considerations**
1. Biblioteca de drag-and-drop recomendada: adotar `@dnd-kit` para suporte consistente em mouse/touch/teclado; alternativa sem dependencia e usar botoes mover acima/abaixo no V1 se quiser reduzir risco de UI.
2. Presets de status: comecar com 3 presets (integridade, validade, limpeza) e permitir composicao no mesmo template.
3. Diff de revisao: priorizar diff semantico (movido/adicionado/removido/regra alterada) para facilitar aprovacao administrativa.
