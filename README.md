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

- Node.js 20+
- PostgreSQL 14+
- npm ou yarn

---

## 4. Setup

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

---

## 10. Deploy

### Railway

1. Crie um projeto no [Railway](https://railway.app)
2. Adicione um serviço PostgreSQL
3. Deploy do repositório GitHub
4. Configure as variáveis de ambiente
5. Execute `npm run db:migrate && npm run db:seed` via Railway CLI ou painel

### Vercel

1. Importe o repositório no [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente no painel
3. Use um PostgreSQL externo (Railway, Neon, Supabase)
4. Execute migrações manualmente após o primeiro deploy:
   ```bash
   npx drizzle-kit migrate
   ```