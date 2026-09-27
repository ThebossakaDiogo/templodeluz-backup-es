# Templo de Luz

Monorepositório operacional do Templo de Luz. O Git contém o frontend do quiz, dashboard OD Metrics, backend Supabase, migrations, Edge Functions, checkout auxiliar e assets necessários. Credenciais reais e arquivos locais permanecem fora do repositório.

## Módulos

| Diretório | Responsabilidade | Stack |
| --- | --- | --- |
| `/` | Quiz, resultado, checkout PIX/cartão e páginas públicas | TanStack Start, React 19, Tailwind CSS 4 |
| `dashboard/` | OD Metrics, funil, pedidos e WhatsApp Chat | React, Vite, Supabase |
| `api-pix/` | Banco, migrations e Edge Functions | Supabase CLI, Deno, TypeScript |
| `checkout-card/` | Referência auxiliar do checkout por cartão | HTML e Google Apps Script |

## Requisitos

- Bun 1.3 ou Node.js 22+
- Supabase CLI 2.39+
- Docker apenas para executar o Supabase localmente
- Uma conta Vercel para publicar o frontend e o dashboard

## Frontend principal

```bash
bun install --frozen-lockfile
bun run dev
bun run build
```

Alternativa com npm:

```bash
npm install
npm run dev
npm run build
```

## Dashboard

```bash
cd dashboard
bun install --frozen-lockfile
cp .env.example .env.local
bun run build
```

## Backend Supabase

```bash
cd api-pix
npm ci
cp .env.example .env.local
npm test
npm run typecheck
```

Para criar um ambiente novo, siga `docs/LATAM-SETUP.md`. Não reutilize credenciais, webhooks ou contas de pagamento da produção em outro país ou operação.

## Arquivos de ambiente

- `.env.example`: variáveis públicas opcionais do frontend.
- `dashboard/.env.example`: conexões públicas do OD Metrics.
- `api-pix/.env.example`: secrets usados pelas Edge Functions.
- `.env`, `.env.local` e `.env.vercel`: sempre ignorados pelo Git.

## Segurança

- Chaves privadas nunca usam prefixo `VITE_`.
- O navegador recebe somente chaves públicas/publishable.
- Valores e produtos de pagamento são validados no backend.
- O banco deve ser criado aplicando `api-pix/supabase/migrations/` na ordem registrada.
- Cada nova operação deve ter seus próprios Supabase, Vercel, ConnectPay/Stripe, Meta, UTMIFY, Evolution e Gemini.

## Deploy

O workflow `.github/workflows/deploy-production.yml` publica o frontend principal. Em outro repositório, configure:

- Secret `VERCEL_TOKEN`
- Variable `VERCEL_ORG_ID`
- Variable `VERCEL_PROJECT_ID`

Sem essas configurações, não habilite o workflow no projeto novo.
