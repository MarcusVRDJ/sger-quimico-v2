# Análise detalhada: estado atual do checklist drag-and-drop

Data da análise: 02/04/2026
Projeto: sger-quimico-v2
Escopo analisado: contrato de template, motor de status no backend, rotas de checklist, editor desktop, renderer mobile e fluxo de governança de revisões.

## Resumo executivo

Estado geral: **implementação parcial**.

O projeto já possui uma base sólida de templates versionados com fluxo de revisão/aprovação e renderização dinâmica no mobile por `key`. Porém, os itens centrais do plano de drag-and-drop com regras fixas de status ainda não foram implementados.

Situação macro por fase:
- Fase 1 (contrato de definição): **Parcial**
- Fase 2 (motor de status no backend): **Não iniciado** (com lógica legado ativa)
- Fase 3 (editor visual drag-and-drop): **Parcial** (editor CRUD existe, sem DnD)
- Fase 4 (compatibilidade mobile por `order`): **Parcial**
- Fase 5 (governança/aprovação): **Parcial avançado**
- Fase 6 (verificação/rollout): **Não evidenciado no código**

## Matriz de aderência ao plano

| Fase | Objetivo do plano | Estado atual | Observação |
|---|---|---|---|
| 1 | Contrato com `order`, `statusSection`, `statusRules` fixas e validações fortes | Parcial | Contrato de template existe, mas sem campos/regras de status e sem validações de referência cruzada |
| 2 | Avaliador determinístico por template (`evaluateStatusFromTemplate`) integrado nas rotas | Não iniciado | Backend usa regras hardcoded (legado) |
| 3 | Editor com reordenação drag-and-drop, presets de status, validação visual e preview | Parcial | Editor visual existe, porém sem drag-and-drop e sem recursos de status do plano |
| 4 | Mobile renderizando por `order` com fallback e coleta por `key` | Parcial | Coleta por `key` existe; ordenação explícita por `order` não existe |
| 5 | Governança com revisão/aprovação e comparativo de mudanças | Parcial avançado | Workflow implementado e sem autoaprovação; diff semântico ainda não implementado |
| 6 | Verificação formal (type/build + cenários críticos) | Não evidenciado | Não há evidência de suíte/automação cobrindo os novos requisitos |

---

## Detalhamento por fase

## Fase 1 - Contrato de definição

### O que existe
- Schema de definição com seções e campos tipados (`boolean`, `text`, `number`, `select`, `date`).
- Validação Zod para:
  - campos `select` exigirem opções;
  - estrutura mínima (título, seções, campos).
- Schemas de criação de template/revisão/rejeição já presentes.

Arquivos-chave:
- `src/lib/checklist-template-definition.ts`

### Lacunas em relação ao plano
- Não existe `order` em seção nem em campo.
- Não existe `statusSection`.
- Não existe `statusRules` fixa por prioridade.
- Não existe contrato de operadores de condição (`equals`, `true`, `false`) para regras.
- Não existe validação de:
  - referência de regra para chave existente;
  - unicidade global de chave entre seções;
  - fallback obrigatório de regra;
  - integridade da prioridade top-down.

### Conclusão da fase
**Parcial**: fundação de schema existe, mas faltam exatamente os elementos centrais do plano para status por template e ordenação explícita.

---

## Fase 2 - Motor de status no backend

### O que existe
- Função legado de status para recebimento com prioridade hardcoded:
  - integridade -> vencido -> sujo -> aprovado.
- Rotas de recebimento e expedição já buscam template ativo aprovado.
- Rotas validam presença de chaves mínimas no template antes de aceitar checklist.

Arquivos-chave:
- `src/lib/checklist-logic.ts`
- `src/app/api/checklists/recebimento/route.ts`
- `src/app/api/checklists/expedicao/route.ts`
- `src/lib/checklist-templates.ts`

### Lacunas em relação ao plano
- Não existe `evaluateStatusFromTemplate`.
- Rotas não avaliam status via regras configuradas no template.
- Não há fallback "template -> legado" condicional por presença de `statusRules` (pois o recurso ainda não existe).
- Não há validação de "regra malformada" com erro 400 específico para motor de regras.
- A whitelist de status do V1 do plano (4 status) não está aplicada no avaliador porque ele não existe.

### Observação importante
- Em expedição, o status resultante atual continua por regra fixa local (`RETIDO`, `MANUTENCAO_EXTERNA`, `EM_CICLO`), o que diverge do escopo de status fixos do V1 definido no plano para o novo mecanismo.

### Conclusão da fase
**Não iniciada** para o objetivo do plano (engine por template). O comportamento atual permanece essencialmente legado.

---

## Fase 3 - Editor visual drag-and-drop

### O que existe
- Página de gestão de templates e revisões com:
  - listagem de templates;
  - abertura de revisões;
  - edição de título, descrição, seções e campos;
  - criação de revisão e opção de submeter.
- CRUD básico de seções/campos (adicionar/remover/editar propriedades).

Arquivo-chave:
- `src/app/(desktop)/checklist-templates/page.tsx`

