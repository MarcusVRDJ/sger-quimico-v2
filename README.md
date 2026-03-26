# SGE Químico v2

Sistema de Gerenciamento de Contentores IBC — reescrito com Next.js 15 + TypeScript + Drizzle ORM.

---

## 1. Descrição do Sistema

O SGE Químico v2 é um sistema web para gestão do **ciclo de vida de contentores IBC** (embalagens industriais de aço inoxidável) em uma planta química.

**Interfaces:**
- **Desktop** — para Analistas e Admins (gestão, dashboard, relatórios)
- **Mobile/Responsivo** — para Operadores em campo (checklists, limpeza)

---

## 2. Stack v1 vs v2

| Camada | v1 | v2 |
|--------|----|----|
| Backend | Java 17 + Spring Boot | Next.js 15 API Routes |
| Linguagem | Java + JavaScript/TypeScript (misto) | TypeScript estrito |
| ORM | JPA/Hibernate | Drizzle ORM |
| Banco | PostgreSQL | PostgreSQL |
| Cache/Session | Redis | Tabela `sessions` no PostgreSQL |
| Frontend | Vanilla JS + React (migração parcial) | Next.js 15 App Router |
| UI | CSS customizado | TailwindCSS + shadcn/ui |
| Auth | Spring Security + JWT | jose (JWT) |
| Email | JavaMail | Resend |
| Deploy | Docker (4 serviços) | Vercel / Railway |

---

## 3. Pré-requisitos

- Node.js 20+ (desenvolvimento local)
- PostgreSQL 14+ (desenvolvimento local)
- npm ou yarn
- Docker + Docker Compose (execução em contêiner)

---

## 4. Setup

### 4a. Desenvolvimento local

```bash
# 1. Clone o repositório
git clone https://github.com/MarcusVRDJ/sger-quimico-v2.git
cd sger-quimico-v2

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 4. Crie o banco de dados
createdb sge_quimico_v2

# 5. Rode as migrações
npm run db:generate
npm run db:migrate

# 6. Popule o banco com dados iniciais
npm run db:seed

# 7. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

### 4b. Docker Compose

> **Pré-requisito:** Docker e Docker Compose instalados.

```bash
# 1. Clone o repositório
git clone https://github.com/MarcusVRDJ/sger-quimico-v2.git
cd sger-quimico-v2

# 2. Configure as variáveis de ambiente
cp .env.example .env
# JWT_SECRET é obrigatório — gere um valor seguro:
# openssl rand -base64 32

# 3. Suba os contêineres (app + PostgreSQL)
docker compose up --build -d
```

> O serviço `migrate` executa automaticamente `db:migrate` e `db:seed` antes de iniciar o `app`.

Acesse: http://localhost:3000

### 4c. Docker Compose (Desenvolvimento com Live Reload)

O repositório inclui `docker-compose.override.yml`, então `docker compose up` já sobe o `app` em modo desenvolvimento com hot reload.

Primeira subida (quando precisar reconstruir imagens):

```bash
docker compose up --build
```

No dia a dia (sem rebuild a cada alteração):

```bash
docker compose up
```

As alterações no código são refletidas automaticamente sem rebuild de imagem.

Se preferir usar o arquivo de desenvolvimento explicitamente, este comando continua válido:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Nesse modo:
- alterações em `src/` e demais arquivos do projeto recarregam automaticamente
- o container usa bind mount do diretório local
- `WATCHPACK_POLLING` e `CHOKIDAR_USEPOLLING` ficam habilitados para maior compatibilidade

Para parar:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

**Comandos úteis:**

```bash
# Ver logs da aplicação
docker compose logs -f app

# Parar os serviços
docker compose down

