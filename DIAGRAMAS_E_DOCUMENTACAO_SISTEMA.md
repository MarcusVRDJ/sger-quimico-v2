# Documentação de Diagramas — SGE Químico v2

**Data:** 02 de abril de 2026  
**Status:** Análise Detalhada + Especificação de Diagramas  
**Autor:** GitHub Copilot  

---

## 📋 Índice

1. [Análise Detalhada do Sistema Atual](#análise-detalhada-do-sistema-atual)
2. [Diagrama Entidade-Relacionamento (ER)](#diagrama-entidaderelacionamento-er)
3. [Diagramas de Caso de Uso](#diagramas-de-caso-de-uso)
4. [Diagramas de Sequência](#diagramas-de-sequência)
5. [Diagramas Adicionais Sugeridos](#diagramas-adicionais-sugeridos)
6. [Ferramentas Recomendadas](#ferramentas-recomendadas)
7. [Guia Prático: Como Criar Cada Diagrama](#guia-prático-como-criar-cada-diagrama)

---

## Análise Detalhada do Sistema Atual

### 🎯 Visão Geral

**SGE Químico v2** é um sistema de gerenciamento de ciclo de vida de contentores IBC (embalagens industriais de aço inoxidável) em ambiente químico.

- **Tipo de Sistema:** Aplicação Web Full-Stack (Next.js 15)
- **Ambiente:** Desktop + Mobile/Responsivo
- **Usuários:** 3 perfis (ADMIN, ANALISTA, OPERADOR)
- **Banco de Dados:** PostgreSQL com Drizzle ORM
- **Autenticação:** JWT (jose)

### 📊 Arquitetura Técnica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Next.js 15 App Router, React 19, TailwindCSS, shadcn/ui |
| **Backend** | Next.js API Routes, TypeScript, Zod (validação) |
| **Banco** | PostgreSQL 14+, Drizzle ORM |
| **Autenticação** | JWT (jose), bcryptjs, cookies seguras |
| **Deploy** | Docker Compose, Vercel / Railway |
| **Testes** | Vitest |

### 🔑 Principais Fluxos e Funcionalidades

#### 1. **Gestão de Contentores**
- Criar, atualizar, visualizar contentores IBC
- Rastrear status do contentor (DISPONÍVEL, EM_LIMPEZA, EM_CICLO, MANUTENCAO, etc.)
- Registrar histórico de mudanças de status
- Marcar contentores que precisam limpeza

#### 2. **Sistema de Checklists Dinâmicos**
- **Templates Versionados:** Checklists podem ter múltiplas versões com fluxo de revisão/aprovação
- **Tipos:** RECEBIMENTO (inspeção de entrada) e EXPEDICAO (inspeção de saída)
- **Lógica de Status:** Motor que avalia respostas e determina status do contentor
- **Coleta por Chave:** Campos dinâmicos com chaves únicas (ex: `avarias`, `lacreRoto`)
- **Governança:** Revisões submetidas por OPERADOR/ANALISTA, aprovadas por ADMIN
- **Sem Autoaprovação:** Constraint `noAutoAprovacao` garante que quem cria revisão não a aprova

#### 3. **Gestão de Limpeza**
- Requisições de limpeza com prioridade (BAIXA, MEDIA, ALTA, URGENTE)
- Rastreamento do status (PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA)
- Alocação de operador executor
- Origem da requisição (REQUISICAO_FORMAL, LIMPEZA_DIRETA)
- Reserva para produção

#### 4. **Sistema de Usuários e Permissões**
- 3 perfis: **ADMIN**, **ANALISTA**, **OPERADOR**
- Fluxo de aprovação de novos usuários
- Recuperação de senha com tokens temporários
- Sessões com expiração

#### 5. **Notificações e Histórico**
- Notificações por conteúdo e ações
- Histórico de eventos de templates (criação, edição, aprovação)
- Histórico de mudanças de status com rastreamento de usuário

### 🔄 Estado Atual: Implementação Parcial

| Funcionalidade | Status | Observação |
|----------------|--------|-----------|
| **CRUD Contentores** | ✅ Completo | Totalmente funcional |
| **Autenticação** | ✅ Completo | JWT, sessions, recuperação de senha |
| **Checklists Básicos** | ✅ Completo | Recebimento e expedição funcionando |
| **Templates Versionados** | ✅ Completo | Com revisão/aprovação, sem autoaprovação |
| **Motor de Status por Template** | 🟡 Parcial | Função `evaluateStatusFromTemplate` existe, mas rotas ainda usam lógica legada |
| **Drag-and-Drop Editor** | 🟡 Parcial | Editor CRUD existe, sem DnD visual |
| **Ordenação Explícita** | ❌ Não iniciado | Campo `order` ainda não adicionado a seções/campos |
| **Regras de Status Configuráveis** | 🟡 Parcial | Schema pronto, ainda não integrado nas rotas principais |
| **Gestão de Limpeza** | ✅ Completo | Requisições, prioridades, histórico |
| **Mobile Responsivo** | ✅ Completo | Renderização por chave, coleta de dados |

### 📦 Entidades Principais

#### **Usuários**
- `uuid` id
- `string` nome, email (único)
- `string` senhaHash
- `enum` perfil (ADMIN, ANALISTA, OPERADOR)
- `boolean` ativo (requer aprovação)
- Campos de aprovação/rejeição
- Tokens temporários para reset de senha

#### **Contentores**
- `uuid` id
- `string` numeroSerie (único, QR code)
- `enum` status (13 estados possíveis)
- `enum` tipoContentor (OFFSHORE, ONSHORE_REFIL, ONSHORE_BASE)
- Dados técnicos: tara, validade, última inspeção
- `boolean` precisaLimpeza
- Campos de manutenção externa

#### **Checklists Recebimento/Expedicao**
- Vínculo a contentor
- Vínculo a template e revisão específica
- Resposta dinâmica em JSONB
- Status resultante determinado por motor
- Dados do operador (nome, email, ID)
- Timestamps de inspeção

#### **Templates de Checklist**
- Versionamento obrigatório
- Múltiplas revisões com fluxo de aprovação
- Schema JSONB da definição (seções, campos)
- Tipo de checklist (RECEBIMENTO ou EXPEDICAO)
- Rastreamento de criador e aprovador

#### **Requisições de Limpeza**
- Vínculo a contentor
- Usuário solicitante e executor
- Status progression: PENDENTE → EM_ANDAMENTO → CONCLUIDA
- Prioridade matizada (BAIXA, MEDIA, ALTA, URGENTE)
- Timestamps: solicitação, início, conclusão

#### **Histórico**
- Status Histórico: rastreia TODAS as mudanças de status
- Eventos de Template: auditoria de criação/edição/aprovação
- Notificações: feed de alertas por usuário

### ⚡ Fluxos Críticos

#### **1. Fluxo de Recebimento de Contentor**
```
Contentor chega → Operador escaneia QR → 
Abre template de RECEBIMENTO → 
Preenche checklist (dinâmico) →
Motor avalia status via statusRules →
Contentor marcado com novo status →
Mensagem é notificada → Histórico registrado
```

#### **2. Fluxo de Expedição**
```
Operador solicita expedição →
Escaneia QR → Abre template EXPEDICAO →
Preenche dados de produto + destino →
Motor calcula status final →
Se OK, contentor marcado DISPONIVEL/CICLO →
Notificação e histórico
```

#### **3. Fluxo de Limpeza**
```
Requisição criada (PENDENTE) →
Admin aloca operador executor →
Executor marca EM_ANDAMENTO + data início →
Executor marca CONCLUIDA + observações →
Contentor volta a DISPONIVEL →
Histórico registrado
```

#### **4. Fluxo de Governança de Template**
```
Analista cria template novo →
Editor CRUD: seções + campos →
Salva como RASCUNHO →
(Futuro: Drag-drop para reordenação) →
Submete para aprovação (PENDENTE_APROVACAO) →
Admin revisa mudanças + aprova/rejeita (APROVADO ou REJEITADO) →
Se aprovado, passa a ser template ativo →
Próximas coletas usam versão aprovada
```

#### **5. Fluxo de Autenticação**
```
Novo usuário solicita acesso →
Usuário criado em INATIVO (requer aprovação) →
Email com senha temporária (expiração 24h) →
Admin aprova/rejeita no dashboard →
Se aprovado, usuário pode fazer login →
Força troca de senha na primeira entrada
```

---

## Diagrama Entidade-Relacionamento (ER)

### 📌 Cardinalidade e Relacionamentos

```mermaid
erDiagram
    USUARIOS {
        uuid id PK
        string nome
        string email UK
        string senhaHash
        enum perfil
        boolean ativo
        uuid aprovadoPorId FK
        timestamp aprovadoEm
        timestamp createdAt
    }
    
    SESSIONS {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        timestamp expiresAt
    }
    
    TOKENS_RECUPERACAO_SENHA {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        timestamp expiresAt
        timestamp usedAt
    }
    
    CONTENTORES {
        uuid id PK
        string numeroSerie UK
        enum status
        enum tipoContentor
        decimal tara
        timestamp dataValidade
        timestamp dataUltimaInspecao
        boolean precisaLimpeza
        string motivoReprovacao
        boolean emCicloManutencaoExterna
        string empresaManutencaoExterna
        string observacoes
        timestamp createdAt
        timestamp updatedAt
    }
    
    CHECKLISTS_RECEBIMENTO {
        uuid id PK
        uuid contentorId FK
        uuid templateId FK
        uuid templateRevisaoId FK
        uuid operadorId FK
        string operadorNome
        string operadorEmail
        timestamp dataInspecao
        enum tipoContentor
        jsonb respostas
        enum statusResultante
        string observacoes
    }
    
    CHECKLISTS_EXPEDICAO {
        uuid id PK
        uuid contentorId FK
        uuid templateId FK
        uuid templateRevisaoId FK
        uuid operadorId FK
        string operadorNome
        string operadorEmail
        timestamp dataInspecao
        boolean tampaOk
        boolean vedacaoOk
        boolean lacresIntactos
        string nomeProduto
        string numeroLote
        timestamp dataFabricacao
        timestamp dataValidade
        decimal quantidadeKg
        string numeroNfSaida
        string tipoDestino
        string clienteNome
        enum statusResultante
        string observacoes
    }
    
    CHECKLIST_TEMPLATES {
        uuid id PK
        string nome
        string descricao
        enum tipoChecklist
        boolean ativo
        uuid criadoPorId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    CHECKLIST_TEMPLATE_REVISOES {
        uuid id PK
        uuid templateId FK
        integer versao UK
        enum status
        jsonb definicao
        string resumoMudancas
        uuid criadoPorId FK
        uuid aprovadoPorId FK
        timestamp aprovadoEm
        timestamp rejeitadoEm
        string motivoRejeicao
        timestamp createdAt
        timestamp updatedAt
    }
    
    CHECKLIST_TEMPLATE_EVENTOS {
        uuid id PK
        uuid templateId FK
        uuid revisaoId FK
        string acao
        uuid usuarioId FK
        string usuarioNome
        string usuarioEmail
        jsonb detalhes
        timestamp createdAt
    }
    
    REQUISICOES_LIMPEZA {
        uuid id PK
        uuid contentorId FK
        uuid usuarioSolicitanteId FK
        string usuarioSolicitanteNome
        string usuarioSolicitanteEmail
        uuid usuarioExecutorId FK
        string usuarioExecutorNome
        string usuarioExecutorEmail
        timestamp dataSolicitacao
        timestamp dataInicio
        timestamp dataConclusao
        enum status
        enum prioridade
        enum tipoOrigem
        boolean reservadoParaProducao
        string observacoes
    }
    
    STATUS_HISTORICO {
        uuid id PK
        uuid contentorId FK
        enum statusAnterior
        enum statusNovo
        string usuarioNome
        string usuarioEmail
        string motivo
        string origem
        timestamp dataMudanca
        jsonb metadata
    }
    
    NOTIFICACOES {
        uuid id PK
        uuid userId FK
        string tipo
        string titulo
        string descricao
        boolean lida
        uuid contentorId FK
        timestamp createdAt
    }
    
    %% Relacionamentos
    USUARIOS ||--o{ SESSIONS : "cria"
    USUARIOS ||--o{ TOKENS_RECUPERACAO_SENHA : "requer"
    USUARIOS ||--o{ CHECKLIST_TEMPLATES : "cria"
    USUARIOS ||--o{ CHECKLIST_TEMPLATE_REVISOES : "cria/aprova"
    USUARIOS ||--o{ CHECKLIST_TEMPLATE_EVENTOS : "registra"
    USUARIOS ||--o{ CHECKLISTS_RECEBIMENTO : "executa"
    USUARIOS ||--o{ CHECKLISTS_EXPEDICAO : "executa"
    USUARIOS ||--o{ REQUISICOES_LIMPEZA : "solicita/executa"
    USUARIOS ||--o{ NOTIFICACOES : "recebe"
    
    CONTENTORES ||--o{ CHECKLISTS_RECEBIMENTO : "inspecionado em"
    CONTENTORES ||--o{ CHECKLISTS_EXPEDICAO : "inspecionado em"
    CONTENTORES ||--o{ REQUISICOES_LIMPEZA : "requisitado para"
    CONTENTORES ||--o{ STATUS_HISTORICO : "tem histórico"
    CONTENTORES ||--o{ NOTIFICACOES : "relacionado"
    
    CHECKLIST_TEMPLATES ||--o{ CHECKLIST_TEMPLATE_REVISOES : "versionado em"
    CHECKLIST_TEMPLATES ||--o{ CHECKLISTS_RECEBIMENTO : "usado em"
    CHECKLIST_TEMPLATES ||--o{ CHECKLISTS_EXPEDICAO : "usado em"
    CHECKLIST_TEMPLATES ||--o{ CHECKLIST_TEMPLATE_EVENTOS : "gerou evento"
    
    CHECKLIST_TEMPLATE_REVISOES ||--o{ CHECKLISTS_RECEBIMENTO : "preenchido com"
    CHECKLIST_TEMPLATE_REVISOES ||--o{ CHECKLISTS_EXPEDICAO : "preenchido com"
```

### 🔍 Especificação de Relacionamentos

| Relacionamento | Cardinalidade | Descrição |
|---|---|---|
| Usuário → Sessões | 1:N | Um usuário pode ter múltiplas sessões ativas |
| Usuário → Templates | 1:N | Um usuário cria múltiplos templates |
| Usuário → Revisões | 1:N | Usuário cria e aprova revisões |
| Usuário → Checklists | 1:N | Operador executa múltiplos checklists |
| Usuário → Requisições | 1:N | Solicitante e executor alocado |
| Template → Revisões | 1:N | Template tem múltiplas versões versionadas |
| Contentor → Checklists | 1:N | Contentor inspecionado várias vezes |
| Contentor → Limpezas | 1:N | Contentor requer múltiplas limpezas |
| Contentor → Histórico | 1:N | Histórico completo de status |
| Revisão → Checklists | 1:N | Uma revisão usada para múltiplas inspeções |

### 🔑 Constraints Notáveis

```sql
-- Sem autoaprovação de templates
ALTER TABLE checklist_template_revisoes
ADD CONSTRAINT noAutoAprovacao 
CHECK (aprovadoPorId IS NULL OR aprovadoPorId <> criadoPorId);

-- Unicidade de revisão por template + versão
CREATE UNIQUE INDEX checklist_template_revisoes_template_versao_unique
ON checklist_template_revisoes(templateId, versao);

-- Email único de usuários
ALTER TABLE usuarios ADD CONSTRAINT email_unique UNIQUE(email);

-- Série única de contentores
ALTER TABLE contentores ADD CONSTRAINT numero_serie_unique UNIQUE(numeroSerie);
```

---

## Diagramas de Caso de Uso

### 📌 Contexto Geral

```mermaid
graph LR
    A["👤 OPERADOR<br/>(Campo)"]
    B["👨‍💼 ANALISTA<br/>(Gestão)"]
    C["👨‍💻 ADMIN<br/>(Sistema)"]
    
    SYS["🏭 SGE Químico v2"]
    
    A <--> SYS
    B <--> SYS
    C <--> SYS
    
    SISTEMA["Externos"]
    QR["QR Code"]
    EMAIL["Email"]
    
    SYS -.-> QR
    SYS -.-> EMAIL
    SISTEMA -.-> QR
    SISTEMA -.-> EMAIL
```

### 1️⃣ **Caso de Uso: Gestão de Contentores**

```mermaid
usecase diagram
    title Gerenciamento de Contentores
    
    system "SGE Químico - Contentores"
    
    actor OPERADOR
    actor ANALISTA
    actor ADMIN
    
    OPERADOR --> (LC1: Registrar Contentor Novo)
    OPERADOR --> (LC2: Consultar Status Contentor)
    OPERADOR --> (LC3: Marcar Contentor Necessita Limpeza)
    
    ANALISTA --> (LC2: Consultar Status Contentor)
    ANALISTA --> (LC4: Visualizar Relatório Contentores)
    ANALISTA --> (LC5: Atualizar Dados Técnicos)
    
    ADMIN --> (LC4: Visualizar Relatório Contentores)
    ADMIN --> (LC5: Atualizar Dados Técnicos)
    ADMIN --> (LC6: Deletar/Arquivar Contentor)
    
    (LC1: Registrar Contentor Novo) -.-> (Validar Série Única)
    (LC2: Consultar Status Contentor) -.-> (Consultar Histórico)
    (LC4: Visualizar Relatório Contentores) -.-> (Filtrar por Status)
    (LC5: Atualizar Dados Técnicos) -.-> (Registrar em Histórico)
```

### 2️⃣ **Caso de Uso: Checklists e Inspeção**

```mermaid
usecase diagram
    title Checklists - Recebimento e Expedição
    
    system "SGE Químico - Checklists"
    
    actor OPERADOR
    actor ANALISTA
    actor ADMIN
    
    OPERADOR --> (CK1: Escanear QR Contentor)
    OPERADOR --> (CK2: Preencher Checklist Recebimento)
    OPERADOR --> (CK3: Preencher Checklist Expedição)
    OPERADOR --> (CK4: Visualizar Template)
    
    ANALISTA --> (CK5: Criar Template Checklist)
    ANALISTA --> (CK6: Editar Template (Seções/Campos))
    ANALISTA --> (CK7: Submeter Template para Aprovação)
    ANALISTA --> (CK4: Visualizar Template)
    
    ADMIN --> (CK8: Revisar e Aprovar Template)
    ADMIN --> (CK9: Rechazar Template com Justificativa)
    ADMIN --> (CK10: Ativar/Desativar Template)
    
    (CK1: Escanear QR Contentor) -.-> (Decodificar Série)
    (CK2: Preencher Checklist Recebimento) -.-> (Motor Avalia Status)
    (CK3: Preencher Checklist Expedição) -.-> (Motor Avalia Status)
    (CK6: Editar Template) -.-> (Salvar como RASCUNHO)
    (CK7: Submeter Template) -.-> (PENDENTE_APROVACAO)
    (CK8: Revisar Template) -.-> (Comparar Versões)
```

### 3️⃣ **Caso de Uso: Requisições de Limpeza**

```mermaid
usecase diagram
    title Gestão de Limpeza
    
    system "SGE Químico - Limpeza"
    
    actor OPERADOR
    actor ANALISTA
    actor ADMIN
    
    OPERADOR --> (LMP1: Marcar Contentor para Limpeza)
    OPERADOR --> (LMP2: Iniciar Limpeza)
    OPERADOR --> (LMP3: Finalizar Limpeza)
    OPERADOR --> (LMP4: Consultar Requisições Atribuídas)
    
    ANALISTA --> (LMP5: Criar Requisição Formal)
    ANALISTA --> (LMP6: Visualizar Todas Requisições)
    ANALISTA --> (LMP7: Alocação Operador Executor)
    
    ADMIN --> (LMP6: Visualizar Todas Requisições)
    ADMIN --> (LMP7: Alocação Operador Executor)
    ADMIN --> (LMP8: Definir Prioridades)
    
    (LMP1: Marcar Contentor) -.-> (Cria Requisição)
    (LMP2: Iniciar Limpeza) -.-> (Atualiza Status EM_ANDAMENTO)
    (LMP3: Finalizar) -.-> (Status CONCLUIDA + Histórico)
    (LMP7: Alocação) -.-> (Notifica Operador)
    (LMP8: Prioridades) -.-> (BAIXA, MÉDIA, ALTA, URGENTE)
```

### 4️⃣ **Caso de Uso: Autenticação e Usuários**

```mermaid
usecase diagram
    title Sistema de Autenticação e Permissões
    
    system "SGE Químico - Autenticação"
    
    actor "Novo Usuário"
    actor ADMIN
    actor "Usuário Autenticado"
    
    "Novo Usuário" --> (USR1: Solicitar Acesso)
    ADMIN --> (USR2: Revisar Solicitação)
    ADMIN --> (USR3: Aprovar/Rejeitar Usuário)
    ADMIN --> (USR4: Gerenciar Perfis)
    
    "Usuário Autenticado" --> (USR5: Fazer Login)
    "Usuário Autenticado" --> (USR6: Trocar Senha)
    "Usuário Autenticado" --> (USR7: Recuperar Senha)
    "Usuário Autenticado" --> (USR8: Fazer Logout)
    
    (USR1: Solicitar Acesso) -.-> (Email + Status INATIVO)
    (USR3: Aprovar) -.-> (Senha Temporária Enviada)
    (USR5: Login) -.-> (Valida JWT)
    (USR6: Trocar Senha) -.-> (Hash bcrypt)
    (USR7: Recuperar) -.-> (Token Temporário)
```

---

## Diagramas de Sequência

### 1️⃣ **Fluxo: Inspeção de Recebimento**

```mermaid
sequenceDiagram
    participant Operador as 👤 Operador
    participant Mobile as 📱 Mobile App
    participant Backend as ⚙️ Backend API
    participant DB as 🗄️ PostgreSQL
    participant Histórico as 📋 Histórico
    
    Operador->>Mobile: Escaneia QR do Contentor
    Mobile->>Backend: GET /api/contentores/{serie}
    Backend->>DB: SELECT contentor WHERE numeroSerie = ?
    DB-->>Backend: Contentor encontrado
    
    Mobile->>Backend: GET /api/checklist-templates/ativo?tipo=RECEBIMENTO
    Backend->>DB: SELECT template WHERE ativo=true AND tipo='RECEBIMENTO'
    DB-->>Backend: Template + Última Revisão Aprovada
    Mobile-->>Operador: Exibe Formulário Dinâmico
    
    Operador->>Mobile: Preenche Respostas Checklist
    Mobile->>Backend: POST /api/checklists/recebimento
    Backend->>Backend: evaluateStatusFromTemplate(respostas, template)
    Backend->>Backend: statusResultante = REPROVADO_INTEGRIDADE | APROVADO_SUJO | APROVADO?
    
    Backend->>DB: INSERT INTO checklists_recebimento (...)
    Backend->>DB: UPDATE contentores SET status = statusResultante
    Backend->>Histórico: INSERT INTO status_historico (...)
    
    Backend->>DB: INSERT INTO notificacoes (...)
    Backend-->>Mobile: 200 OK + {statusResultante, mensagem}
    Mobile-->>Operador: ✅ Checklist Registrado. Status: APROVADO
```

### 2️⃣ **Fluxo: Criação e Aprovação de Template**

```mermaid
sequenceDiagram
    participant Analista as 👨‍💼 Analista
    participant Desktop as 🖥️ Desktop App
    participant Backend as ⚙️ Backend
    participant DB as 🗄️ PostgreSQL
    participant Admin as 👨‍💻 Admin
    
    Analista->>Desktop: Clica "Novo Template"
    Analista->>Desktop: Define Nome, Tipo (RECEBIMENTO/EXPEDICAO)
    Analista->>Desktop: Adiciona Seções, Campos
    Note over Desktop: Future: Drag-and-Drop Reorder
    
    Analista->>Desktop: Salva Template
    Desktop->>Backend: POST /api/checklist-templates
    Backend->>DB: INSERT INTO checklist_templates (...)
    Backend->>DB: INSERT INTO checklist_template_revisoes (versao=1, status='RASCUNHO')
    DB-->>Backend: revisaoId, versao=1
    Backend-->>Desktop: 201 Created
    
    Analista->>Desktop: Edita Seções/Campos
    Desktop->>Backend: PATCH /api/checklist-templates/{templateId}/revisao
    Backend->>DB: UPDATE checklist_template_revisoes SET definicao = {...}
    Backend->>DB: INSERT INTO checklist_template_eventos (acao='EDITADO')
    
    Analista->>Desktop: Clica "Submeter para Aprovação"
    Desktop->>Backend: POST /api/checklist-templates/{templateId}/submeter-aprovacao
    Backend->>DB: UPDATE checklist_template_revisoes SET status = 'PENDENTE_APROVACAO'
    Backend->>DB: INSERT INTO notificacoes (userId=ADMIN, ...)
    Backend-->>Desktop: 200 OK
    
    Admin->>Desktop: Vê notificação de novo template
    Admin->>Desktop: Abre template para revisão
    Desktop->>Backend: GET /api/checklist-templates/{templateId}/revisoes/{revisaoId}
    Backend->>DB: SELECT * FROM checklist_template_revisoes WHERE ...
    DB-->>Backend: Definição + Histórico de mudanças
    Backend-->>Desktop: {titulo, seções, campos, mudanças}
    
    Admin->>Desktop: Aprovação após análise
    Desktop->>Backend: POST /api/checklist-templates/{templateId}/aprovar
    Backend->>DB: UPDATE checklist_template_revisoes SET status='APROVADO', aprovadoPorId=ADMIN_ID
    Backend->>Db: UPDATE checklist_templates SET ativo = true
    Backend->>DB: INSERT INTO notificacoes (userId=Analista, ...)
    Backend-->>Desktop: 200 OK
    Desktop-->>Admin: ✅ Template aprovado e agora ativo
    
    Note over Db: Próximas coletas usarão este template
```

### 3️⃣ **Fluxo: Requisição e Execução de Limpeza**

```mermaid
sequenceDiagram
    participant Operador as 👤 Operador
    participant Analista as 👨‍💼 Analista
    participant Desktop as 🖥️ Desktop
    participant Backend as ⚙️ Backend
    participant DB as 🗄️ PostgreSQL
    
    Operador->>Desktop: Marca Contentor "Precisa Limpeza"
    Desktop->>Backend: POST /api/requisicoes-limpeza
    Backend->>DB: INSERT requisicoes_limpeza (status='PENDENTE', prioridade=?)
    Backend->>DB: UPDATE contentores SET precisaLimpeza = true
    Backend->>DB: INSERT notificacoes (tipo='LIMPEZA_NOVA')
    Backend-->>Desktop: 201 Created + requisicaoId
    
    Note over Analista: Analista revisa requisições pendentes
    Analista->>Desktop: Visualiza dashboard de limpeza
    Desktop->>Backend: GET /api/requisicoes-limpeza?status=PENDENTE
    Backend->>DB: SELECT * FROM requisicoes_limpeza WHERE status='PENDENTE'
    DB-->>Backend: Lista de requisições
    
    Analista->>Desktop: Aloca Operador Executor + Define Prioridade
    Desktop->>Backend: PATCH /api/requisicoes-limpeza/{requisicaoId}
    Backend->>DB: UPDATE requisicoes_limpeza SET usuarioExecutorId=?, prioridade=?
    Backend->>DB: INSERT notificacoes (userId=Executor, tipo='LIMPEZA_ATRIBUIDA')
    Backend-->>Desktop: 200 OK
    
    Operador->>Desktop: Inicia Limpeza (scanneia QR ou clica requisição)
    Desktop->>Backend: PATCH /api/requisicoes-limpeza/{requisicaoId}/iniciar
    Backend->>DB: UPDATE requisicoes_limpeza SET status='EM_ANDAMENTO', dataInicio=NOW()
    Backend->>DB: UPDATE contentores SET status='EM_LIMPEZA'
    Backend->>DB: INSERT status_historico (...)
    
    Operador->>Desktop: Finaliza Limpeza + Observações
    Desktop->>Backend: PATCH /api/requisicoes-limpeza/{requisicaoId}/concluir
    Backend->>DB: UPDATE requisicoes_limpeza SET status='CONCLUIDA', dataConclusao=NOW()
    Backend->>DB: UPDATE contentores SET status='DISPONIVEL', precisaLimpeza=false
    Backend->>DB: INSERT status_historico (origem='LIMPEZA_CONCLUIDA')
    Backend->>DB: INSERT notificacoes (tipo='LIMPEZA_CONCLUIDA')
    Backend-->>Desktop: 200 OK
    Desktop-->>Operador: ✅ Limpeza registrada
```

### 4️⃣ **Fluxo: Autenticação e Ciclo de Permissões**

```mermaid
sequenceDiagram
    participant "Novo Usuário" as Usuário
    participant "Login Page" as Frontend
    participant "Backend API" as Backend
    participant "PostgreSQL" as DB
    participant Admin as 👨‍💻 Admin
    
    Usuário->>Frontend: Solicita Acesso
    Frontend->>Backend: POST /api/auth/solicitar-acesso
    Backend->>Backend: Gera senha temporária aleatória
    Backend->>DB: INSERT usuarios (email, senhaHash, ativo=false, status='AGUARDANDO_APROVACAO')
    Backend->>Backend: Envia email com senha temporária (válida 24h)
    Backend->>DB: INSERT notificacoes (tipo='NOVO_USUARIO', userId=ADMIN)
    Backend-->>Frontend: 201 Created + Email enviado
    
    Admin->>Frontend: Vê notificação de novo usuário
    Admin->>Frontend: Abre dashboard de usuários
    Frontend->>Backend: GET /api/usuarios?status=AGUARDANDO_APROVACAO
    Backend->>DB: SELECT usuarios WHERE ativo=false
    DB-->>Backend: Lista de usuários pendentes
    Backend-->>Frontend: [{email, solicicitacao, data}]
    
    Admin->>Frontend: Aprova Usuário
    Frontend->>Backend: POST /api/usuarios/{userId}/aprovar
    Backend->>Backend: Valida ADMIN perfil
    Backend->>DB: UPDATE usuarios SET ativo=true, aprovadoPorId=ADMIN_ID, aprovadoEm=NOW()
    Backend->>DB: INSERT notificacoes (userId={userId}, tipo='USUARIO_APROVADO')
    Backend-->>Frontend: 200 OK
    
    Usuário->>Frontend: Login com email + senha temporária
    Frontend->>Backend: POST /api/auth/login
    Backend->>DB: SELECT usuarios WHERE email=?, ativo=true
    Backend->>Backend: bcryptjs.compare(senha, senhaHash)
    Backend->>Backend: Valida senha temporária não vencida
    Backend->>Backend: Gera JWT token
    Backend->>DB: INSERT sessions (tokenHash, expiresAt)
    Backend->>DB: UPDATE usuarios SET exigeTrocaSenha=true
    Backend-->>Frontend: 200 OK + {token, mustChangePassword=true}
    
    Frontend-->>Usuário: Redireciona para Trocar Senha
    Usuário->>Frontend: Digita nova senha
    Frontend->>Backend: POST /api/auth/trocar-senha
    Backend->>Backend: Valida força da senha (Zod)
    Backend->>Backend: Hash nova senha
    Backend->>DB: UPDATE usuarios SET senhaHash=?, exigeTrocaSenha=false
    Backend-->>Frontend: 200 OK
    Frontend-->>Usuário: ✅ Acesso concedido. Bem-vindo!
```

### 5️⃣ **Fluxo: Expedição de Contentor**

```mermaid
sequenceDiagram
    participant Operador as 👤 Operador
    participant Mobile as 📱 Mobile
    participant Backend as ⚙️ Backend
    participant DB as 🗄️ PostgreSQL
    
    Operador->>Mobile: Clica "Iniciar Expedição"
    Operador->>Mobile: Escaneia QR do Contentor
    Mobile->>Backend: GET /api/contentores/{serie}
    Backend->>DB: SELECT * WHERE numeroSerie = ?
    DB-->>Backend: Contentor {status: 'DISPONIVEL', ...}
    
    Mobile->>Backend: GET /api/checklist-templates/ativo?tipo=EXPEDICAO
    Backend->>DB: SELECT template ativo EXPEDICAO
    DB-->>Backend: Template + Revisão Aprovada
    Mobile-->>Operador: Exibe formulário expedição (tampa, vedação, lacres, produto, cliente)
    
    Operador->>Mobile: Preenche campos
    Mobile->>Backend: POST /api/checklists/expedicao
    Backend->>Backend: evaluateStatusFromTemplate(respostas, template)
    Backend->>Backend: statusResultante = DISPONIVEL | MANUTENCAO_EXTERNA | RETIDO?
    
    alt Status OK
        Backend->>DB: INSERT checklists_expedicao
        Backend->>DB: UPDATE contentores SET status = statusResultante
        Backend->>DB: INSERT status_historico
        Backend-->>Mobile: 200 OK
        Mobile-->>Operador: ✅ Expedição Registrada. Contentor DISPONÍVEL
    else Issues Detectadas
        Backend->>DB: INSERT checklists_expedicao
        Backend->>DB: UPDATE contentores SET status = 'RETIDO'
        Backend->>DB: INSERT notificacoes (tipo='CONTENTOR_RETIDO')
        Backend-->>Mobile: 200 OK + {statusResultante: 'RETIDO', motivo}
        Mobile-->>Operador: ⚠️ Contentor retido. Notificação enviada.
    end
```

---

## Diagramas Adicionais Sugeridos

### 1️⃣ **Diagrama de Estados do Contentor**

```mermaid
stateDiagram-v2
    [*] --> DISPONIVEL: Criado
    
    DISPONIVEL --> EM_CICLO: Expedição OK
    DISPONIVEL --> MANUTENCAO_INTERNA: Requisição Interna
    DISPONIVEL --> EM_LIMPEZA: Requisição de Limpeza
    DISPONIVEL --> REPROVADO_INTEGRIDADE: Checklist Recebimento Falhou
    DISPONIVEL --> REPROVADO_VENCIDO: Testes Vencidos
    
    EM_LIMPEZA --> DISPONIVEL: Limpeza Concluída
    EM_LIMPEZA --> MANUTENCAO_INTERNA: Problema Detectado
    
    EM_CICLO --> DISPONIVEL: Produção Completa
    EM_CICLO --> EM_LIMPEZA: Checklist de Retorno
    
    REPROVADO_INTEGRIDADE --> MANUTENCAO_EXTERNA: Defeito
    REPROVADO_INTEGRIDADE --> DISPONIVEL: Reparo Aprovado
    REPROVADO_VENCIDO --> MANUTENCAO_EXTERNA: Recalibração
    
    REPROVADO_SUJO --> EM_LIMPEZA: Limpeza Solicitada
    
    MANUTENCAO_INTERNA --> DISPONIVEL: Manutenção Concluída
    MANUTENCAO_EXTERNA --> DISPONIVEL: Retorno Executor Externo
    
    RESERVADO_PRODUCAO --> EM_CICLO: Começa Produção
    RESERVADO_PRODUCAO_EM_LIMPEZA --> EM_CICLO: Pronto Produção
    
    RETIDO --> [*]: Rejeitado (Raramente retorna)
    
    note right of DISPONIVEL
        Estado primário
        Pronto para usar
    end note
    
    note right of EM_LIMPEZA
        Requer limpeza
        Antes próximo uso
    end note
    
    note right of REPROVADO_INTEGRIDADE
        Tampa, vedação ou lacre
        Comprometidos
    end note
```

### 2️⃣ **Diagrama de Componentes Frontend**

```mermaid
graph TB
    subgraph "🖥️ Desktop Interface"
        Dashboard["📊 Dashboard"]
        TemplateEditor["📝 Editor de Templates"]
        ChecklistManager["✅ Gerenciar Checklists"]
        UserAdmin["👥 Gestão de Usuários"]
        Reports["📈 Relatórios"]
    end
    
    subgraph "📱 Mobile Interface"
        QRScanner["📷 QR Scanner"]
        ChecklistForm["📋 Formulário Checklist"]
        StatusView["🔍 Ver Status"]
        CleaningTracker["🧹 Rastrear Limpeza"]
    end
    
    subgraph "🔐 Autenticação"
        LoginPage["🔑 Login"]
        PermissionCheck["🔒 Verificar Permissão"]
    end
    
    subgraph "⚙️ Backend API"
        AuthAPI["Auth Routes"]
        ContentAPI["Contentor Routes"]
        ChecklistAPI["Checklist Routes"]
        UserAPI["User Routes"]
        CleaningAPI["Limpeza Routes"]
    end
    
    subgraph "🗄️ Data Layer"
        PostgreSQL["PostgreSQL"]
        Cache["Session Cache"]
    end
    
    LoginPage --> PermissionCheck
    PermissionCheck --> Dashboard
    PermissionCheck --> QRScanner
    
    Dashboard --> UserAdmin
    Dashboard --> Reports
    UserAdmin --> UserAPI
    Reports --> ContentAPI
    
    TemplateEditor --> ChecklistAPI
    ChecklistManager --> ChecklistAPI
    
    QRScanner --> ContentAPI
    ChecklistForm --> ChecklistAPI
    StatusView --> ContentAPI
    CleaningTracker --> CleaningAPI
    
    AuthAPI --> PostgreSQL
    ContentAPI --> PostgreSQL
    ChecklistAPI --> PostgreSQL
    UserAPI --> PostgreSQL
    CleaningAPI --> PostgreSQL
    
    AuthAPI --> Cache
```

### 3️⃣ **Diagrama de Fluxo de Dados (DFD)**

```mermaid
graph LR
    User["👤 Usuário"]
    FrontEnd["🖥️ Frontend<br/>React + Next.js"]
    Backend["⚙️ Backend<br/>API Routes"]
    Database["🗄️ PostgreSQL"]
    Email["📧 Email<br/>Resend"]
    Externo["🌐 Externo<br/>QR Code"]
    
    User -->|Interação| FrontEnd
    FrontEnd -->|Requisição HTTP| Backend
    Backend -->|Query/Insert| Database
    Database -->|Resultado| Backend
    Backend -->|JSON Response| FrontEnd
    FrontEnd -->|Render| User
    
    Backend -->|Trigg. Evento| Email
    Externo -->|Scanneia| User
    User -->|Entrada Número| FrontEnd
```

### 4️⃣ **Diagrama de Arquitetura em Camadas**

```mermaid
graph TB
    subgraph "Presentation Layer"
        Web["🖥️ Web Desktop<br/>Next.js App Router"]
        Mobile["📱 Mobile Responsivo<br/>SSR/SSG"]
    end
    
    subgraph "Application Layer"
        AuthService["🔐 Auth Service<br/>(JWT, Sessões)"]
        ChecklistService["✅ Checklist Service<br/>(Motor de Status)"]
        ContentorService["📦 Contentor Service"]
        LimpezaService["🧹 Limpeza Service"]
        UserService["👥 User Service"]
    end
    
    subgraph "Data Layer"
        ORM["🗄️ Drizzle ORM"]
        PostgreSQL["PostgreSQL"]
    end
    
    subgraph "External Services"
        EmailService["📧 Resend"]
        QRService["📷 HTML5 QRCode"]
    end
    
    Web --> AuthService
    Web --> ChecklistService
    Web --> ContentorService
    Web --> UserService
    
    Mobile --> AuthService
    Mobile --> ChecklistService
    Mobile --> ContentorService
    Mobile --> LimpezaService
    
    AuthService --> ORM
    ChecklistService --> ORM
    ContentorService --> ORM
    UserService --> ORM
    LimpezaService --> ORM
    
    ORM --> PostgreSQL
    
    AuthService --> EmailService
    UserService --> EmailService
    LimpezaService --> EmailService
    
    ChecklistService --> QRService
```

### 5️⃣ **Diagrama de Governança de Templates**

```mermaid
stateDiagram-v2
    [*] --> RASCUNHO: Novo
    
    RASCUNHO --> RASCUNHO: Editar Seções/Campos
    RASCUNHO --> PENDENTE_APROVACAO: Submeter
    RASCUNHO --> [*]: Descartar
    
    PENDENTE_APROVACAO --> APROVADO: Admin Aprova
    PENDENTE_APROVACAO --> REJEITADO: Admin Rejeita
    
    APROVADO --> [*]: Ativado
    APROVADO --> RASCUNHO: Nova Revisão (v+1)
    
    REJEITADO --> RASCUNHO: Voltar para Edição
    REJEITADO --> [*]: Finalizado
    
    note right of RASCUNHO
        Apenas criador vê
        Sem autoaprovação
    end note
    
    note right of PENDENTE_APROVACAO
        Notif. ADMIN
        Pode comparecer versões
    end note
    
    note right of APROVADO
        Ativo para coletas
        Histórico preservado
    end note
```

### 6️⃣ **Matriz de Permissões por Perfil**

```mermaid
graph LR
    Admin["<b style='font-size:16px'>👨‍💻 ADMIN</b><br/>Gestão Total"]
    Analista["<b style='font-size:16px'>👨‍💼 ANALISTA</b><br/>Gestão Parcial"]
    Operador["<b style='font-size:16px'>👤 OPERADOR</b><br/>Execução"]
    
    Admin -->|Criar Template| R1["✅ Sim"]
    Analista -->|Criar Template| R2["✅ Sim"]
    Operador -->|Criar Template| R3["❌ Não"]
    
    Admin -->|Aprovar Template| R4["✅ Sim (Obrigatório)"]
    Analista -->|Aprovar Template| R5["❌ Não"]
    Operador -->|Aprovar Template| R6["❌ Não"]
    
    Admin -->|Executar Checklist| R7["✅ Sim"]
    Analista -->|Executar Checklist| R8["✅ Sim"]
    Operador -->|Executar Checklist| R9["✅ Sim"]
    
    Admin -->|Aprovar Usuário| R10["✅ Sim"]
    Analista -->|Aprovar Usuário| R11["❌ Não"]
    Operador -->|Aprovar Usuário| R12["❌ Não"]
    
    Admin -->|Ver Dashboard| R13["✅ Sim (Completo)"]
    Analista -->|Ver Dashboard| R14["✅ Sim (Parcial)"]
    Operador -->|Ver Dashboard| R15["✅ Sim (Meu)"]
```

---

## Ferramentas Recomendadas

### 📊 Comparação de Ferramentas

| Ferramenta | Tipo | Vantagens | Desvantagens | Melhor Para |
|---|---|---|---|---|
| **Mermaid** | Texto/Markdown | Integrado ao VS Code, Git-friendly, Versionável | Menos visual, layout às vezes confuso | ✅ Este projeto |
| **Draw.io** | Visual/Web | Muito visual, drag-drop, export múltiplos formatos | Cloud-based, pode exigir login | ER e fluxos complexos |
| **Lucidchart** | Visual/Web | Professional, templates, colaborativo | Pago, exigir conta | Apresentações executivas |
| **Creately** | Visual/Web | Intuitivo, templates, integração Jira | Pago, menos poderoso | Brainstorm rápido |
| **PlantUML** | Texto | Git-friendly, código limpo | Curva de aprendizado | Diagramas UML formais |
| **Excalidraw** | Visual/Web | Estilo sketch, open-source, rápido | Menos formal | Design e ideação |

### 🎯 Recomendação para Este Projeto

**Mermaid (Texto) + Draw.io (Visual)**

1. **Mermaid** para:
   - ER (cardinality, relacionamentos)
   - Fluxos de estado (stateDiagram)
   - Sequência (interações)
   - Casos de uso (maior clareza)
   - Mantém tudo versionado no Git

2. **Draw.io** para:
   - Arquitetura detalhada (em camadas, componentes)
   - Diagramas de integração (visual premium)
   - Exportar para imagem (apresentações)
   - Colaboração em tempo real

### ▶️ Como Usar Mermaid no VS Code

1. **Instalar extensão:**
   ```bash
   code --install-extension Markdown Preview Mermaid Support
   ```

2. **Criar diagrama em .md:**
   ````markdown
   ```mermaid
   graph LR
       A --> B
   ```
   ````

3. **Previsuallizar:**
   - <kbd>Ctrl+Shift+V</kbd> (ou <kbd>Cmd+Shift+V</kbd> no Mac)

### ▶️ Como Usar Draw.io

1. **Acesso online:** https://draw.io (gratuito)
2. **VS Code:** Extensão "Draw.io Integration"
3. **Colaborativo:** Google Drive, OneDrive (salvar integrado)
4. **Export:** PNG, PDF, SVG para documentação

---

## Guia Prático: Como Criar Cada Diagrama

### 📌 1. Diagrama Entidade-Relacionamento (ER)

#### **Objetivo**
Mostrar todas as tabelas, colunas, tipos de dados, e como se relacionam.

#### **Passo a Passo (Mermaid)**

```markdown
1. Listar todas as entidades (tabelas)
2. Para cada uma, adicionar: PK (chave primária), FK (estrangeira), tipos
3. Adicionar relacionamentos com cardinalidade (1:N, N:N, etc.)
4. Usar notação ER padrão: || (1) -- o{ (N)

Exemplo:
USUARIOS ||--o{ SESSIONS : "cria"
```

#### **Verificação**
- [ ] Todas as tabelas estão presentes?
- [ ] PKs e FKs estão marcados?
- [ ] Cardinalidades fazem sentido (1 usuário → N sessões)?
- [ ] Constraints importantes estão documentados?

---

### 📌 2. Diagrama de Caso de Uso

#### **Objetivo**
Mostrar atores (usuários), casos de uso (ações), e extensões/inclusões.

#### **Passo a Passo (Mermaid)**

```markdown
1. Identificar ATORES (ADMIN, ANALISTA, OPERADOR)
2. Identificar CASOS DE USO por ator (criar template, executar checklist)
3. Usar setas para ligações:
   - ator --> (caso de uso)
4. Adicionar extensões com (..) -.-> (caso base)
5. Agrupar em subgrafos se necessário

Exemplo:
OPERADOR --> (CK1: Escanear QR)
ANALISTA --> (CK5: Criar Template)
(CK1: Escanear) -.-> (Validar Série)
```

#### **Verificação**
- [ ] Todos os 3 atores principais estão?
- [ ] Casos de uso descrevem "verbo + substantivo"?
- [ ] Extensões/inclusões estão nítidas?
- [ ] Não há casos de uso apenas de sistema (sem ator)?

---

### 📌 3. Diagrama de Sequência

#### **Objetivo**
Mostrar fluxo timeline de um processo (ex: checklist de recebimento).

#### **Passo a Passo (Mermaid)**

```markdown
1. Identificar ATORES e SISTEMAS no início (participant)
2. Seqüência de mensagens:
   - Ator ->> Sistema: Ação (seta grossa = síncronimo)
   - Sistema -->> Ator: Resposta (pontilhado = assíncrono)
   - Sistema ->> DB: Query (interno)
3. Adicionar notas com 'Note over participante: texto'
4. Adicionar alternativas com 'alt ... else ... end'
5. Loops com 'loop ... end'

Exemplo:
Operador ->> Mobile: Escaneia QR
Mobile ->> Backend: GET /api/contentores/{serie}
Backend ->> DB: SELECT * WHERE numeroSerie = ?
DB -->> Backend: Resultado
Backend -->> Mobile: 200 OK + {conteúdo}
```

#### **Verificação**
- [ ] Ordem temporal faz sentido (causa → efeito)?
- [ ] Todos os passos técnicos estão (API, BD)?
- [ ] Respostas OK e erros estão cobertos (alt/else)?
- [ ] Nomes de endpoints são realistas?

---

### 📌 4. Diagrama de Estados

#### **Objetivo**
Mostrar todos os possíveis estados de uma entidade e transições.

#### **Passo a Passo (Mermaid)**

```markdown
1. Identificar TODOS os estados (ex: 13 status do contentor)
2. Definir TRANSIÇÕES válidas:
   - DISPONIVEL --> EM_LIMPEZA (requisição)
   - EM_LIMPEZA --> DISPONIVEL (conclusão)
3. Marcar entrada [*] e saída final [*]
4. Colocar condições de transição se relevante
5. Adicionar notas explicativas

Exemplo:
[*] --> DISPONIVEL
DISPONIVEL --> EM_LIMPEZA: Requisição
EM_LIMPEZA --> DISPONIVEL: Conclusão
DISPONIVEL --> [*]
note right of EM_LIMPEZA
    Estado transitório
end note
```

#### **Verificação**
- [ ] Todos os estados estão presentes?
- [ ] Transições não permitidas estão ausentes?
- [ ] Estado inicial e final estão nítidos?
- [ ] Campos de negócio (datas, responsáveis) estão mapeados?

---

### 📌 5. Diagrama de Arquitetura (Camadas)

#### **Objetivo**
Mostrar estrutura de software em lógica de camadas.

#### **Passo a Passo (Draw.io ou Mermaid graph)**

```markdown
1. Camada PRESENTATION (UI, Frontend)
2. Camada APPLICATION (Serviços, Lógica)
3. Camada DATA (Banco, ORM)
4. Camada EXTERNAL (APIs externas, email)

5. Desenhar fluxo top-down:
   Presentation --> Application --> Data
   Application -.-> External

Exemplo:
subgraph "Presentation Layer"
    Web["🖥️ Web Desktop"]
    Mobile["📱 Mobile"]
end
subgraph "Application Layer"
    AuthService["Auth"]
end
subgraph "Data Layer"
    PostgreSQL["PostgreSQL"]
end

Web --> AuthService
AuthService --> PostgreSQL
```

#### **Verificação**
- [ ] Cada camada tem uma responsabilidade nítida?
- [ ] Dependências fluem de cima para baixo (não ao contrário)?
- [ ] Serviços externos estão isolados?
- [ ] Camadas de integração estão claras?

---

### 📌 6. Matriz de Permissões

#### **Objetivo**
Documentar quem pode fazer o quê (RBAC — Role-Based Access Control).

#### **Passo a Passo**

```markdown
| Ação | ADMIN | ANALISTA | OPERADOR |
|---|---|---|---|
| Criar Template | ✅ | ✅ | ❌ |
| Aprovar Template | ✅ | ❌ | ❌ |
| Executar Checklist | ✅ | ✅ | ✅ |
| Aprovar Usuário | ✅ | ❌ | ❌ |

OU em Mermaid (graph):
ADMIN -->|Pode| AproverTemplate
ANALISTA -->|Pode| CriarTemplate
OPERADOR -->|Pode| ExecutarChecklist
```

#### **Verificação**
- [ ] Cada perfil tem pelo menos uma ação exclusiva?
- [ ] Não há escalação de permissão (OPERADOR não aprova)?
- [ ] Hierarquia faz sentido (ADMIN ⊇ ANALISTA ⊇ OPERADOR)?

---

### 📌 7. Fluxograma de Processo

#### **Objetivo**
Mostrar fluxo passo-a-passo de um processo (não timeline, mas lógica condicional).

#### **Passo a Passo (Mermaid flowchart)**

```markdown
flowchart TD
    Start([Início])
    Condição{Checklist OK?}
    Sucesso["✅ Status = APROVADO"]
    Falha["❌ Status = REPROVADO"]
    Fim([Fim])
    
    Start --> Condição
    Condição -->|Sim| Sucesso
    Condição -->|Não| Falha
    Sucesso --> Fim
    Falha --> Fim

Notação:
- ([Start/End]) = Óvalo
- [Processo] = Retângulo
- {Decisão} = Losango
- --> = Fluxo
```

#### **Verificação**
- [ ] Cada decisão tem pelo menos 2 caminhos?
- [ ] Há um fim definido?
- [ ] Loops ou iterações estão marcados?
- [ ] Nenhama seta cruza sem necessidade (reorganizar)?

---

### 📌 Dicas de Manutenção

1. **Atualize diagramas ao adicionar entidades.**
   ```bash
   # Após adicionar tabela nova
   git add DIAGRAMAS_E_DOCUMENTACAO_SISTEMA.md
   git commit -m "docs: adiciona entidade Foo ao diagrama ER"
   ```

2. **Versione com o código.**
   ```markdown
   # Este arquivo está no repo e versionado
   src/drizzle/schema.ts → DIAGRAMAS_E_DOCUMENTACAO_SISTEMA.md
   ```

3. **Revisite periodicamente.**
   - A cada sprint ou milestone, valide fluxos contra implementação.

---

## 📝 Checklist de Completude

Antes de finalizar a documentação do seu projeto:

- [ ] **ER Diagrama:** Todas as 11 tabelas presentes?
- [ ] **Casos de Uso:** 3 atores, >5 cenários por ator?
- [ ] **Sequência:** 5 fluxos críticos documentados?
- [ ] **Estados:** Transições válidas e inválidas claras?
- [ ] **Arquitetura:** Camadas e dependencies nítidas?
- [ ] **Permissões:** Matriz RBAC completa?
- [ ] **Glossário:** Termos-chave definidos?

---

## 🎓 Referências e Recursos

### Padrões UML
- **OMG UML Standard:** https://www.omg.org/
- **Lucidchart Symbols:** https://www.lucidchart.com/pages/uml-symbols

### Ferramentas
- **Mermaid Docs:** https://mermaid.js.org/
- **Draw.io Docs:** https://www.drawio.com/
- **PlantUML Guide:** https://plantuml.com/

### Exemplos
- **Mermaid Examples:** https://github.com/mermaid-js/mermaid/tree/develop/demos
- **Real-world ER:** PostgreSQL documentation

---

## 📞 Próximos Passos

1. **Incorporar ferramentas sugeridas:**
   - [ ] Instale extensão Mermaid no VS Code
   - [ ] Crie conta no Draw.io (ou use localmente)

2. **Refinar diagramas:**
   - [ ] Valide cada diagrama contra código atual
   - [ ] Preencha lacunas identificadas

3. **Documentar decisões:**
   - [ ] ADR (Architecture Decision Records) para escolhas principais
   - [ ] Padrões de design (ex: padrão de status, governança)

4. **Manter vivo:**
   - [ ] Revise a cada feature nova
   - [ ] Distribua com equipe (Confluence, GitHub Wiki)

---

**Gerado em:** 2 de abril de 2026  
**Versão:** 1.0  
**Status:** Pronto para Uso  