### Lacunas em relação ao plano
- Não há drag-and-drop de seções.
- Não há drag-and-drop de campos.
- Não há botão de mover para cima/baixo como fallback manual.
- Não há persistência de `order` explícito após reordenação (campo inexistente no contrato).
- Não há seções predefinidas de status (presets integridade/validade/limpeza).
- Não há editor de `statusRules` por prioridade.
- Não há validação visual de regra quebrada/chave removida referenciada.
- Não há preview de status com simulação de respostas baseada em regras.
- Não foi identificada dependência de DnD instalada (`@dnd-kit` não aparece em `package.json`).

### Conclusão da fase
**Parcial**: existe editor visual funcional para estrutura, porém sem o núcleo de reordenação e sem o módulo de regras de status.

---

## Fase 4 - Compatibilidade do renderer mobile

### O que existe
- Mobile de recebimento e expedição carrega template ativo aprovado via API.
- Renderização dinâmica por seções/campos do template filtrando chaves reconhecidas.
- Coleta/submissão orientada a `key` (não por posição), preservando compatibilidade conceitual entre revisões.

Arquivos-chave:
- `src/app/(mobile)/mobile/recebimento/page.tsx`
- `src/app/(mobile)/mobile/expedicao/page.tsx`
- `src/app/api/checklist-templates/ativo/route.ts`

### Lacunas em relação ao plano
- Não há ordenação por `order` em seções/campos.
- Não há fallback explícito para índice quando `order` ausente (porque `order` não existe no contrato).

### Conclusão da fase
**Parcial**: compatibilidade por `key` já funciona; requisito de ordenação por `order` ainda não foi implementado.

---

## Fase 5 - Governança e aprovação

### O que existe
- Workflow de revisão implementado:
  - criação de revisão em rascunho;
  - submissão para aprovação;
  - aprovação;
  - rejeição com motivo.
- Proteção de autoaprovação implementada:
  - validação na rota de aprovação (criador não aprova própria revisão);
  - constraint no banco (`no_auto_aprovacao`).
- Versionamento sequencial por template (`template_id + versao` único).
- Registro de eventos por ação da revisão.

Arquivos-chave:
- `src/app/api/checklist-templates/[id]/revisoes/route.ts`
- `src/app/api/checklist-templates/revisoes/[id]/submeter/route.ts`
- `src/app/api/checklist-templates/revisoes/[id]/aprovar/route.ts`
- `src/app/api/checklist-templates/revisoes/[id]/rejeitar/route.ts`
- `src/drizzle/schema.ts`
- `drizzle/migrations/0005_schema_repair_checklist_templates.sql`

### Lacunas em relação ao plano
- `resumoMudancas` é texto livre; não há comparativo focado em:
  - perguntas/seções movidas;
  - regras de status alteradas.
- Não há diff semântico automatizado antes de submeter/aprovar.

### Conclusão da fase
**Parcial avançado**: governança base está pronta e robusta; falta o comparativo semântico específico do novo editor.

---

## Fase 6 - Verificação e rollout

### O que existe
- Scripts de build/lint/TS disponíveis em `package.json`.

### Lacunas observadas
- Não há evidência, no código analisado, de testes automatizados cobrindo:
  - regras de status por template;
  - conflitos de regras top-down;
  - ausência de fallback;
  - referência a chave inexistente.
- Não há artefatos de validação E2E relacionados ao plano (como testes dedicados para editor/revisão/mobile status).

### Conclusão da fase
**Não evidenciada** no estado atual do repositório.

---

## Pontos fortes já implementados

- Fluxo de governança de revisões está consistente (estado, auditoria e bloqueio de autoaprovação).
- Estrutura de template já é dinâmica o bastante para suportar evolução incremental.
- Mobile já desacoplou parcialmente layout de checklist do código fixo, consumindo template ativo.

## Gaps críticos para concluir o plano

1. Evoluir contrato do template para suportar `order`, `statusSection` e `statusRules` fixas.
2. Implementar motor determinístico de status por template no backend com fallback legado controlado.
3. Incluir editor de regras de status e presets de seção de status.
4. Implementar reordenação (DnD ou fallback por mover acima/abaixo) e persistência explícita de ordem.
5. Aplicar ordenação por `order` no mobile com fallback para índice.
6. Criar diff semântico para governança (movimentos e mudanças de regra).
7. Cobrir cenários críticos com testes (ou ao menos suíte mínima de validação backend).

## Risco atual se seguir para produção sem os gaps

- O usuário pode perceber editor visual evoluído, mas sem capacidade real de reordenação drag-and-drop.
- A lógica de status continuará distribuída e hardcoded, reduzindo governança e previsibilidade de mudanças.
- Mudanças de template não terão rastreabilidade semântica suficiente para aprovação consciente.

## Conclusão final

A implementação atual entrega uma **base operacional relevante** (templates revisáveis e renderização dinâmica), mas ainda **não atende o objetivo principal** do plano de "editor drag-and-drop com regras fixas de status por prioridade". O núcleo funcional planejado (contrato + engine + UX de ordenação + validações de regra) permanece pendente.
