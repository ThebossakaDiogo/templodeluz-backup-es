# Transferência do projeto para uma nova operação LATAM

Este guia prepara uma instalação isolada. O repositório contém o código completo, mas não contém credenciais reais, dados de produção nem vínculos locais da Vercel e do Supabase.

## 1. Serviços que devem ser novos

- Repositório GitHub da operação.
- Projeto Vercel do quiz.
- Projeto Vercel do dashboard.
- Projeto Supabase e banco PostgreSQL.
- Conta ou credencial ConnectPay/Stripe permitida no país.
- Webhooks exclusivos da nova operação.
- Pixel e token Meta CAPI próprios.
- Conta e token UTMIFY próprios.
- Instância Evolution API própria.
- Chave Gemini própria.

Não copie secrets da operação brasileira para o novo ambiente.

## 2. Clonar e validar

```bash
git clone URL_DO_NOVO_REPOSITORIO
cd templodeluz
bun install --frozen-lockfile
bun run build

cd dashboard
bun install --frozen-lockfile
bun run build

cd ../api-pix
npm ci
npm test
npm run typecheck
```

## 3. Criar o Supabase

```bash
cd api-pix
npx supabase login
npx supabase link --project-ref NOVO_PROJECT_REF
npx supabase db push --linked
```

As migrations em `api-pix/supabase/migrations/` criam tabelas, políticas, produtos, telemetria, outboxes Meta/UTMIFY e WhatsApp Chat.

## 4. Configurar secrets das Edge Functions

```bash
cd api-pix
cp .env.example .env.local
# Preencha .env.local no seu computador
npx supabase secrets set --env-file .env.local --project-ref NOVO_PROJECT_REF
```

Publique as funções:

```bash
npx supabase functions deploy create-connectpay-pix --project-ref NOVO_PROJECT_REF
npx supabase functions deploy get-connectpay-pix-status --project-ref NOVO_PROJECT_REF
npx supabase functions deploy connectpay-webhook --project-ref NOVO_PROJECT_REF
npx supabase functions deploy process-meta-conversions --project-ref NOVO_PROJECT_REF
npx supabase functions deploy create-stripe-checkout --project-ref NOVO_PROJECT_REF
npx supabase functions deploy stripe-webhook --project-ref NOVO_PROJECT_REF
npx supabase functions deploy dashboard-profile-data --project-ref NOVO_PROJECT_REF
npx supabase functions deploy whatsapp-chat-admin --project-ref NOVO_PROJECT_REF
npx supabase functions deploy whatsapp-chat-webhook --project-ref NOVO_PROJECT_REF
npx supabase functions deploy whatsapp-chat-gemini --project-ref NOVO_PROJECT_REF
```

## 5. Pontos específicos da operação

Antes de publicar uma variante LATAM, revise em uma branch própria:

- `src/lib/pix-config.ts`: projeto Supabase, chave pública, origem do quiz e conta lógica PIX.
- `src/routes/__root.tsx`: domínio canônico, Pixel Meta e metadados.
- `src/routes/index.tsx`: preconnect do Supabase e eventual roteamento por origem.
- `dashboard/.env.local`: projetos exibidos no OD Metrics.
- `.github/workflows/deploy-production.yml`: variables do novo projeto Vercel.
- Números de WhatsApp, e-mails, CNPJ/endereço, textos legais e moeda.
- Valores dos produtos no banco, nunca apenas no frontend.

Esses pontos são específicos de produção. Faça a troca conscientemente e nunca misture bancos, webhooks ou contas de pagamento entre países.

## 6. Configurar Vercel e GitHub

No novo repositório, cadastre:

- Secret GitHub `VERCEL_TOKEN`.
- Variable GitHub `VERCEL_ORG_ID`.
- Variable GitHub `VERCEL_PROJECT_ID`.

No dashboard da Vercel, configure as variáveis públicas descritas nos arquivos `.env.example`. Não envie secrets privados como variáveis `VITE_`.

## 7. Homologação obrigatória

Antes de tráfego real:

- Abrir o quiz em Android, iPhone e desktop.
- Validar início, respostas, resultado e opção gratuita.
- Criar PIX usando a mesma origem e chave pública do frontend.
- Confirmar que payload inválido chega à validação HTTP 400, nunca 401/403.
- Pagar uma cobrança de teste e validar status, Meta e UTMIFY.
- Validar Stripe e webhook assinado, quando usado.
- Simular reembolso e chargeback.
- Validar dashboard, RLS e login administrativo.
- Conectar a instância WhatsApp correta e testar entrada e saída.
- Conferir idioma, moeda, fuso horário, políticas legais e consentimento do país.

## 8. O que não entra no Git

- `.env`, `.env.local` e `.env.vercel`.
- Tokens Supabase, ConnectPay, Stripe, Meta, UTMIFY, Evolution ou Gemini.
- Dados e dumps de produção.
- Diretórios `node_modules`, `.vercel`, `.supabase/.temp` e builds locais.

Guarde credenciais em um gerenciador de segredos e configure-as diretamente nos provedores.