# Parar e remover volume de dados do banco
docker compose down -v
```

---

## 5. Usuários Padrão (Seed)

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@sge.com | senha123 | ADMIN |
| analista@sge.com | senha123 | ANALISTA |
| operador@sge.com | senha123 | OPERADOR |

---

## 6. Perfis e Acessos

| Perfil | Interface | Permissões |
|--------|-----------|-----------|
| **ADMIN** | Desktop + Mobile | Tudo + aprovar/reprovar contas + excluir usuários |
| **ANALISTA** | Desktop | Reservar contentores, emitir requisições de limpeza, dashboard |
| **OPERADOR** | Mobile | Executar checklists (recebimento, expedição) e limpezas |

### Regra por tipo de dispositivo

- `ADMIN`: pode autenticar e navegar em desktop e mobile.
- `ANALISTA`: acesso restrito a desktop.
- `OPERADOR`: acesso restrito a dispositivo móvel.

> A detecção de dispositivo é baseada em `user-agent` e aplicada no login e no middleware de navegação.

---

## 7. Fluxo de Status dos Contentores

### Recebimento (Checklist RECEB-001)
- `APROVADO` — limpo, sem problemas
- `APROVADO_SUJO` — apto mas tem produto anterior, precisa limpeza
- `REPROVADO_VENCIDO` — testes fora da validade
- `REPROVADO_INTEGRIDADE` — falha física ou lacre roto

### Controle de Planta
- `RESERVADO_PRODUCAO` — reservado para produção
- `RESERVADO_PRODUCAO_EM_LIMPEZA` — reservado para produção, em limpeza
- `EM_LIMPEZA` — requisição formal ou operador via QR code
- `MANUTENCAO_INTERNA` — em manutenção interna
- `RESERVADO_USO_INTERNO` — uso interno
- `DISPONIVEL` — disponível para uso

### Expedição (Checklist EXPED-001)
- `EM_CICLO` — liberado para cliente
- `MANUTENCAO_EXTERNA` — vai para revalidadora
- `RETIDO` — problema identificado

---

## 8. Estrutura de Pastas

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # Redirect baseado no perfil
│   ├── globals.css
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── solicitar-acesso/page.tsx
│   ├── (desktop)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── contentores/page.tsx
│   │   ├── contentores/[id]/page.tsx
│   │   ├── limpeza/page.tsx
│   │   └── usuarios/page.tsx
│   ├── (mobile)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── recebimento/page.tsx          # Multi-step (5 etapas)
│   │   ├── expedicao/page.tsx
│   │   └── limpeza/page.tsx
│   └── api/
│       ├── auth/{login,logout,me}/
│       ├── contentores/
│       ├── checklists/{recebimento,expedicao}/
│       ├── limpeza/
│       ├── notificacoes/
│       └── usuarios/
├── components/
│   ├── layout/{Sidebar,MobileNav,Header}.tsx
│   ├── contentores/{ContentorTable,StatusBadge}.tsx
│   ├── checklists/{ChecklistRecebimento,ChecklistExpedicao}.tsx
│   └── dashboard/StatsCards.tsx
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── email.ts
│   ├── checklist-logic.ts
│   └── utils.ts
└── drizzle/
    ├── schema.ts
    └── seed.ts

middleware.ts
```

---

## 9. Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `JWT_SECRET` | Chave secreta para JWT (mínimo 32 caracteres) |
| `RESEND_API_KEY` | API key do Resend para envio de emails |
| `RESEND_FROM_EMAIL` | Email remetente |
| `ADMIN_EMAIL` | Email do administrador (notificações) |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação |
| `NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS` | Lista separada por vírgula de origens permitidas para Server Actions (formato `host:porta`, sem protocolo) |
| `AUTH_COOKIE_SECURE` | Força cookie `Secure` (`true`/`false`). Em teste mobile via IP local/HTTP, usar `false` |
| `RUN_SEED` | Controla seed automático no container `migrate` (`true`/`false`) |

---

## 10. Deploy

### Railway

1. Crie um projeto no [Railway](https://railway.app)
2. Adicione um serviço PostgreSQL
3. Deploy do repositório GitHub
4. Configure as variáveis de ambiente
5. Execute `npm run db:migrate` via Railway CLI ou painel
6. Execute `npm run db:seed` somente quando necessário (bootstrap inicial)

#### Checklist de Deploy (Railway)

Pré-deploy:

- [ ] Serviço PostgreSQL criado e conectado ao projeto.
- [ ] `DATABASE_URL` disponível para o serviço da aplicação.
- [ ] `JWT_SECRET` configurado com valor seguro (mínimo 32 caracteres).
- [ ] `NEXT_PUBLIC_APP_URL` apontando para o domínio público do Railway.
- [ ] `NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS` configurado com `host:porta` do domínio público (sem protocolo).
- [ ] `AUTH_COOKIE_SECURE=true` em produção.
- [ ] `RUN_SEED=false` em produção (habilitar seed apenas para bootstrap inicial).
- [ ] `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `ADMIN_EMAIL` configurados (se fluxo de email estiver ativo).

Deploy inicial:

- [ ] Primeiro deploy concluído com sucesso no Railway.
- [ ] Migração executada: `npm run db:migrate`.
- [ ] Seed executado somente se necessário: `npm run db:seed`.

Validação pós-deploy:

- [ ] `GET /api/health` responde `200`.
- [ ] Login funcional com usuário válido.
- [ ] Endpoint protegido sem token retorna `401` (ex.: `/api/contentores`).
- [ ] Navegação desktop/mobile sem loop de redirecionamento.

### Vercel

1. Importe o repositório no [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente no painel
3. Use um PostgreSQL externo (Railway, Neon, Supabase)
4. Execute migrações manualmente após o primeiro deploy:
   ```bash
   npx drizzle-kit migrate
   ```
5. Configure `NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS` com o domínio público da aplicação (ex.: `sge.empresa.com`)

### Health Check (Deploy)

- Endpoint: `GET /api/health`
- Não exige autenticação
- Retorna `200` quando a aplicação está no ar (liveness)

Resposta esperada:

```json
{
    "status": "ok",
    "service": "sge-quimico-v2",
    "timestamp": "2026-03-25T12:34:56.000Z"
}
```