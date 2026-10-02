# Guia de implementacao

Este repositorio e um template do quiz de tarot. Nenhuma credencial, projeto Supabase, dominio, Pixel ou conta de pagamentos vem configurado.

## 1. Requisitos

- Node.js 20 ou superior
- Conta na Vercel
- Projeto novo no Supabase
- Conta e chave de API da ConnectPay
- Chave da OpenAI para gerar as leituras
- Supabase CLI via `npx supabase`

## 2. Preparar o projeto local

```bash
git clone https://github.com/ThebossakaDiogo/quiz-tarot-backup.git
cd quiz-tarot-backup
npm ci
```

Copie `.env.example` para `.env` e preencha localmente. O arquivo `.env` esta ignorado pelo Git e nunca deve ser enviado ao repositorio.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

## 3. Variaveis de ambiente

| Variavel | Obrigatoria | Destino | Descricao |
|---|---:|---|---|
| `SUPABASE_URL` | Sim | Vercel | Project URL do novo Supabase |
| `SUPABASE_ANON_KEY` | Sim | Vercel | Chave publica `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Vercel | Chave secreta `service_role`; nunca usar no frontend |
| `CONNECTPAY_API_SECRET` | Sim | Vercel e Supabase Secrets | Chave secreta da ConnectPay |
| `CONNECTPAY_WEBHOOK_URL` | Sim | Vercel | URL da Edge Function `checkout-webhook` |
| `SITE_BASE_URL` | Sim | Vercel | Dominio publico, sem barra final |
| `OPENAI_API_KEY` | Sim | Vercel | Chave usada pela API de leituras |
| `OPENAI_MODEL` | Nao | Vercel | Modelo; se vazio, usa `gpt-4o-mini` |
| `DATABASE_URL` | Nao | Local | String PostgreSQL para operacoes administrativas |
| `SUPABASE_ACCESS_TOKEN` | Deploy | Somente local | Personal Access Token iniciado por `sbp_` |
| `SUPABASE_DB_PASSWORD` | Deploy | Somente local | Senha do banco do projeto Supabase |
| `META_PIXEL_ID` | Nao | Conforme integracao | Reservado para configurar seu proprio Pixel |
| `META_ACCESS_TOKEN` | Nao | Supabase/Vercel | Reservado para sua integracao CAPI |

Nunca configure `SUPABASE_ACCESS_TOKEN` ou `SUPABASE_DB_PASSWORD` na Vercel.

## 4. Criar e preparar o Supabase

1. Crie um projeto novo em `https://supabase.com/dashboard`.
2. Copie o Project URL, a chave `anon`, a chave `service_role` e a senha do banco.
3. Crie um Personal Access Token em `https://supabase.com/dashboard/account/tokens`. Ele deve iniciar por `sbp_`.
4. Autentique e vincule o projeto:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
```

5. Aplique todas as tabelas, politicas e indices:

```bash
npx supabase db push
```

As migracoes criam:

- `orders`
- `quiz_funnel_leads`
- `consultation_schedules`
- `analytics_events`

## 5. Configurar e publicar o webhook Supabase

Cadastre a chave da ConnectPay nos secrets do Supabase:

```bash
npx supabase secrets set CONNECTPAY_API_SECRET="SUA_CHAVE_CONNECTPAY"
```

Publique a Edge Function. O arquivo `supabase/config.toml` ja declara `verify_jwt = false`, necessario para a ConnectPay chamar o webhook sem token Supabase:

```bash
npx supabase functions deploy checkout-webhook --no-verify-jwt
```

A URL final sera:

```text
https://SEU_PROJECT_REF.supabase.co/functions/v1/checkout-webhook
```

Use essa URL em dois lugares:

1. `CONNECTPAY_WEBHOOK_URL` na Vercel.
2. Campo de webhook no painel da ConnectPay.

Teste apenas a existencia da funcao:

```bash
curl -i https://SEU_PROJECT_REF.supabase.co/functions/v1/checkout-webhook
```

Uma resposta `405 Metodo nao permitido` confirma que a funcao existe. `404` significa que ela ainda nao foi publicada.

## 6. Configurar a ConnectPay

1. Obtenha o API Secret na conta correta.
2. Cadastre a URL Supabase acima como webhook.
3. Defina o mesmo secret como `CONNECTPAY_API_SECRET` na Vercel e nos Supabase Secrets.
4. Nao altere precos pelo frontend. O catalogo autorizado fica em `api/create-pix.js`.

## 7. Configurar a Vercel

1. Importe este repositorio na Vercel.
2. Use a branch `main`.
3. O framework sera detectado como Vite e `vercel.json` usara `dist` como saida.
4. Adicione as variaveis obrigatorias em **Settings > Environment Variables** para Production, Preview e Development conforme necessario.
5. Faca o deploy.
6. Atualize `SITE_BASE_URL` com o dominio definitivo e realize um redeploy.

Variaveis minimas da Vercel:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CONNECTPAY_API_SECRET
CONNECTPAY_WEBHOOK_URL
SITE_BASE_URL
OPENAI_API_KEY
OPENAI_MODEL
```

## 8. Dominio, SEO e identidade

Antes de publicar para outro cliente, pesquise e substitua no HTML:

- `templodeluz.com`
- `Templo da Luz Amorosa`
- `Milena Medeiros`
- telefone, e-mail e endereco da organizacao
- URLs canonicas, Open Graph e JSON-LD

Esses textos fazem parte do conteudo visual, nao das variaveis de ambiente.

## 9. Pixels e tracking

O template nao inicializa o Pixel Meta nem os loaders Utmify/TikTok da instalacao original. Configure somente IDs pertencentes ao novo projeto. O arquivo `js/tracking-bridge.js` continua preparado para disparar eventos quando `fbq` ou `ttq` forem inicializados por uma integracao nova.

O analytics interno envia eventos para `/api/analytics` e grava em `analytics_events` no Supabase.

## 10. Validacao antes do deploy

```bash
npm test
npm run build
npm audit --omit=dev
```

Depois do deploy, valide:

1. Página inicial e rotas amigaveis.
2. Criacao de um PIX com valor minimo de teste autorizado pela sua conta.
3. Registro do pedido em `orders`.
4. Webhook retornando HTTP 200 após a ConnectPay notificar.
5. Consulta do pagamento mudando para `AUTHORIZED`.
6. Chat bloqueado antes do pagamento e liberado somente depois da confirmacao.
7. Leitura OpenAI e agendamento premium.
8. Eventos gravados em `analytics_events`.

## 11. Seguranca

- Nunca envie `.env`, senhas ou tokens ao GitHub.
- Nunca exponha `service_role`, ConnectPay Secret ou OpenAI no frontend.
- Nao use `sb_secret_` como Personal Access Token. Para o CLI, use um token `sbp_`.
- Mantenha `verify_jwt = false` somente no webhook externo; a funcao valida a transacao diretamente na ConnectPay.
- Revogue imediatamente qualquer chave publicada por engano.
